import { HOLDINGS } from './stocks'

export const DUMMY_PRICES = {
    '005930.KS': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 삼성전자
    '006400.KS': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 삼성SDI
    '457190.KS': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 이수스페셜티케미컬
    '107640.KQ': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 한중엔시에스
    '178320.KQ': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 서진시스템
    '086520.KQ': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 에코프로
    '066970.KS': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 엘앤에프
    '450080.KS': { price: 1000, previousClose: 1000, currency: 'KRW' }, // 에코프로머티
    'TSLA':      { price: 1,    previousClose: 1,    currency: 'USD' }, // 테슬라 (1USD = 1000원 가정)
}

export const DUMMY_EXCHANGE_RATE = 1000

function seededRandom(seed) {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff
        return (s >>> 0) / 0xffffffff
    }
}

function calcCurrentValue() {
    let total = 0
    const seen = new Set()
    for (const holding of HOLDINGS) {
        const ticker = holding.market === 'KR' ? `${holding.symbol}.${holding.type}` : holding.symbol
        const dummy = DUMMY_PRICES[ticker]
        if (!dummy) continue
        if (dummy.currency === 'KRW') {
            total += dummy.price * holding.quantity
        } else {
            total += dummy.price * holding.quantity * DUMMY_EXCHANGE_RATE
        }
    }
    return Math.round(total)
}

export function getDummyPortfolioHistory(range) {
    const today = new Date()
    const dayCount = range === '1y' ? 252 : range === '1mo' ? 22 : 5
    const currentValue = calcCurrentValue()

    const dates = []
    let cursor = new Date(today)
    while (dates.length < dayCount) {
        cursor.setDate(cursor.getDate() - 1)
        const day = cursor.getDay()
        if (day !== 0 && day !== 6) {
            dates.unshift(cursor.toISOString().slice(0, 10))
        }
    }
    dates.push(today.toISOString().slice(0, 10))

    const rand = seededRandom(20240101)
    const volatility = 0.008

    const values = [currentValue]
    for (let i = 1; i < dates.length; i++) {
        const change = (rand() - 0.5) * 2 * volatility
        values.unshift(Math.round(values[0] * (1 - change)))
    }

    const data = dates.map((date, i) => ({ date, value: values[i] }))
    const allTimeHigh = data.reduce((max, d) => d.value > max.value ? d : max, data[0])

    return { data, allTimeHigh }
}

export function getDummyStocks() {
    return HOLDINGS.map((holding, index) => {
        const ticker = holding.market === 'KR' ? `${holding.symbol}.${holding.type}` : holding.symbol
        const dummy = DUMMY_PRICES[ticker] || { price: 0, previousClose: 0, currency: holding.market === 'KR' ? 'KRW' : 'USD' }
        return {
            id: index,
            broker: holding.broker,
            name: holding.name,
            symbol: holding.symbol,
            market: holding.market,
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            currentPrice: dummy.price,
            previousClose: dummy.previousClose,
            currency: dummy.currency,
            totalValue: dummy.price * holding.quantity,
            marketTime: new Date(),
            error: false,
        }
    })
}
