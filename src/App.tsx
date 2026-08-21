import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/Register'
import Login from './pages/Login'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
