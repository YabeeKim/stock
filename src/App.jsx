import {useState, useEffect} from 'react'
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer} from 'recharts'
import './App.css'

// 고정된 주식 목록
const STOCK_LIST = [
    {name: '삼성전자', symbol: '005930', quantity: 375, market: 'KR', type: 'KS'},
    {name: '삼성SDI', symbol: '006400', quantity: 185, market: 'KR', type: 'KS'},
    {name: '한중엔시에스', symbol: '107640', quantity: 21, market: 'KR',  type: 'KQ'},
    {name: '서진시스템', symbol: '178320', quantity: 30, market: 'KR',  type: 'KQ'},
    {name: '테슬라', symbol: 'TSLA', quantity: 130, market: 'US',  type: 'NASDAQ'},
]

const INITIAL_INVESTMENT = 136_500_000

function App() {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [exchangeRate, setExchangeRate] = useState(0)
    const [showPercentage, setShowPercentage] = useState(false)
    const [activeTab, setActiveTab] = useState('portfolio')

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
        </div>
    )
}

export default App
