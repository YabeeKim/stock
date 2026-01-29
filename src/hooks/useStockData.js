import {useState, useEffect, useCallback} from 'react'
import {STOCK_LIST} from '../data/stocks'

// 주가 조회 함수
const fetchStockPrice = async (symbol, market, type) => {
    try {
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

export const useStockData = () => {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [exchangeRate, setExchangeRate] = useState(0)

    const loadStockPrices = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
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
    }, [])

    // 초기 데이터 로드
    useEffect(() => {
        loadStockPrices()
    }, [loadStockPrices])

    // 총 평가금액 계산
    const getTotalValue = useCallback(() => {
        const krwStocks = stocks.filter(s => s.currency === 'KRW')
        const usdStocks = stocks.filter(s => s.currency === 'USD')

        const krwTotal = krwStocks.reduce((sum, stock) => sum + stock.totalValue, 0)
        const usdTotal = usdStocks.reduce((sum, stock) => sum + stock.totalValue, 0)

        return {krwTotal, usdTotal}
    }, [stocks])

    return {
        stocks,
        loading,
        error,
        exchangeRate,
        loadStockPrices,
        getTotalValue
    }
}
