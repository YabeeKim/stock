import { STOCK_LIST, INITIAL_INVESTMENT } from './stocks'

// 현재가 더미 데이터 (ticker → { price, previousClose, currency })
export const DUMMY_PRICES = {
    '005930.KS': { price: 52000,   previousClose: 51500,  currency: 'KRW' }, // 삼성전자
    '006400.KS': { price: 120000,  previousClose: 122000, currency: 'KRW' }, // 삼성SDI
    '457190.KS': { price: 35000,   previousClose: 34800,  currency: 'KRW' }, // 이수스페셜티케미컬
    '107640.KQ': { price: 15000,   previousClose: 14900,  currency: 'KRW' }, // 한중엔시에스
    '178320.KQ': { price: 20000,   previousClose: 20200,  currency: 'KRW' }, // 서진시스템
    '086520.KQ': { price: 80000,   previousClose: 82000,  currency: 'KRW' }, // 에코프로
    '294870.KS': { price: 65800,  previousClose: 65200,  currency: 'KRW' }, // LG CNS
    'TSLA':      { price: 250,     previousClose: 248,    currency: 'USD' }, // 테슬라
}

export const DUMMY_EXCHANGE_RATE = 1380

// seed 기반 결정론적 랜덤 (매번 동일한 차트 생성)
function seededRandom(seed) {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff
        return (s >>> 0) / 0xffffffff
    }
}

// 현재 더미 포트폴리오 가치 계산 (DUMMY_PRICES 기준)
function calcCurrentValue() {
    let total = 0
    for (const stock of STOCK_LIST) {
        const ticker = stock.market === 'KR' ? `${stock.symbol}.${stock.type}` : stock.symbol
        const dummy = DUMMY_PRICES[ticker]
        if (!dummy) continue
        if (dummy.currency === 'KRW') {
            total += dummy.price * stock.quantity
        } else {
            total += dummy.price * stock.quantity * DUMMY_EXCHANGE_RATE
        }
    }
    return Math.round(total)
}

// range에 따라 {date, value}[] 생성
export function getDummyPortfolioHistory(range) {
    const today = new Date()
    const dayCount = range === '1y' ? 252 : range === '1mo' ? 22 : 5
    const currentValue = calcCurrentValue()

    // 오늘로부터 dayCount 영업일 이전 날짜들 생성
    const dates = []
    let cursor = new Date(today)
    while (dates.length < dayCount) {
        cursor.setDate(cursor.getDate() - 1)
        const day = cursor.getDay()
        if (day !== 0 && day !== 6) { // 주말 제외
            dates.unshift(cursor.toISOString().slice(0, 10))
        }
    }
    dates.push(today.toISOString().slice(0, 10))

    // 과거 → 현재 방향으로 랜덤 워크 생성
    // 현재값에서 역산: 과거 시작점 = currentValue ± 변동
    const rand = seededRandom(20240101)
    const volatility = 0.008 // 일일 변동률 0.8%

    // 현재값을 끝점으로, 과거로 역산해 배열 구성
    const values = [currentValue]
    for (let i = 1; i < dates.length; i++) {
        const change = (rand() - 0.5) * 2 * volatility
        values.unshift(Math.round(values[0] * (1 - change)))
    }

    const data = dates.map((date, i) => ({ date, value: values[i] }))
    const allTimeHigh = data.reduce((max, d) => d.value > max.value ? d : max, data[0])

    return { data, allTimeHigh }
}

// useStockData용 더미 stocks 배열 생성
export function getDummyStocks() {
    return STOCK_LIST.map((stock, index) => {
        const ticker = stock.market === 'KR' ? `${stock.symbol}.${stock.type}` : stock.symbol
        const dummy = DUMMY_PRICES[ticker] || { price: 0, previousClose: 0, currency: stock.market === 'KR' ? 'KRW' : 'USD' }
        return {
            id: index,
            name: stock.name,
            symbol: stock.symbol,
            quantity: stock.quantity,
            currentPrice: dummy.price,
            previousClose: dummy.previousClose,
            currency: dummy.currency,
            market: stock.market,
            totalValue: dummy.price * stock.quantity,
            base: stock.base,
            marketTime: new Date(),
        }
    })
}
