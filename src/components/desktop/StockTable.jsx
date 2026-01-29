import {getNaverLink} from '../../data/stocks'

export const StockTable = ({stocks, exchangeRate, showPercentage, onTogglePercentage}) => {
    return (
        <div className="desktop-only">
            <table className="portfolio-table">
                <thead>
                <tr>
                    <th>종목</th>
                    <th>현재가</th>
                    <th>등락</th>
                    <th>원금</th>
                    <th>평가금액</th>
                    <th>수익률</th>
                </tr>
                </thead>
                <tbody>
                {stocks.map((stock) => {
                    const priceChange = stock.currentPrice - stock.previousClose
                    const changePercent = (priceChange / stock.previousClose) * 100
                    const evalValue = stock.currency === 'KRW'
                        ? stock.totalValue
                        : stock.totalValue * exchangeRate
                    const profitRate = ((evalValue - stock.base) / stock.base) * 100

                    return (
                        <tr
                            key={stock.id}
                            className="table-row-link"
                            onClick={() => window.open(getNaverLink(stock), '_blank')}
                        >
                            <td>{stock.name} {stock.quantity.toLocaleString()}주</td>
                            <td>
                                {stock.error ? '-' : stock.currency === 'KRW'
                                    ? `₩${stock.currentPrice.toLocaleString()}`
                                    : `$${stock.currentPrice.toFixed(2)}`}
                            </td>
                            <td className={priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : ''}>
                                {stock.error ? '-' : showPercentage
                                    ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                                    : stock.currency === 'KRW'
                                        ? `${priceChange >= 0 ? '+' : ''}${priceChange.toLocaleString()}`
                                        : `${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)}`}
                            </td>
                            <td>₩{stock.base.toLocaleString()}</td>
                            <td>
                                {stock.error ? '-' : `₩${Math.round(evalValue).toLocaleString()}`}
                            </td>
                            <td className={profitRate >= 0 ? 'positive' : 'negative'}>
                                {stock.error ? '-' : `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`}
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}
