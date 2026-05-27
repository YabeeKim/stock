import { useState, useEffect } from 'react'
import { HOLDINGS } from '../data/stocks'
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
                // symbol 기준 dedup — 같은 종목의 히스토리는 1회만 fetch
                const uniqueHoldings = [...new Map(HOLDINGS.map(h => [h.symbol, h])).values()]

                const [exchangeHistory, ...stockHistories] = await Promise.all([
                    fetchHistory('KRW=X', range),
                    ...uniqueHoldings.map(h => {
                        const ticker = h.market === 'KR' ? `${h.symbol}.${h.type}` : h.symbol
                        return fetchHistory(ticker, range)
                    })
                ])

                const exchangeMap = {}
                exchangeHistory.forEach(({ date, close }) => {
                    exchangeMap[date] = close
                })

                // symbol → 날짜맵
                const symbolToMap = {}
                uniqueHoldings.forEach((h, i) => {
                    const map = {}
                    stockHistories[i].forEach(({ date, close }) => { map[date] = close })
                    symbolToMap[h.symbol] = map
                })

                // 수량 집계: 같은 symbol이면 quantity 합산
                const symbolQuantity = {}
                const symbolMarket = {}
                for (const h of HOLDINGS) {
                    symbolQuantity[h.symbol] = (symbolQuantity[h.symbol] || 0) + h.quantity
                    symbolMarket[h.symbol] = h.market
                }

                // KR 종목의 거래일 기준 날짜 추출
                const krSymbol = uniqueHoldings.find(h => h.market === 'KR')?.symbol
                const krDates = krSymbol
                    ? new Set(Object.keys(symbolToMap[krSymbol]))
                    : new Set()

                const sortedDates = [...krDates].sort()

                let lastExchangeRate = 1400
                const portfolioData = []

                for (const date of sortedDates) {
                    if (exchangeMap[date]) lastExchangeRate = exchangeMap[date]

                    let totalValue = 0
                    let hasAllData = true

                    for (const symbol of Object.keys(symbolQuantity)) {
                        const market = symbolMarket[symbol]
                        const priceMap = symbolToMap[symbol]
                        const quantity = symbolQuantity[symbol]
                        const close = priceMap[date]

                        if (close === undefined || close === null) {
                            if (market === 'US') {
                                const usDates = Object.keys(priceMap).sort()
                                const prevDate = usDates.filter(d => d <= date).pop()
                                if (prevDate) {
                                    totalValue += priceMap[prevDate] * quantity * lastExchangeRate
                                } else {
                                    hasAllData = false
                                    break
                                }
                            } else {
                                hasAllData = false
                                break
                            }
                        } else {
                            if (market === 'KR') {
                                totalValue += close * quantity
                            } else {
                                totalValue += close * quantity * lastExchangeRate
                            }
                        }
                    }

                    if (hasAllData) {
                        portfolioData.push({ date, value: Math.round(totalValue) })
                    }
                }

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
