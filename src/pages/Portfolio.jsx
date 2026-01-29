import {useState, useEffect} from 'react'
import {useStockData} from '../hooks/useStockData'
import {usePullToRefresh} from '../hooks/usePullToRefresh'
import {StockTable} from '../components/desktop/StockTable'
import {StockCards} from '../components/mobile/StockCards'
import {Summary} from '../components/common/Summary'

export const Portfolio = () => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [showPercentage, setShowPercentage] = useState(false)

    const {
        stocks,
        loading,
        error,
        exchangeRate,
        loadStockPrices,
        getTotalValue
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

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const {krwTotal, usdTotal} = getTotalValue()

    const handleTogglePercentage = () => {
        setShowPercentage(!showPercentage)
    }

    return (
        <div
            ref={containerRef}
            className="container bg-gray-100 p-5 md:p-10 min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to refresh indicator */}
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
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
            </div>

            {error && <div className="error text-center mb-5">{error}</div>}

            <div className="portfolio-section">
                {loading && stocks.length === 0 ? (
                    <div className="empty-state">
                        주가 정보를 불러오는 중...
                    </div>
                ) : (
                    <>
                        <StockTable
                            stocks={stocks}
                            exchangeRate={exchangeRate}
                            showPercentage={showPercentage}
                            onTogglePercentage={handleTogglePercentage}
                        />

                        <StockCards
                            stocks={stocks}
                            exchangeRate={exchangeRate}
                            showPercentage={showPercentage}
                            onTogglePercentage={handleTogglePercentage}
                        />

                        <Summary
                            krwTotal={krwTotal}
                            usdTotal={usdTotal}
                            exchangeRate={exchangeRate}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
