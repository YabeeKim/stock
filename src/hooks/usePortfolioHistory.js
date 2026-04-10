import { useState, useEffect } from 'react'
import { STOCK_LIST } from '../data/stocks'
import { getDummyPortfolioHistory } from '../data/dummy'

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const INTERVAL_MAP = {
    '1y': '1d',
    '1mo': '1d',
    '5d': '1d'
}

const fetchHistory = async (ticker, range = '1y') => {
    const interval = INTERVAL_MAP[range] || '1d'
    const response = await fetch(`/api/stock/history/${ticker}?range=${range}&interval=${interval}`)
    const data = await response.json()
    const result = data.chart.result[0]
    const timestamps = result.timestamp
    const closes = result.indicators.quote[0].close

    return timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: closes[i]
    })).filter(d => d.close !== null && d.close !== undefined)
}

export const usePortfolioHistory = (range = '1y') => {
    const [data, setData] = useState([])
    const [allTimeHigh, setAllTimeHigh] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)

            if (IS_MOCK) {
                const { data, allTimeHigh } = getDummyPortfolioHistory(range)
                setData(data)
                setAllTimeHigh(allTimeHigh)
                setLoading(false)
                return
            }

            try {
                // 환율 + 모든 종목 히스토리 병렬 요청
                const [exchangeHistory, ...stockHistories] = await Promise.all([
                    fetchHistory('KRW=X', range),
                    ...STOCK_LIST.map(stock => {
                        const ticker = stock.market === 'KR'
                            ? `${stock.symbol}.${stock.type}`
                            : stock.symbol
                        return fetchHistory(ticker, range)
                    })
                ])

                // 환율 날짜 맵 생성
                const exchangeMap = {}
                exchangeHistory.forEach(({ date, close }) => {
                    exchangeMap[date] = close
                })

                // 각 종목별 날짜 맵 생성
                const stockMaps = stockHistories.map(history => {
                    const map = {}
                    history.forEach(({ date, close }) => {
                        map[date] = close
                    })
                    return map
                })

                // 한국 주식 날짜 기준으로 교집합 날짜 추출 (KR 시장 거래일 기준)
                const krDates = new Set(
                    stockHistories[0].map(d => d.date)
                )

                // 모든 종목의 데이터가 있는 날짜만 사용 (결측 시 직전 유효값으로 채움)
                const sortedDates = [...krDates].sort()

                let lastExchangeRate = 1400
                const portfolioData = []

                for (const date of sortedDates) {
                    // 환율: 해당일 또는 직전 유효값
                    if (exchangeMap[date]) {
                        lastExchangeRate = exchangeMap[date]
                    }

                    let totalValue = 0
                    let hasAllData = true

                    for (let i = 0; i < STOCK_LIST.length; i++) {
                        const stock = STOCK_LIST[i]
                        const close = stockMaps[i][date]

                        if (close === undefined || close === null) {
                            // US 주식은 거래일이 달라 결측 허용 - 직전 데이터 탐색
                            if (stock.market === 'US') {
                                // 직전 날짜에서 가장 최근 값 찾기
                                const usDates = Object.keys(stockMaps[i]).sort()
                                const prevDate = usDates.filter(d => d <= date).pop()
                                if (prevDate) {
                                    const prevClose = stockMaps[i][prevDate]
                                    totalValue += prevClose * stock.quantity * lastExchangeRate
                                } else {
                                    hasAllData = false
                                    break
                                }
                            } else {
                                hasAllData = false
                                break
                            }
                        } else {
                            if (stock.market === 'KR') {
                                totalValue += close * stock.quantity
                            } else {
                                totalValue += close * stock.quantity * lastExchangeRate
                            }
                        }
                    }

                    if (hasAllData) {
                        portfolioData.push({ date, value: Math.round(totalValue) })
                    }
                }

                // 최고가 계산
                const maxEntry = portfolioData.reduce(
                    (max, d) => d.value > max.value ? d : max,
                    portfolioData[0]
                )

                setData(portfolioData)
                setAllTimeHigh(maxEntry)
            } catch (err) {
                console.error('포트폴리오 히스토리 조회 실패:', err)
                setError('차트 데이터를 불러오지 못했습니다.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [range])

    return { data, allTimeHigh, loading, error }
}
