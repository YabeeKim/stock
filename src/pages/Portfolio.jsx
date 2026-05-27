import {useState, useEffect} from 'react'
import {useStockData} from '../hooks/useStockData'
import {usePullToRefresh} from '../hooks/usePullToRefresh'
import {StockTable} from '../components/desktop/StockTable'
import {StockCards} from '../components/mobile/StockCards'
import {Summary} from '../components/common/Summary'
import {BROKERS, filterByBroker, aggregateBySymbol} from '../data/stocks'

export const Portfolio = () => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [showPercentage, setShowPercentage] = useState(false)
    const [activeBroker, setActiveBroker] = useState('all')

    const {
        stocks,
        loading,
        error,
        exchangeRate,
        loadStockPrices,
    } = useStockData()

    const {
        pullDistance,
        isRefreshing,
        containerRef,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        PULL_THRESHOLD
    } = usePullToRefresh(loadStockPrices)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const filtered = filterByBroker(stocks, activeBroker)
    const displayStocks = activeBroker === 'all' ? aggregateBySymbol(filtered) : filtered

    const handleTogglePercentage = () => setShowPercentage(p => !p)

    return (
        <div
            ref={containerRef}
            className="container bg-gray-100 p-5 md:p-10 min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="pull-indicator"
                style={{
                    height: pullDistance,
                    opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
                }}
            >
                {isRefreshing ? '갱신 중...' : pullDistance >= PULL_THRESHOLD ? '놓으면 갱신' : '당겨서 갱신'}
            </div>

            <h1 className="text-gray-800 text-3xl md:text-4xl">📈 주식 포트폴리오</h1>

            <div className="current-time">
                {currentTime.toLocaleString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
            </div>

            {/* 증권사 필터 - 데스크톱: 칩 버튼 */}
            <div className="broker-filter-buttons">
                <button
                    className={`broker-filter-btn${activeBroker === 'all' ? ' active' : ''}`}
                    onClick={() => setActiveBroker('all')}
                >
                    전체
                </button>
                {BROKERS.map(broker => (
                    <button
                        key={broker.id}
                        className={`broker-filter-btn${activeBroker === broker.id ? ' active' : ''}`}
                        onClick={() => setActiveBroker(broker.id)}
                    >
                        {broker.name}
                    </button>
                ))}
            </div>

            {/* 증권사 필터 - 모바일: 드롭다운 */}
            <div className="broker-filter-dropdown">
                <select
                    className="broker-filter-select"
                    value={activeBroker}
                    onChange={(e) => setActiveBroker(e.target.value)}
                >
                    <option value="all">전체</option>
                    {BROKERS.map(broker => (
                        <option key={broker.id} value={broker.id}>{broker.name}</option>
                    ))}
                </select>
            </div>

            {error && <div className="error text-center mb-5">{error}</div>}

            <div className="portfolio-section">
                {loading && stocks.length === 0 ? (
                    <div className="empty-state">주가 정보를 불러오는 중...</div>
                ) : (
                    <>
                        <StockTable
                            stocks={displayStocks}
                            exchangeRate={exchangeRate}
                            showPercentage={showPercentage}
                            onTogglePercentage={handleTogglePercentage}
                        />

                        <StockCards
                            stocks={displayStocks}
                            exchangeRate={exchangeRate}
                            showPercentage={showPercentage}
                            onTogglePercentage={handleTogglePercentage}
                        />

                        <Summary
                            stocks={displayStocks}
                            exchangeRate={exchangeRate}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
