// 원금 (나중에 DB/API로 대체 예정)
export const SAMSUNG_INVESTMENT = 30_000_000
export const TESLA_INVESTMENT = 20_000_000
export const SDI_INVESTMENT = 53_500_000
export const HANJUNG_INVESTMENT = 1_000_000
export const SEOJIN_INVESTMENT = 1_000_000
export const ECOPRO_INVESTMENT = 2_000_000
export const ISU_INVESTMENT = 15_229_200
export const LGCNS_INVESTMENT = 13_818_000

export const AVAILABLE_CASH = 20_000_000

export const INITIAL_INVESTMENT = SDI_INVESTMENT + SAMSUNG_INVESTMENT + TESLA_INVESTMENT + HANJUNG_INVESTMENT + SEOJIN_INVESTMENT + ECOPRO_INVESTMENT + ISU_INVESTMENT + LGCNS_INVESTMENT

// 고정된 주식 목록 (나중에 DB/API로 대체 예정)
export const STOCK_LIST = [
    {name: '삼성전자', symbol: '005930', quantity: 375, market: 'KR', type: 'KS', base: SAMSUNG_INVESTMENT},
    {name: '삼성SDI', symbol: '006400', quantity: 200, market: 'KR', type: 'KS', base: SDI_INVESTMENT},
    {name: '이수스페셜티케미컬', symbol: '457190', quantity: 152, market: 'KR', type: 'KS', base: ISU_INVESTMENT},
    {name: '한중엔시에스', symbol: '107640', quantity: 21, market: 'KR', type: 'KQ', base: HANJUNG_INVESTMENT},
    {name: '서진시스템', symbol: '178320', quantity: 30, market: 'KR', type: 'KQ', base: SEOJIN_INVESTMENT},
    {name: '에코프로', symbol: '086520', quantity: 12, market: 'KR', type: 'KQ', base: ECOPRO_INVESTMENT},
    {name: 'LG CNS', symbol: '064400', quantity: 210, market: 'KR', type: 'KS', base: LGCNS_INVESTMENT},
    {name: '테슬라', symbol: 'TSLA', quantity: 46, market: 'US', type: 'NASDAQ', base: TESLA_INVESTMENT}
]

// 네이버 증권 링크 생성
export const getNaverLink = (stock) => {
    if (stock.market === 'US') {
        return `https://m.stock.naver.com/worldstock/stock/${stock.symbol}.O/total`
    }
    return `https://finance.naver.com/item/main.naver?code=${stock.symbol}`
}
