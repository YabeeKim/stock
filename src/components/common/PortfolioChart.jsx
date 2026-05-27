import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceDot
} from 'recharts'
import { usePortfolioHistory } from '../../hooks/usePortfolioHistory'
import { HOLDINGS } from '../../data/stocks'

// 전체 보유 종목 기준 총 투자금액 (KRW 환산, 환율 1380 기준)
const CHART_EXCHANGE_RATE = 1380
const TOTAL_INVESTED = HOLDINGS.reduce((sum, h) => {
    const cost = h.market === 'KR'
        ? h.avgPrice * h.quantity
        : h.avgPrice * h.quantity * CHART_EXCHANGE_RATE
    return sum + cost
}, 0)

const formatValue = (value) => {
    if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`
    if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`
    return value.toLocaleString()
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="chart-tooltip">
            <div className="chart-tooltip-date">{label}</div>
            <div className="chart-tooltip-value">₩{payload[0].value.toLocaleString()}</div>
        </div>
    )
}

const RANGE_LABEL = {
    '1y': '최근 1년',
    '1mo': '최근 1달',
    '5d': '최근 1주일'
}

export const PortfolioChart = ({ range = '1y' }) => {
    const { data, allTimeHigh, loading, error } = usePortfolioHistory(range)

    if (loading) {
        return (
            <div className="chart-container">
                <div className="chart-loading">차트 데이터 불러오는 중...</div>
            </div>
        )
    }

    if (error || !data.length) {
        return (
            <div className="chart-container">
                <div className="chart-error">{error || '차트 데이터가 없습니다.'}</div>
            </div>
        )
    }

    const currentValue = data.length ? data[data.length - 1].value : null
    const profit = currentValue !== null ? currentValue - TOTAL_INVESTED : null
    const profitRate = profit !== null ? (profit / TOTAL_INVESTED) * 100 : null

    return (
        <div className="chart-container">
            <h2 className="chart-title">포트폴리오 평가금액 ({RANGE_LABEL[range] || '최근 1년'})</h2>
            {currentValue !== null && (
                <div className="chart-current-value">
                    <div className="chart-current-amount">₩{currentValue.toLocaleString()}</div>
                    <div className={`chart-current-diff ${profit >= 0 ? 'positive' : 'negative'}`}>
                        투자금액(₩{Math.round(TOTAL_INVESTED).toLocaleString()}) 대비&nbsp;
                        {profit >= 0 ? '+' : ''}₩{Math.round(profit).toLocaleString()}
                        &nbsp;({profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%)
                    </div>
                </div>
            )}
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickFormatter={(d) => d.slice(5)}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickFormatter={formatValue}
                        width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#portfolioGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    {allTimeHigh && (
                        <ReferenceDot
                            x={allTimeHigh.date}
                            y={allTimeHigh.value}
                            r={6}
                            fill="#ef4444"
                            stroke="#fff"
                            strokeWidth={2}
                            label={{
                                value: '최고',
                                position: 'top',
                                fontSize: 11,
                                fill: '#ef4444'
                            }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
            {allTimeHigh && (() => {
                const athProfit = allTimeHigh.value - TOTAL_INVESTED
                const athProfitRate = (athProfit / TOTAL_INVESTED) * 100
                return (
                    <div className="chart-ath">
                        <div>역대 최고 평가금액: <strong>₩{allTimeHigh.value.toLocaleString()}</strong>
                            <span className="chart-ath-date">({allTimeHigh.date})</span>
                        </div>
                        <div className={`chart-ath-profit ${athProfit >= 0 ? 'positive' : 'negative'}`}>
                            {athProfit >= 0 ? '+' : ''}₩{Math.round(athProfit).toLocaleString()} ({athProfitRate >= 0 ? '+' : ''}{athProfitRate.toFixed(2)}%)
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
