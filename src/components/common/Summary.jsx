export const Summary = ({stocks, exchangeRate}) => {
    const krwStocks = stocks.filter(s => s.currency === 'KRW')
    const usdStocks = stocks.filter(s => s.currency === 'USD')

    const krwEval = krwStocks.reduce((sum, s) => sum + s.totalValue, 0)
    const usdEval = usdStocks.reduce((sum, s) => sum + s.totalValue, 0)
    const totalEval = krwEval + usdEval * exchangeRate

    const krwInvested = krwStocks.reduce((sum, s) => sum + s.avgPrice * s.quantity, 0)
    const usdInvested = usdStocks.reduce((sum, s) => sum + s.avgPrice * s.quantity * exchangeRate, 0)
    const totalInvested = krwInvested + usdInvested

    const profit = totalEval - totalInvested
    const profitRate = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

    return (
        <div className="summary">
            {krwEval > 0 && <div>🇰🇷 ₩{Math.round(krwEval).toLocaleString()}</div>}
            {usdEval > 0 && exchangeRate > 0 && (
                <div>🇺🇸 ₩{Math.round(usdEval * exchangeRate).toLocaleString()}</div>
            )}
            {exchangeRate > 0 && (
                <>
                    <div className="mt-2.5 pt-2.5 border-t-2 border-gray-800 text-base">
                        투자금액: ₩{Math.round(totalInvested).toLocaleString()}
                    </div>
                    <div className="mt-2 text-base">
                        평가금액: ₩{Math.round(totalEval).toLocaleString()}
                    </div>
                    <div className={`mt-2 text-lg ${profit >= 0 ? 'text-red-700' : 'text-blue-700'}`}>
                        손익: ₩{Math.round(profit).toLocaleString()}
                        ({profit >= 0 ? '+' : ''}{profitRate.toFixed(2)}%)
                    </div>
                </>
            )}
        </div>
    )
}
