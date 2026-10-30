import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  end: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/species-by-dam', label: 'Species by Dam', end: false },
  { to: '/yearly-totals-by-dam', label: 'Yearly Totals by Dam', end: false },
  { to: '/run-timing', label: 'Run Timing', end: false },
  { to: '/composition', label: 'Composition & Jacks', end: false },
  { to: '/dam-conversion', label: 'Dam-to-Dam', end: false },
  { to: '/heatmap', label: 'Run Heatmap', end: false },
]

export function SideNav() {
  return (
    <nav className="side-nav" aria-label="Main navigation">
      <ul className="side-nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'side-nav-link active' : 'side-nav-link'
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
