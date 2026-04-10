import { useState } from 'react'
import { PortfolioChart } from '../components/common/PortfolioChart'

const FILTERS = [
    { label: '1주일', value: '5d' },
    { label: '1달', value: '1mo' },
    { label: '1년', value: '1y' }
]

export const Chart = () => {
    const [range, setRange] = useState('1y')

    return (
        <div className="container bg-gray-100 p-5 md:p-10 min-h-screen">
            <h1 className="text-gray-800 text-3xl md:text-4xl">📊 포트폴리오 그래프</h1>

            <div className="chart-filter-buttons">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        className={`chart-filter-btn${range === f.value ? ' active' : ''}`}
                        onClick={() => setRange(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <PortfolioChart range={range} />
        </div>
    )
}
