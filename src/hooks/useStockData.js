import {useState, useEffect, useCallback} from 'react'
import {HOLDINGS} from '../data/stocks'
import {getDummyStocks, DUMMY_EXCHANGE_RATE} from '../data/dummy'

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const fetchStockPrice = async (symbol, market, type) => {
    try {
        const ticker = market === 'KR' ? `${symbol}.${type}` : symbol
        const response = await fetch(`/api/stock/${ticker}`)
        const data = await response.json()
        const meta = data.chart.result[0].meta
        return {
            price: meta.regularMarketPrice,
            previousClose: meta.chartPreviousClose || meta.previousClose,
            currency: meta.currency,
            marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : null,
        }
    } catch (err) {
        throw new Error('주가 조회 실패')
    }
}

const fetchExchangeRate = async () => {
    try {
        const response = await fetch('/api/exchange')
        if (!response.ok) throw new Error('환율 조회 실패')
        const data = await response.json()
        return data.chart.result[0].meta.regularMarketPrice
    } catch (err) {
        console.error('환율 조회 실패:', err)
        return 1400
    }
}

export const useStockData = () => {
    const [stocks, setStocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [exchangeRate, setExchangeRate] = useState(0)
    const [lastUpdated, setLastUpdated] = useState(null)

    const loadStockPrices = useCallback(async () => {
        setLoading(true)
        setError('')

        if (IS_MOCK) {
            setExchangeRate(DUMMY_EXCHANGE_RATE)
            setStocks(getDummyStocks())
            setLastUpdated(new Date())
            setLoading(false)
            return
        }

        try {
            // symbol 단위로 중복 제거 후 가격 1회씩만 fetch
            const uniqueSymbols = [...new Map(HOLDINGS.map(h => [h.symbol, h])).values()]

            const [rate, ...priceResults] = await Promise.all([
                fetchExchangeRate(),
                ...uniqueSymbols.map(async (h) => {
                    try {
                        const data = await fetchStockPrice(h.symbol, h.market, h.type)
                        return { symbol: h.symbol, ...data, error: false }
                    } catch {
                        return {
                            symbol: h.symbol,
                            price: 0,
                            previousClose: 0,
                            currency: h.market === 'KR' ? 'KRW' : 'USD',
                            marketTime: null,
                            error: true,
                        }
                    }
                })
            ])

            const priceMap = new Map(priceResults.map(r => [r.symbol, r]))

            const stocksWithPrices = HOLDINGS.map((holding, index) => {
                const p = priceMap.get(holding.symbol)
                return {
                    id: index,
                    broker: holding.broker,
                    name: holding.name,
                    symbol: holding.symbol,
                    market: holding.market,
                    quantity: holding.quantity,
                    avgPrice: holding.avgPrice,
                    currentPrice: p.price,
                    previousClose: p.previousClose,
                    currency: p.currency,
                    totalValue: p.price * holding.quantity,
                    marketTime: p.marketTime,
                    error: p.error,
                }
            })

            setExchangeRate(rate)
            setStocks(stocksWithPrices)

            const marketTimes = stocksWithPrices.map(s => s.marketTime).filter(Boolean)
            if (marketTimes.length > 0) {
                setLastUpdated(new Date(Math.max(...marketTimes.map(t => t.getTime()))))
            }
        } catch (err) {
            setError('가격 조회 실패')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStockPrices()
    }, [loadStockPrices])

    return {stocks, loading, error, exchangeRate, lastUpdated, loadStockPrices}
}
