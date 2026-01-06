import {useState, useEffect} from 'react'
import './App.css'

// 고정된 주식 목록
const STOCK_LIST = [
    {name: '삼성전자', symbol: '005930', quantity: 375, market: 'KR'},
    {name: '삼성SDI', symbol: '006400', quantity: 185, market: 'KR'},
    {name: '테슬라', symbol: 'TSLA', quantity: 130, market: 'US'}
]

// 원금
const INITIAL_INVESTMENT = 134_500_000

function App() {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [exchangeRate, setExchangeRate] = useState(0)
    const [showPercentage, setShowPercentage] = useState(false)

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // 주가 조회 함수
    const fetchStockPrice = async (symbol, market) => {
        try {
            // 한국 주식은 .KS (코스피) 또는 .KQ (코스닥) 추가
            const ticker = market === 'KR' ? `${symbol}.KS` : symbol

            const response = await fetch(`/api/stock/${ticker}`)

            if (!response.ok) {
                // 한국 주식일 경우 .KQ (코스닥)도 시도
                if (market === 'KR') {
                    const kosdaqTicker = `${symbol}.KQ`
                    const kosdaqResponse = await fetch(`/api/stock/${kosdaqTicker}`)
                    if (kosdaqResponse.ok) {
                        const data = await kosdaqResponse.json()
                        const meta = data.chart.result[0].meta
                        return {
                            price: meta.regularMarketPrice,
                            previousClose: meta.chartPreviousClose || meta.previousClose,
                            currency: meta.currency,
                            ticker: kosdaqTicker
                        }
                    }
                }
                throw new Error('주식 정보를 찾을 수 없습니다')
            }

            const data = await response.json()
            const meta = data.chart.result[0].meta
            const price = meta.regularMarketPrice
            const previousClose = meta.chartPreviousClose || meta.previousClose
            const currency = meta.currency

            return {
                price,
                previousClose,
                currency,
                ticker: market === 'KR' ? ticker : symbol
            }
        } catch (err) {
            throw new Error('주가 조회 실패')
        }
    }

    // 환율 조회 함수
    const fetchExchangeRate = async () => {
        try {
            const response = await fetch('/api/exchange')

            if (!response.ok) {
                throw new Error('환율 조회 실패')
            }

            const data = await response.json()
            const rate = data.chart.result[0].meta.regularMarketPrice
            return rate
        } catch (err) {
            console.error('환율 조회 실패:', err)
            return 1400 // 실패 시 기본값
        }
    }

    // 초기 데이터 로드
    useEffect(() => {
        loadStockPrices()
    }, [])

    // 주가 로드
    const loadStockPrices = async () => {
        setLoading(true)
        setError('')

        try {
            // 환율과 주가 정보를 동시에 가져오기
            const [rate, ...stocksWithPrices] = await Promise.all([
                fetchExchangeRate(),
                ...STOCK_LIST.map(async (stock, index) => {
                    try {
                        const stockData = await fetchStockPrice(stock.symbol, stock.market)
                        return {
                            id: index,
                            name: stock.name,
                            symbol: stock.symbol,
                            quantity: stock.quantity,
                            currentPrice: stockData.price,
                            previousClose: stockData.previousClose,
                            currency: stockData.currency,
                            market: stock.market,
                            totalValue: stockData.price * stock.quantity
                        }
                    } catch (err) {
                        return {
                            id: index,
                            name: stock.name,
                            symbol: stock.symbol,
                            quantity: stock.quantity,
                            currentPrice: 0,
                            previousClose: 0,
                            currency: stock.market === 'KR' ? 'KRW' : 'USD',
                            market: stock.market,
                            totalValue: 0,
                            error: true
                        }
                    }
                })
            ])

            setExchangeRate(rate)
            setStocks(stocksWithPrices)
        } catch (err) {
            setError('가격 조회 실패')
        } finally {
            setLoading(false)
        }
    }

    // 총 평가금액 계산
    const getTotalValue = () => {
        const krwStocks = stocks.filter(s => s.currency === 'KRW')
        const usdStocks = stocks.filter(s => s.currency === 'USD')

        const krwTotal = krwStocks.reduce((sum, stock) => sum + stock.totalValue, 0)
        const usdTotal = usdStocks.reduce((sum, stock) => sum + stock.totalValue, 0)

        return {krwTotal, usdTotal}
    }

    const {krwTotal, usdTotal} = getTotalValue()

    return (
        <div className="container bg-gray-100 p-5 md:p-10 min-h-screen">
            <h1 className="text-center mb-8 text-gray-800 text-3xl md:text-4xl">📈 주식 포트폴리오</h1>

            <div className="current-time">
                {currentTime.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </div>

            {error && <div className="error text-center mb-5">{error}</div>}

            {exchangeRate > 0 && (
                <div className="exchange-rate">
                    💱 환율: $1 = ₩{exchangeRate.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
                </div>
            )}

            <div className="portfolio-section">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl md:text-2xl">보유 종목</h2>
                    <button onClick={loadStockPrices} disabled={loading}>
                        {loading ? '갱신 중...' : '가격 갱신'}
                    </button>
                </div>

                {loading && stocks.length === 0 ? (
                    <div className="empty-state">
                        주가 정보를 불러오는 중...
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="portfolio-table">
                                <thead>
                                <tr>
                                    <th>종목명</th>
                                    <th>수량</th>
                                    <th>현재가</th>
                                    <th>평가금액</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stocks.map((stock) => (
                                    <tr key={stock.id}>
                                        <td>{stock.name}</td>
                                        <td>{stock.quantity.toLocaleString()}</td>
                                        <td
                                            onClick={() => setShowPercentage(!showPercentage)}
                                            className="cursor-pointer"
                                        >
                                            {stock.error ? (
                                                <span className="loading">조회 실패</span>
                                            ) : (() => {
                                                const priceChange = stock.currentPrice - stock.previousClose
                                                const changePercent = (priceChange / stock.previousClose) * 100
                                                const priceClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : ''
                                                const priceText = stock.currency === 'KRW'
                                                    ? stock.currentPrice.toLocaleString()
                                                    : `$${stock.currentPrice.toFixed(2)}`

                                                const changeText = showPercentage
                                                    ? `(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`
                                                    : stock.currency === 'KRW'
                                                        ? `(${priceChange >= 0 ? '+' : ''}${priceChange.toLocaleString()})`
                                                        : `(${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)})`

                                                return <span className={priceClass}>{priceText} {changeText}</span>
                                            })()}
                                        </td>
                                        <td>
                                            {stock.error ? (
                                                <span className="loading">-</span>
                                            ) : stock.currency === 'KRW' ? (
                                                `₩${stock.totalValue.toLocaleString()}`
                                            ) : exchangeRate > 0 ? (
                                                `₩${Math.round(stock.totalValue * exchangeRate).toLocaleString()}`
                                            ) : (
                                                <span className="loading">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="summary">
                            {krwTotal > 0 && <div>한국 주식 평가금액: ₩{krwTotal.toLocaleString()}</div>}
                            {usdTotal > 0 && exchangeRate > 0 && (
                                <div>미국 주식 평가금액: ₩{Math.round(usdTotal * exchangeRate).toLocaleString()}</div>
                            )}
                            {exchangeRate > 0 && (() => {
                                const totalValue = krwTotal + (usdTotal * exchangeRate)
                                const profit = totalValue - INITIAL_INVESTMENT
                                const profitRate = (profit / INITIAL_INVESTMENT) * 100

                                return (
                                    <>
                                        <div className="mt-2.5 pt-2.5 border-t-2 border-gray-800 text-base">
                                            투자 원금: ₩{INITIAL_INVESTMENT.toLocaleString()}
                                        </div>
                                        <div className="mt-2">
                                            전체 총 평가금액:
                                            ₩{totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                        </div>
                                        <div
                                            className={`mt-2 text-lg ${profit >= 0 ? 'text-red-700' : 'text-blue-700'}`}>
                                            평가
                                            손익: {profit >= 0 ? '+' : ''}₩{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                            ({profit >= 0 ? '+' : ''}{profitRate.toFixed(2)}%)
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default App
