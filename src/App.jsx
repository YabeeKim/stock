import {useState, useEffect, useRef, useCallback} from 'react'
import './App.css'

// 원금
const SAMSUNG_INVESTMENT = 30_000_000
const TESLA_INVESTMENT = 60_000_000
const SDI_INVESTMENT = 44_500_000
const HANJUNG_INVESTMENT = 1_000_000
const SEOJIN_INVESTMENT = 1_000_000
const INITIAL_INVESTMENT = SDI_INVESTMENT + SAMSUNG_INVESTMENT + TESLA_INVESTMENT + HANJUNG_INVESTMENT + SEOJIN_INVESTMENT

// 고정된 주식 목록
const STOCK_LIST = [
    {name: '삼성전자', symbol: '005930', quantity: 375, market: 'KR', type: 'KS', base: SAMSUNG_INVESTMENT},
    {name: '삼성SDI', symbol: '006400', quantity: 185, market: 'KR', type: 'KS', base: SDI_INVESTMENT},
    {name: '한중엔시에스', symbol: '107640', quantity: 21, market: 'KR', type: 'KQ', base: HANJUNG_INVESTMENT},
    {name: '서진시스템', symbol: '178320', quantity: 30, market: 'KR', type: 'KQ', base: SEOJIN_INVESTMENT},
    {name: '테슬라', symbol: 'TSLA', quantity: 130, market: 'US', type: 'NASDAQ', base: TESLA_INVESTMENT}
]

// 네이버 증권 링크 생성
const getNaverLink = (stock) => {
    if (stock.market === 'US') {
        return `https://m.stock.naver.com/worldstock/stock/${stock.symbol}.O/total`
    }
    return `https://finance.naver.com/item/main.naver?code=${stock.symbol}`
}

