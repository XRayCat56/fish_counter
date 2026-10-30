import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Layout } from './components/Layout.tsx'
import { CompositionPage } from './pages/CompositionPage.tsx'
import { DamConversionPage } from './pages/DamConversionPage.tsx'
import { HeatmapPage } from './pages/HeatmapPage.tsx'
import { RunTimingPage } from './pages/RunTimingPage.tsx'
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
          <Route path="run-timing" element={<RunTimingPage />} />
          <Route path="composition" element={<CompositionPage />} />
          <Route path="dam-conversion" element={<DamConversionPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
