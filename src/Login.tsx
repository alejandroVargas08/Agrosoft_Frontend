import { useState } from 'react'
import { api } from './api/axios'

function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setExito('')

    try {
      const { data } = await api.post('/usuarios/login', { correo, password })
      console.log('Usuario logueado:', data)
      setExito('Inicio de sesión excelente')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al iniciar sesión')
      setExito('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Ingresar</button>
      {exito && <p>{exito}</p>}
      {error && <p>{error}</p>}
    </form>
  )
}

export default Login