function App() {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [exchangeRate, setExchangeRate] = useState(0)
    const [showPercentage, setShowPercentage] = useState(false)

    // Pull to refresh
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const touchStartY = useRef(0)
    const containerRef = useRef(null)
    const PULL_THRESHOLD = 80

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // 주가 조회 함수
    const fetchStockPrice = async (symbol, market, type) => {
        try {
            // 한국 주식은 .KS (코스피) 또는 .KQ (코스닥) 추가
            const ticker = market === 'KR' ? `${symbol}.${type}` : symbol

            const response = await fetch(`/api/stock/${ticker}`)

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

    // Pull to refresh handlers
    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY
        }
    }, [])

    const handleTouchMove = useCallback((e) => {
        if (touchStartY.current === 0 || isRefreshing) return

        const currentY = e.touches[0].clientY
        const diff = currentY - touchStartY.current

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            e.preventDefault()
            setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5))
        }
    }, [isRefreshing])

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true)
            await loadStockPrices()
            setIsRefreshing(false)
        }
        setPullDistance(0)
        touchStartY.current = 0
    }, [pullDistance, isRefreshing])

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
                        const stockData = await fetchStockPrice(stock.symbol, stock.market, stock.type)
                        return {
                            id: index,
                            name: stock.name,
                            symbol: stock.symbol,
                            quantity: stock.quantity,
                            currentPrice: stockData.price,
                            previousClose: stockData.previousClose,
                            currency: stockData.currency,
                            market: stock.market,
                            totalValue: stockData.price * stock.quantity,
                            base: stock.base
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
                            base: stock.base,
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
        <div
            ref={containerRef}
            className="container bg-gray-100 p-5 md:p-10 min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to refresh indicator */}
            <div
                className="pull-indicator"
                style={{
                    height: pullDistance,
                    opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
                }}
            >
                {isRefreshing ? '갱신 중...' : pullDistance >= PULL_THRESHOLD ? '놓으면 갱신' : '당겨서 갱신'}
            </div>

            <h1 className="text-gray-800 text-3xl md:text-4xl">📈 주식 포트폴리오</h1>

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

            <div className="portfolio-section">
                {loading && stocks.length === 0 ? (
                    <div className="empty-state">
                        주가 정보를 불러오는 중...
                    </div>
                ) : (
                    <>
                        {/* 데스크톱 테이블 */}
                        <div className="desktop-only">
                            <table className="portfolio-table">
                                <thead>
                                <tr>
                                    <th>종목</th>
                                    <th>현재가</th>
                                    <th>등락</th>
                                    <th>원금</th>
                                    <th>평가금액</th>
                                    <th>수익률</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stocks.map((stock) => {
                                    const priceChange = stock.currentPrice - stock.previousClose
                                    const changePercent = (priceChange / stock.previousClose) * 100
                                    const evalValue = stock.currency === 'KRW'
                                        ? stock.totalValue
                                        : stock.totalValue * exchangeRate
                                    const profitRate = ((evalValue - stock.base) / stock.base) * 100

                                    return (
                                        <tr
                                            key={stock.id}
                                            className="table-row-link"
                                            onClick={() => window.open(getNaverLink(stock), '_blank')}
                                        >
                                            <td>{stock.name} {stock.quantity.toLocaleString()}주</td>
                                            <td>
                                                {stock.error ? '-' : stock.currency === 'KRW'
                                                    ? `₩${stock.currentPrice.toLocaleString()}`
                                                    : `$${stock.currentPrice.toFixed(2)}`}
                                            </td>
                                            <td className={priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : ''}>
                                                {stock.error ? '-' : showPercentage
                                                    ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                                                    : stock.currency === 'KRW'
                                                        ? `${priceChange >= 0 ? '+' : ''}${priceChange.toLocaleString()}`
                                                        : `${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)}`}
                                            </td>
                                            <td>₩{stock.base.toLocaleString()}</td>
                                            <td>
                                                {stock.error ? '-' : `₩${Math.round(evalValue).toLocaleString()}`}
                                            </td>
                                            <td className={profitRate >= 0 ? 'positive' : 'negative'}>
                                                {stock.error ? '-' : `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`}
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* 모바일 카드 */}
                        <div className="stock-cards mobile-only">
                            {stocks.map((stock) => {
                                const priceChange = stock.currentPrice - stock.previousClose
                                const changePercent = (priceChange / stock.previousClose) * 100
                                const evalValue = stock.currency === 'KRW'
                                    ? stock.totalValue
                                    : stock.totalValue * exchangeRate
                                const profitRate = ((evalValue - stock.base) / stock.base) * 100
                                const isTesla = stock.market === 'US'

                                return (
                                    <div
                                        key={stock.id}
                                        className="stock-card"
                                        onClick={() => window.open(getNaverLink(stock), '_blank')}
                                    >
                                        <div className="card-row-1">
                                            <span className="stock-name">
                                                {stock.name} {stock.quantity.toLocaleString()}주
                                            </span>
                                            {stock.error ? (
                                                <span className="loading">-</span>
                                            ) : (
                                                <span className={profitRate >= 0 ? 'positive' : 'negative'}>
                                                    {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="card-row-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowPercentage(!showPercentage)
                                            }}
                                        >
                                            {stock.error ? (
                                                <span className="loading">조회 실패</span>
                                            ) : (() => {
                                                const priceText = stock.currency === 'KRW'
                                                    ? `현재가 ${stock.currentPrice.toLocaleString()}`
                                                    : `현재가 $${stock.currentPrice.toFixed(2)}`

                                                const changeText = showPercentage
                                                    ? `(${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`
                                                    : stock.currency === 'KRW'
                                                        ? `(${priceChange >= 0 ? '+' : ''}${priceChange.toLocaleString()})`
                                                        : `(${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)})`

                                                const priceClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : ''
                                                return <span className={priceClass}>{priceText} {changeText}</span>
                                            })()}
                                        </div>
                                        <div className="card-row-3">
                                            원금 ₩{stock.base.toLocaleString()}
                                        </div>
                                        <div className="card-row-4">
                                            {stock.error ? (
                                                <span className="loading">평가 -</span>
                                            ) : stock.currency === 'KRW' ? (
                                                `평가 ₩${stock.totalValue.toLocaleString()}`
                                            ) : exchangeRate > 0 ? (
                                                `평가 ₩${Math.round(stock.totalValue * exchangeRate).toLocaleString()}`
                                            ) : (
                                                <span className="loading">평가 -</span>
                                            )}
                                        </div>
                                        {isTesla && exchangeRate > 0 && (
                                            <div className="card-row-5">
                                                환율 $1 = ₩{exchangeRate.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="summary">
                            {krwTotal > 0 && <div>🇰🇷 ₩{krwTotal.toLocaleString()}</div>}
                            {usdTotal > 0 && exchangeRate > 0 && (
                                <div>🇺🇸 ₩{Math.round(usdTotal * exchangeRate).toLocaleString()}</div>
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
