import { Outlet } from 'react-router-dom'

import { SideNav } from './SideNav'

export function Layout() {
  return (
    <div className="shell">
      <SideNav />
      <div className="shell-content">
        <Outlet />
      </div>
    </div>
  )
}
