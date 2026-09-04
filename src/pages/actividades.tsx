import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

interface Actividad {
    id: number;
    nombre: string;
    tipo: string;
    subtipo?: string;
    estado: 'pendiente' | 'en_progreso' | 'completada';
    fecha: string;
    horasActividad: number;
    precioHoraActividad: number;
    descripcion?: string;
}

export const ActividadesAgricolas = () => {
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string>('Todas');
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setModalOpen] = useState(false);
    const [lotes, setLotes] = useState<any[]>([]);
    const [subLotes, setSubLotes] = useState <any[]>([]);
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    const [form, setForm] = useState({
        nombre: '', 
        tipo: 'siembra',
        subtipo: '',
        loteId: '',
        subloteId: '',
        cultivoId: '',
        productoAgroId: '',
        fecha: '',
        horasActividad: '',
        precioHoraActividad: '',
        descripcion: ''
    });

    const cargarActividades = async () => {
        setLoading(true);
        try {
            const response = await api.get('/actividades');
            console.log("Datos recibidos", response.data);
            setActividades(Array.isArray(response.data) ? response.data : response.data.data || [] ) ;
        } catch (err) {
            console.error("Error cargando las actividades");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {cargarActividades(); }, []);

    useEffect(() => {
        if (isModalOpen) {
            api.get('/lotes').then(res => setLotes(res.data));
            api.get('/productos').then(res => setProductos(res.data));
        }
    }, [isModalOpen]); 

    useEffect(() => {
        if(form.loteId) {
            api.get(`/sublotes/lote/${form.loteId}`).then(res => setSubLotes(res.data));
            api.get(`/cultivos/lote/${form.loteId}`).then(res => setCultivos(res.data));
        } else {
            setSubLotes([]); 
            setCultivos([]);
        }
    }, [form.loteId] );

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value});
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            const payload = {
                ...form,
                loteId: Number(form.loteId),
                subLoteId: form.subloteId ? Number(form.subloteId) : undefined,
                cultivoId: Number(form.cultivoId),
                horasActividad: Number(form.horasActividad),
                precioHoraActividad: Number(form.precioHoraActividad),
                creadoPorUsuarioId: 1
            };

            await api.post('/actividades', payload);
            setModalOpen(false); 
            cargarActividades(); 
        } catch (err) {
            alert("Error al guardar"); 
        }
    };

    const handleChangeEstado = async (id: number, estadoActual: string) => {
        const estados = ['pendiente', 'en_progreso', 'completada'] as const; 
        const idx = estados.indexOf(estadoActual as any); 
        const nuevoEstado = estados[(idx + 1) % estados.length]; 

        await api.patch(`/actividades/${id}/estado`, {estado: nuevoEstado}); 
        cargarActividades();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Gestión de Actividades Agrícolas</h1>
                <button 
                    onClick={() => setModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                >
                    Nueva Actividad
                </button>
            </div>

            {loading ? (
                <p>Cargando actividades...</p>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {actividades.map((act) => (
                                <tr key={act.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{act.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{act.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {act.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{act.fecha}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleChangeEstado(act.id, act.estado)}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                        >
                                            Cambiar Estado
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );







};