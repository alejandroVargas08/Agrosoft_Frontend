import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/register'
import Login from './pages/Login'
import AsistenteIA from './pages/AsistenteIA'
import Inicio from './pages/inicio'
import Lotes from './pages/Lotes'
import Sublotes from './pages/Sublotes'
import CatalogosInventario from './pages/CatalogosInventario'
import Insumos from './pages/Insumos'
import Movimientos from './pages/Movimientos'
import Reservas from './pages/Reservas'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/inicio' element={<Inicio/>}/>
      <Route path='/asistente' element={<AsistenteIA/>}/>
      <Route path='/territorio/lotes' element={<Lotes/>}/>
      <Route path='/territorio/sublotes' element={<Sublotes/>}/>
      <Route path='/inventario/catalogos' element={<CatalogosInventario/>}/>
      <Route path='/inventario/insumos' element={<Insumos/>}/>
      <Route path='/inventario/movimientos' element={<Movimientos/>}/>
      <Route path='/inventario/reservas' element={<Reservas/>}/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App