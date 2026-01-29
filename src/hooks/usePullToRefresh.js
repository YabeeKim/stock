import {useState, useRef, useCallback} from 'react'

const PULL_THRESHOLD = 80

export const usePullToRefresh = (onRefresh) => {
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const touchStartY = useRef(0)
    const containerRef = useRef(null)

    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY
        }
    }, [])

    const handleTouchMove = useCallback((e) => {
        if (touchStartY.current === 0 || isRefreshing) return

        const currentY = e.touches[0].clientY
        const diff = currentY - touchStartY.current

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            e.preventDefault()
            setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5))
        }
    }, [isRefreshing])

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true)
            await onRefresh()
            setIsRefreshing(false)
        }
        setPullDistance(0)
        touchStartY.current = 0
    }, [pullDistance, isRefreshing, onRefresh])

    return {
        pullDistance,
        isRefreshing,
        containerRef,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        PULL_THRESHOLD
    }
}
