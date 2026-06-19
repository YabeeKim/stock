export const BROKERS = [
    { id: 'kis',          name: '한국투자증권' },
    { id: 'namuh',        name: '나무증권' },
    { id: 'namuh-ria',    name: '나무증권-RIA' },
    { id: 'father-namuh', name: '아버지 나무증권' },
    { id: 'overseas',     name: '해외계좌' },
]

// avgPrice: KR종목은 원화 단가, US종목은 달러 단가
export const HOLDINGS = [
    { broker: 'kis',          name: '삼성SDI',             symbol: '006400', market: 'KR', type: 'KS', quantity: 145, avgPrice: 250_502 },
    { broker: 'namuh',        name: '삼성전자',             symbol: '005930', market: 'KR', type: 'KS', quantity: 375, avgPrice: 75_800 },
    { broker: 'namuh-ria',    name: '삼성전자',             symbol: '005930', market: 'KR', type: 'KS', quantity: 74,  avgPrice: 273_500 },
    { broker: 'namuh-ria',    name: '삼성SDI',             symbol: '006400', market: 'KR', type: 'KS', quantity: 48,  avgPrice: 588_625 },
    { broker: 'namuh-ria',    name: '이수스페셜티케미컬',   symbol: '457190', market: 'KR', type: 'KS', quantity: 86,  avgPrice: 119_669 },
    { broker: 'father-namuh', name: '삼성SDI',             symbol: '006400', market: 'KR', type: 'KS', quantity: 40,  avgPrice: 326_581 },
    { broker: 'father-namuh', name: '삼성전자',             symbol: '005930', market: 'KR', type: 'KS', quantity: 1, avgPrice: 365_800 },
    { broker: 'father-namuh', name: '엘앤에프',            symbol: '066970', market: 'KR', type: 'KS', quantity: 9,   avgPrice: 158_488 },
    { broker: 'father-namuh', name: '에코프로',            symbol: '086520', market: 'KR', type: 'KQ', quantity: 12,  avgPrice: 166_700 },
    { broker: 'father-namuh', name: '한중엔시에스',         symbol: '107640', market: 'KR', type: 'KQ', quantity: 21,  avgPrice: 48_900 },
    { broker: 'father-namuh', name: '서진시스템',           symbol: '178320', market: 'KR', type: 'KQ', quantity: 30,  avgPrice: 33_200 },
    { broker: 'father-namuh', name: '에코프로머티',         symbol: '450080', market: 'KR', type: 'KS', quantity: 23,  avgPrice: 63_600 },
    { broker: 'father-namuh', name: '이수스페셜티케미컬',   symbol: '457190', market: 'KR', type: 'KS', quantity: 90,  avgPrice: 89_038 },
    { broker: 'overseas',     name: '테슬라',              symbol: 'TSLA',   market: 'US', type: 'NASDAQ', quantity: 46, avgPrice: 220.55 },
]

export const filterByBroker = (holdings, brokerId) =>
    brokerId === 'all' ? holdings : holdings.filter(h => h.broker === brokerId)

// 전체 보기 시 같은 symbol을 수량 합산, 매입가 가중평균으로 묶음
export const aggregateBySymbol = (holdings) => {
    const map = new Map()
    for (const h of holdings) {
        if (map.has(h.symbol)) {
            const existing = map.get(h.symbol)
            const totalCost = existing.avgPrice * existing.quantity + h.avgPrice * h.quantity
            const totalQty = existing.quantity + h.quantity
            map.set(h.symbol, {
                ...existing,
                quantity: totalQty,
                avgPrice: totalCost / totalQty,
                totalValue: existing.totalValue + h.totalValue,
                brokers: [...existing.brokers, h.broker],
            })
        } else {
            map.set(h.symbol, { ...h, brokers: [h.broker] })
        }
    }
    return [...map.values()]
}

export const getNaverLink = (stock) => {
    if (stock.market === 'US') {
        return `https://m.stock.naver.com/worldstock/stock/${stock.symbol}.O/total`
    }
    return `https://finance.naver.com/item/main.naver?code=${stock.symbol}`
}
