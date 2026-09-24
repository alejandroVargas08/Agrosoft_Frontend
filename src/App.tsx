import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/Register'
import Login from './pages/Login'
import Inicio from './pages/inicio'
import RecuperarPassword from './pages/RecuperarPassword'
import VerificarCodigo from './pages/VerificarCodigo'
import NuevaContrasena from './pages/NuevaContrasena'
import Perfil from './pages/Perfil'
import Lotes from './pages/Lotes'
import Sublotes from './pages/Sublotes'
import CatalogosInventario from './pages/CatalogosInventario'
import Insumos from './pages/Insumos'
import Movimientos from './pages/Movimientos'
import Reservas from './pages/Reservas'
import EditarPerfil from './pages/EditarPerfil'
import Configuracion from './pages/Configuracion'
import AgroBot from './pages/AgroBot'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/inicio' element={<Inicio/>}/>
      <Route path='/recuperar' element={<RecuperarPassword/>}/>
      <Route path="/recuperar/verificar" element={<VerificarCodigo />} />
      <Route path="/recuperar/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path='/perfil' element={<Perfil/>}/>
      <Route path='/editar-perfil' element={<EditarPerfil/>}/>
      <Route path='/territorio/lotes' element={<Lotes/>}/>
      <Route path='/territorio/sublotes' element={<Sublotes/>}/>
      <Route path='/inventario/catalogos' element={<CatalogosInventario/>}/>
      <Route path='/inventario/insumos' element={<Insumos/>}/>
      <Route path='/inventario/movimientos' element={<Movimientos/>}/>
      <Route path='/inventario/reservas' element={<Reservas/>}/>
      <Route path='/configuracion' element={<Configuracion/>}/>
      <Route path="/agrobot" element={<AgroBot />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
