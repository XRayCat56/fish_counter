import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Layout } from './components/Layout.tsx'
import { SpeciesByDamPage } from './pages/SpeciesByDamPage.tsx'
import { YearlyTotalsByDamPage } from './pages/YearlyTotalsByDamPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<App />} />
          <Route path="species-by-dam" element={<SpeciesByDamPage />} />
          <Route path="yearly-totals-by-dam" element={<YearlyTotalsByDamPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
