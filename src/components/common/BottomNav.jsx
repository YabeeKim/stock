import {NavLink} from 'react-router-dom'

const PortfolioIcon = ({filled}) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
)

const ChartLineIcon = ({filled}) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinejoin="round" strokeLinecap="round"
                  fill={filled ? "none" : "none"} strokeOpacity={filled ? 1 : 0.6} />
    </svg>
)

const NewsIcon = ({filled}) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <line x1="6" y1="8" x2="18" y2="8" />
        <line x1="6" y1="12" x2="14" y2="12" />
        <line x1="6" y1="16" x2="10" y2="16" />
    </svg>
)

export const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/"
                className={({isActive}) => isActive ? 'active' : ''}
            >
                {({isActive}) => (
                    <span className="nav-icon">
                        <PortfolioIcon filled={isActive} />
                    </span>
                )}
            </NavLink>
            <NavLink
                to="/chart"
                className={({isActive}) => isActive ? 'active' : ''}
            >
                {({isActive}) => (
                    <span className="nav-icon">
                        <ChartLineIcon filled={isActive} />
                    </span>
                )}
            </NavLink>
            <NavLink
                to="/news"
                className={({isActive}) => isActive ? 'active' : ''}
            >
                {({isActive}) => (
                    <span className="nav-icon">
                        <NewsIcon filled={isActive} />
                    </span>
                )}
            </NavLink>
        </nav>
    )
}
