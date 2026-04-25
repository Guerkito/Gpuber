import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { 
  Users, Car, History, Map as MapIcon, Plus, Trash2, 
  Search, Settings, Bell, MapPin, Navigation, 
  Flame, UserCheck, Timer, ChevronRight, LayoutDashboard,
  ShieldCheck, Smartphone, Info, Menu, X, MessageSquare, LogOut, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';

// Iconos personalizados
const driverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `<div class="w-5 h-5 bg-blue-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const passengerIcon = L.divIcon({
  className: 'custom-passenger-icon',
  html: `<div class="w-5 h-5 bg-cyan-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center animate-bounce">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 35, blur: 20, maxZoom: 17,
      gradient: { 0.2: '#fee2e2', 0.4: '#fde047', 0.6: '#f97316', 1: '#ef4444' }
    }).addTo(map);
    return () => map.removeLayer(heat);
  }, [map, points]);
  return null;
}

const API_BASE = window.location.origin === 'http://localhost:5173' 
  ? 'http://localhost:3000/api' 
  : '/api';

function App() {
  const [view, setView] = useState('map');
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState({ connected: false, qr: null });

  const fetchData = async () => {
    // Carga de Conductores y Viajes
    try {
      const [driversRes, tripsRes] = await Promise.all([
        fetch(`${API_BASE}/conductores`),
        fetch(`${API_BASE}/viajes`)
      ]);
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (tripsRes.ok) setTrips(await tripsRes.json());
    } catch (e) { console.error("Error base:", e); }

    // Carga de WhatsApp (independiente)
    try {
      const wsRes = await fetch(`${API_BASE}/whatsapp/status`);
      const data = await wsRes.json();
      if (wsRes.ok) {
        setWsStatus(data);
      } else {
        setWsStatus({ connected: false, error: data.error || 'Error de conexión con el servidor' });
      }
    } catch (error) {
      setWsStatus({ connected: false, error: 'No se pudo contactar con el servidor API' });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const waitingPassengers = trips.filter(t => t.estado === 'buscando');
  const heatPoints = trips.map(t => [t.pasajero_lat, t.pasajero_lng, 0.5]);

  const isOnline = (lastUpdate) => {
    if (!lastUpdate) return false;
    return (new Date().getTime() - new Date(lastUpdate).getTime()) < 300000;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
              <Car className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ProtoUber</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Fusagasugá</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarNavItem active={view === 'map'} icon={<LayoutDashboard size={20}/>} label="Mapa Central" onClick={() => { setView('map'); setIsSidebarOpen(false); }} />
          <SidebarNavItem active={view === 'drivers'} icon={<Users size={20}/>} label="Gestionar Flota" onClick={() => { setView('drivers'); setIsSidebarOpen(false); }} />
          <SidebarNavItem active={view === 'history'} icon={<History size={20}/>} label="Historial Viajes" onClick={() => { setView('history'); setIsSidebarOpen(false); }} />
          <SidebarNavItem active={view === 'whatsapp'} icon={<MessageSquare size={20}/>} label="Conectar WhatsApp" onClick={() => { setView('whatsapp'); setIsSidebarOpen(false); }} />
          
          <div className="pt-8 px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inteligencia</div>
          <SidebarNavItem active={showHeatmap} icon={<Flame size={20}/>} label="Mapa de Calor" onClick={() => setShowHeatmap(!showHeatmap)} isToggle />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 italic uppercase">
              {view === 'map' && 'Monitoreo Satelital'}
              {view === 'drivers' && 'Administración'}
              {view === 'history' && 'Historial'}
              {view === 'whatsapp' && 'Configuración de WhatsApp'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${wsStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Bot {wsStatus.connected ? 'Online' : 'Offline'}</span>
             </div>
             <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black">A</div>
          </div>
        </header>

        <section className="flex-1 p-4 lg:p-8 overflow-y-auto lg:overflow-hidden bg-slate-50/50 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
              {view === 'map' && (
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-full text-[14px]">
                  <div className="flex-1 lg:col-span-9 bg-white rounded-3xl lg:rounded-5xl border border-slate-200 p-2 relative shadow-sm min-h-[400px] lg:min-h-0 overflow-hidden">
                    <MapContainer center={[4.337, -74.364]} zoom={14} className="h-full w-full rounded-2xl lg:rounded-4xl">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {showHeatmap && <HeatmapLayer points={heatPoints} />}
                      {drivers.filter(d => d.lat && d.lng).map(d => {
                        const online = isOnline(d.ultima_actualizacion);
                        return (
                          <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
                            <Popup>
                              <div className="p-1 min-w-[120px]">
                                <p className="font-black text-slate-900 leading-none mb-1 text-sm italic uppercase">{d.nombre}</p>
                                <p className="text-[10px] text-slate-400 font-bold mb-3">{d.placa || 'SIN PLACA'}</p>
                                <div className="space-y-1.5 border-t pt-2">
                                  <div className="flex justify-between text-[9px] font-black uppercase">
                                    <span>Conexión:</span>
                                    <span className={online ? 'text-emerald-600' : 'text-slate-400'}>{online ? 'Online' : 'Offline'}</span>
                                  </div>
                                  <div className="flex justify-between text-[9px] font-black uppercase">
                                    <span>Estado:</span>
                                    <span className={d.estado === 'disponible' ? 'text-blue-600' : 'text-amber-600'}>{d.estado}</span>
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                      {waitingPassengers.map(p => (
                        <Marker key={p.id} position={[p.pasajero_lat, p.pasajero_lng]} icon={passengerIcon} />
                      ))}
                    </MapContainer>
                  </div>
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Espera Promedio</p>
                      <p className="text-4xl font-black italic tracking-tighter text-slate-900">3.2 <span className="text-xs not-italic text-slate-400 uppercase">min</span></p>
                    </div>
                    <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col min-h-[250px] shadow-sm overflow-hidden text-sm">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><UserCheck size={18} className="text-blue-500" />Cola</h3>
                       <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                          {waitingPassengers.map(p => (
                            <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                              <span className="font-bold text-slate-700">{p.pasajero_tel}</span>
                              <span className="text-[9px] font-black text-blue-600 uppercase italic tracking-tighter">En espera</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}
              {view === 'drivers' && <DriversView drivers={drivers} refresh={fetchData} isOnline={isOnline} />}
              {view === 'history' && <HistoryView trips={trips} />}
              {view === 'whatsapp' && <WhatsAppView status={wsStatus} refresh={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .leaflet-container { background: #F8FAFC !important; }
        .custom-driver-icon, .custom-passenger-icon { background: none; border: none; }
      `}} />
    </div>
  );
}

function SidebarNavItem({ active, icon, label, onClick, isToggle }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
      <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}>{icon}</span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {isToggle && (
        <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors duration-300 ${active ? 'bg-blue-400' : 'bg-slate-200'}`}>
          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${active ? 'left-6' : 'left-1'}`}></div>
        </div>
      )}
    </button>
  );
}

function WhatsAppView({ status, refresh }) {
    const [loadingQr, setLoadingQr] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [qrError, setQrError] = useState(null);

    const logout = async () => {
        if (confirm('¿Cerrar sesión de WhatsApp?')) {
            await fetch(`${API_BASE}/whatsapp/logout`, { method: 'POST' });
            setQrCode(null);
            refresh();
        }
    };

    const generateQR = async () => {
        setLoadingQr(true);
        setQrError(null);
        try {
            const res = await fetch(`${API_BASE}/whatsapp/qr`);
            const data = await res.json();
            if (res.ok) {
                setQrCode(data.qr);
            } else {
                setQrError(data.error || `Error ${res.status}: Problema técnico`);
            }
        } catch (e) {
            setQrError('Error fatal: El backend no responde. Revisa Vercel.');
        }
        setLoadingQr(false);
    };

    return (
        <div className="flex items-center justify-center h-full">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-200 max-w-md w-full text-center">
                <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 shadow-lg ${status.connected ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100' : 'bg-blue-50 text-blue-600 shadow-blue-100'}`}>
                    <MessageSquare size={40} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">
                    {status.connected ? 'WhatsApp Conectado' : 'Vincular WhatsApp'}
                </h3>

                {status.connected ? (
                    <div className="space-y-4 mt-6">
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest italic">Estado</span>
                            <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Operativo
                            </span>
                        </div>
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-colors mt-8">
                            <LogOut size={18} /> Desvincular Bot
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 mt-6">
                        {qrError && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] font-bold uppercase italic">
                                {qrError}
                            </div>
                        )}

                        {qrCode ? (
                            <div className="bg-white p-4 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex items-center justify-center mx-auto aspect-square w-64 shadow-inner">
                                {qrCode.startsWith('data:image') ? (
                                    <img src={qrCode} alt="WhatsApp QR" className="w-full h-full object-contain rounded-2xl" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-4xl font-black tracking-tighter text-blue-600">{qrCode}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código numérico</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={generateQR}
                                disabled={loadingQr}
                                className="w-full bg-blue-600 text-white p-5 rounded-3xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loadingQr ? <RefreshCw className="animate-spin" size={20} /> : <Smartphone size={20} />}
                                {loadingQr ? 'Generando...' : 'Obtener Código QR'}
                            </button>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Escanea para activar ProtoUber Fusa</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DriversView({ drivers, refresh, isOnline }) {
  const [formData, setFormData] = useState({ id: '', nombre: '', placa: '', code: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/conductores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setFormData({ id: '', nombre: '', placa: '', code: '' });
    refresh();
  };
  const deleteDriver = async (id) => { if (confirm('¿Eliminar?')) { await fetch(`${API_BASE}/conductores/${id}`, { method: 'DELETE' }); refresh(); } };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full overflow-y-auto lg:overflow-hidden pr-1 custom-scrollbar">
      <div className="lg:col-span-4 space-y-6 shrink-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic mb-6">Vincular Conductor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ModernInput label="Código" placeholder="Ej: 1234" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            <ModernInput label="Teléfono" placeholder="573..." value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
            <ModernInput label="Nombre" placeholder="Nombre completo" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <ModernInput label="Placa" placeholder="ABC-123" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest mt-4 hover:bg-blue-700 transition-colors">Vincular Ahora</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Conductor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Conexión</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Estado</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 leading-none mb-1 italic uppercase">{d.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-tight">{d.placa || 'SIN PLACA'} • {d.id}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${isOnline(d.ultima_actualizacion) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {isOnline(d.ultima_actualizacion) ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${d.estado === 'disponible' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteDriver(d.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ModernInput({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <input {...props} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all" />
    </div>
  );
}

function HistoryView({ trips }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden h-full flex flex-col shadow-sm">
      <div className="overflow-x-auto text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Fecha</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Pasajero</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-xs">
                  <p className="font-bold text-slate-800">{new Date(t.creado_en).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-400">{new Date(t.creado_en).toLocaleTimeString()}</p>
                </td>
                <td className="px-6 py-4 font-bold text-slate-600 italic tracking-tighter">{t.pasajero_tel}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${t.estado === 'asignado' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {t.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
