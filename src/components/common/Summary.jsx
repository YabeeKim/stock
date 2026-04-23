import {INITIAL_INVESTMENT} from '../../data/stocks'

export const Summary = ({krwTotal, usdTotal, exchangeRate}) => {
    return (
        <div className="summary">
            {krwTotal > 0 && <div>🇰🇷 ₩{krwTotal.toLocaleString()}</div>}
            {usdTotal > 0 && exchangeRate > 0 && (
                <div>🇺🇸 ₩{Math.round(usdTotal * exchangeRate).toLocaleString()}</div>
            )}
            {exchangeRate > 0 && (() => {
                const stockValue = krwTotal + (usdTotal * exchangeRate)
                const totalValue = stockValue
                const profit = stockValue - INITIAL_INVESTMENT
                const profitRate = (profit / INITIAL_INVESTMENT) * 100

                return (
                    <>
                        <div className="mt-2.5 pt-2.5 border-t-2 border-gray-800 text-base">
                            원금: ₩{INITIAL_INVESTMENT.toLocaleString()}
                        </div>
                        <div className="mt-2 text-base">
                            전체 총 금액 (예수금 포함):
                            ₩{totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </div>
                        <div
                            className={`mt-2 text-lg ${profit >= 0 ? 'text-red-700' : 'text-blue-700'}`}>
                            손익: ₩{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            ({profitRate.toFixed(2)}%)
                        </div>
                    </>
                )
            })()}
        </div>
    )
}
