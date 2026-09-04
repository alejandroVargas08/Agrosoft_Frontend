import { useState } from 'react';
import { analizarImagen } from '../services/iaService';

export function AnalizarImagenCultivo() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAnalizar = async () => {
    if (!archivo) return;
    setCargando(true);
    const res = await analizarImagen(
      archivo,
      'Analiza esta imagen de un cultivo agrícola. Indica el estado de las hojas, posibles plagas o enfermedades, y recomendaciones.',
    );
    setResultado(res);
    setCargando(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      <button onClick={handleAnalizar} disabled={!archivo || cargando}>
        {cargando ? 'Analizando...' : 'Analizar imagen'}
      </button>
      {resultado && <p>{resultado}</p>}
    </div>
  );
}