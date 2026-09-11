import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from '../src/pages/register'
import { ActividadesAgricolas } from './pages/actividades'
import Login from './pages/Login'
import AsistenteIA from './pages/AsistenteIA'
import Inicio from './pages/inicio'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/actividades" element={<ActividadesAgricolas/>} />
      <Route path='/inicio' element={<Inicio/>}/>
      <Route path='/asistente' element={<AsistenteIA/>}/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App
