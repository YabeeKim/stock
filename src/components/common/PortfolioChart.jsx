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

const formatValue = (value) => {
    if (value >= 100_000_000) {
        return `${(value / 100_000_000).toFixed(1)}억`
    }
    if (value >= 10_000) {
        return `${(value / 10_000).toFixed(0)}만`
    }
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

export const PortfolioChart = () => {
    const { data, allTimeHigh, loading, error } = usePortfolioHistory()

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

    return (
        <div className="chart-container">
            <h2 className="chart-title">포트폴리오 평가금액 (최근 1년)</h2>
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
            {allTimeHigh && (
                <div className="chart-ath">
                    역대 최고 평가금액: <strong>₩{allTimeHigh.value.toLocaleString()}</strong>
                    <span className="chart-ath-date">({allTimeHigh.date})</span>
                </div>
            )}
        </div>
    )
}
