import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { WeekData, WeekStatus } from '../types';
import ConteoTable from './ConteoTable';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Lock, Unlock, CheckCircle, RefreshCw } from './ui/Icons';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Modal from './ui/Modal';
import PrintView from './PrintView';

const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

const getStatusStyles = (status: WeekStatus) => {
  switch (status) {
    case WeekStatus.Bloqueado: return { bgColor: 'bg-slate-100', textColor: 'text-slate-500', borderColor: 'border-slate-200', icon: <Lock className="h-5 w-5" />, cursor: 'cursor-not-allowed' };
    case WeekStatus.Pendiente:
    case WeekStatus.EnProgreso: return { bgColor: 'bg-white', textColor: 'text-corporate-blue', borderColor: 'border-corporate-blue', icon: <Unlock className="h-5 w-5" />, cursor: 'cursor-pointer hover:bg-blue-50 shadow-md' };
    case WeekStatus.Finalizado: return { bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-300', icon: <CheckCircle className="h-5 w-5" />, cursor: 'cursor-pointer hover:bg-green-100' };
  }
};

const OperarioView: React.FC = () => {
  const { weeksData, changePassword, countCycle, refreshData, user, masterStock } = useAppContext();
  const [view, setView] = useState<'dashboard' | 'conteo' | 'print'>('dashboard');
  const[selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const[isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = () => {
    if (newPassword.length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    changePassword(newPassword);
    setIsPasswordModalOpen(false); setNewPassword(''); setConfirmPassword(''); setError('');
  };

  const handleSelectWeek = (week: WeekData) => { setSelectedWeek(week); setView('conteo'); };
  const handleBackToDashboard = () => { setSelectedWeek(null); setView('dashboard'); };
  const handlePrintWeek = (week: WeekData) => { setSelectedWeek(week); setView('print'); };

  if (view === 'conteo' && selectedWeek) return <ConteoTable week={selectedWeek} onBack={handleBackToDashboard} onPrint={handlePrintWeek} />;
  if (view === 'print' && selectedWeek) return <PrintView week={selectedWeek} onBack={handleBackToDashboard} />;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard de Operario</h2>
        <div className="flex items-center gap-2">
          <Button onClick={refreshData} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>Cambiar Contraseña</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Semana de Conteo</CardTitle>
          {countCycle && <p className="text-sm text-slate-500 mt-1">Ciclo: {new Date(countCycle.startDate).toLocaleDateString('es-AR')} - {new Date(countCycle.endDate).toLocaleDateString('es-AR')}</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {weeksData.map((week) => {
              const styles = getStatusStyles(week.status);
              const isLocked = week.status === WeekStatus.Bloqueado;
              
              // CÁLCULOS SEMANALES PARA OPERARIO
              const totalItems = week.items.length;
              const countedItemsList = week.items.filter(i => i.quantity !== null);
              const countedItems = countedItemsList.length;
              const progress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;
              
              const deviationsList = countedItemsList.filter(i => i.quantity !== i.systemStock);
              const devCount = deviationsList.length;
              const devPct = countedItems > 0 ? ((devCount / countedItems) * 100).toFixed(1) : '0.0';

              const typeCounts: Record<string, number> = {};
              deviationsList.forEach(i => {
                  const realId = getRealId(i.id);
                  const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
                  typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
              });
              const breakdown = Object.entries(typeCounts)
                  .map(([tipo, count]) => ({ tipo, pct: countedItems > 0 ? ((count / countedItems) * 100).toFixed(1) : '0.0' }))
                  .sort((a,b) => a.tipo.localeCompare(b.tipo));

              return (
                <div key={week.id} onClick={() => !isLocked && handleSelectWeek(week)} className={`p-6 rounded-lg border-2 transition-all flex flex-col justify-between ${styles.borderColor} ${styles.bgColor} ${styles.cursor} ${isLocked ? 'opacity-70' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xl font-bold ${styles.textColor}`}>{week.name}</h3>
                      <div className={styles.textColor}>{styles.icon}</div>
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${styles.textColor}`}>{week.status}</p>
                  </div>

                  {!isLocked && (
                    <div className="mt-5 pt-4 border-t border-slate-300/50">
                        {/* CUMPLIMIENTO */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm font-bold ${styles.textColor}`}>Cumplimiento: {progress}%</span>
                                <span className="text-xs text-slate-500">{countedItems} de {totalItems}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-corporate-blue h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        
                        {/* DESVÍOS Y TIPOS (Solo si ya contaron algo) */}
                        {countedItems > 0 && (
                            <div className="bg-white/60 p-3 rounded border border-slate-200 flex justify-between items-center mt-2">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-wider">DESVÍOS</p>
                                    <p className="text-lg font-bold text-red-600 leading-none">{devPct}%</p>
                                </div>
                                <div className="border-l border-slate-300 pl-3 ml-2 flex-1">
                                    <p className="text-[9px] text-slate-500 font-bold tracking-wider mb-1">X TIPO</p>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                                        {breakdown.length === 0 ? <span className="text-xs text-slate-400">Sin desvíos</span> : breakdown.map(b => (
                                            <span key={b.tipo} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-1 rounded">
                                                {b.tipo}: <span className="text-corporate-blue">{b.pct}%</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isPasswordModalOpen && (
        <Modal isOpen={true} onClose={() => { setIsPasswordModalOpen(false); setError(''); }} onConfirm={handlePasswordChange} title="Cambiar Contraseña">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 4 caracteres" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Contraseña</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita la contraseña" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperarioView;