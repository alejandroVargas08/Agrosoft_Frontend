import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/Register'
import Login from './pages/Login'
import Inicio from './pages/inicio'
import RecuperarPassword from './pages/RecuperarPassword'
import VerificarCodigo from './pages/VerificarCodigo'
import NuevaContrasena from './pages/NuevaContrasena'
import Perfil from './pages/Perfil'
import EditarPerfil from './pages/EditarPerfil'
import Configuracion from './pages/Configuracion'
import AgroBot from './pages/AgroBot'
import LotesSublotes from './pages/LotesSublotes'
import NuevoLote from './pages/NuevoLote'
import Inventario from './pages/Inventario'
import NuevoInsumo from './pages/NuevoInsumo'
import UnidadesProductivas from './pages/UnidadesProductivas'
import NuevaUnidadProductiva from './pages/NuevaUnidadProductiva'
import DetalleUnidadProductiva from './pages/DetalleUnidadProductiva'
import Incidencias from './pages/Incidencias'
import Tratamientos from './pages/Tratamientos'
import Reportes from './pages/Reportes'
import SensoresPage from './pages/SensorPage'
import Actividades from './pages/actividades/actividades'
import ActividadDetalle from './pages/actividades/ActividadDetalle'
import Cultivos from './pages/cultivos/cultivos'
import Notificaciones from './pages/notificaciones/Notificaciones'
import LayoutConNotificaciones from './components/layout/LayoutConNotificaciones'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperar" element={<RecuperarPassword />} />
      <Route path="/recuperar/verificar" element={<VerificarCodigo />} />
      <Route path="/recuperar/nueva-contrasena" element={<NuevaContrasena />} />

      {/*Aqui tienen que poner las pantallas*/}
      <Route element={<LayoutConNotificaciones />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/agrobot" element={<AgroBot />} />
        <Route path="/actividades" element={<Actividades />} />
        <Route path="/actividades/:id" element={<ActividadDetalle />} />
        <Route path="/incidencias" element={<Incidencias />} />
        <Route path="/tratamientos" element={<Tratamientos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/cultivos" element={<Cultivos />} />
        <Route path="/unidades-productivas" element={<UnidadesProductivas />} />
        <Route path="/unidades-productivas/nueva" element={<NuevaUnidadProductiva />} />
        <Route path="/unidades-productivas/:id" element={<DetalleUnidadProductiva />} />
        <Route path="/territorio" element={<LotesSublotes />} />
        <Route path="/territorio/nuevo" element={<NuevoLote />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/inventario/nuevo" element={<NuevoInsumo />} />
        <Route path="/sensores-iot" element={<SensoresPage />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
      </Route>

      {/*Muchachos, aqui tiene que ir las redirecciones */}
      <Route path="/territorio/lotes" element={<Navigate to="/territorio" replace />} />
      <Route path="/territorio/sublotes" element={<Navigate to="/territorio" replace />} />
      <Route path="/inventario/catalogos" element={<Navigate to="/inventario" replace />} />
      <Route path="/inventario/insumos" element={<Navigate to="/inventario" replace />} />
      <Route path="/inventario/movimientos" element={<Navigate to="/inventario" replace />} />
      <Route path="/inventario/reservas" element={<Navigate to="/inventario" replace />} />
      <Route path="/" element={<Navigate to="/inventario" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App