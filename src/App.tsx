import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/Register'
import Login from './pages/Login'
import AsistenteIA from './pages/AsistenteIA'
import Inicio from './pages/inicio'
import RecuperarPassword from './pages/RecuperarPassword'
import VerificarCodigo from './pages/VerificarCodigo'
import NuevaContrasena from './pages/NuevaContrasena'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/inicio' element={<Inicio/>}/>
      <Route path='/recuperar' element={<RecuperarPassword/>}/>
      <Route path="/recuperar/verificar" element={<VerificarCodigo />} />
      <Route path='/asistente' element={<AsistenteIA/>}/>
      <Route path="/recuperar/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
