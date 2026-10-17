import { ProfileMenu } from './ProfileMenu'

type Props = {
  crumbs: string[]
  onBack?: () => void
}

export function TopBar({ crumbs, onBack }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-side">
        {onBack && (
          <button className="pill-btn back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}
      </div>
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} className={i === crumbs.length - 1 ? 'crumb is-current' : 'crumb'}>
            {i > 0 && <span className="crumb-sep">›</span>}
            {c}
          </span>
        ))}
      </nav>
      <div className="topbar-side topbar-right">
        <ProfileMenu />
      </div>
    </header>
  )
}
