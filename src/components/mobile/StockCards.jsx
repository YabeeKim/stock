import {getNaverLink} from '../../data/stocks'

export const StockCards = ({stocks, exchangeRate, showPercentage, onTogglePercentage}) => {
    return (
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
                                onTogglePercentage()
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
    )
}
