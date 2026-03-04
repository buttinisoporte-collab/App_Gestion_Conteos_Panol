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

const getStatusStyles = (status: WeekStatus) => {
  switch (status) {
    case WeekStatus.Bloqueado:
      return {
        bgColor: 'bg-slate-200',
        textColor: 'text-slate-500',
        borderColor: 'border-slate-300',
        icon: <Lock className="h-5 w-5" />,
        cursor: 'cursor-not-allowed',
      };
    case WeekStatus.Pendiente:
    case WeekStatus.EnProgreso:
      return {
        bgColor: 'bg-white',
        textColor: 'text-corporate-blue',
        borderColor: 'border-corporate-blue',
        icon: <Unlock className="h-5 w-5" />,
        cursor: 'cursor-pointer hover:bg-blue-50',
      };
    case WeekStatus.Finalizado:
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-500',
        icon: <CheckCircle className="h-5 w-5" />,
        cursor: 'cursor-pointer hover:bg-green-200',
      };
  }
};

const OperarioView: React.FC = () => {
  const { weeksData, changePassword, countCycle, refreshData, user } = useAppContext();
  const [view, setView] = useState<'dashboard' | 'conteo' | 'print'>('dashboard');
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = () => {
    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    changePassword(newPassword);
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSelectWeek = (week: WeekData) => {
    setSelectedWeek(week);
    setView('conteo');
  };

  const handleBackToDashboard = () => {
    setSelectedWeek(null);
    setView('dashboard');
  };

  const handlePrintWeek = (week: WeekData) => {
    setSelectedWeek(week);
    setView('print');
  };

  if (view === 'conteo' && selectedWeek) {
    return <ConteoTable week={selectedWeek} onBack={handleBackToDashboard} onPrint={handlePrintWeek} />;
  }

  if (view === 'print' && selectedWeek) {
    return <PrintView week={selectedWeek} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard de Operario</h2>
        <div className="flex items-center gap-2">
          <Button onClick={refreshData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
            Cambiar Contraseña
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Semana de Conteo</CardTitle>
          {countCycle && (
            <p className="text-sm text-slate-500 mt-1">
              Ciclo de Conteo: {new Date(countCycle.startDate).toLocaleDateString('es-AR')} - {new Date(countCycle.endDate).toLocaleDateString('es-AR')}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {weeksData.map((week) => {
              const styles = getStatusStyles(week.status);
              const isLocked = week.status === WeekStatus.Bloqueado;
              const totalItems = week.items.length;
              const countedItems = week.items.filter(i => i.quantity !== null).length;
              const userCountedItems = week.items.filter(i => i.auditLog?.some(l => l.user === user?.fullName && l.field === 'quantity' && l.newValue !== null)).length;
              const progress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

              return (
                <div
                  key={week.id}
                  onClick={() => !isLocked && handleSelectWeek(week)}
                  className={`p-6 rounded-lg border-2 shadow-sm transition-all flex flex-col justify-between ${styles.borderColor} ${styles.bgColor} ${styles.cursor} ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold ${styles.textColor}`}>{week.name}</h3>
                      <div className={styles.textColor}>{styles.icon}</div>
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${styles.textColor}`}>{week.status}</p>
                    {week.startDate && week.endDate && (
                      <p className={`mt-1 text-xs ${styles.textColor} opacity-80`}>
                        {new Date(week.startDate).toLocaleDateString('es-AR')} - {new Date(week.endDate).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  {!isLocked && (
                    <div className="mt-4 pt-4 border-t border-slate-300/50">
                        <div className={`text-sm font-semibold ${styles.textColor}`}>{progress}% Completado</div>
                        <div className="w-full bg-slate-300/50 rounded-full h-2 mt-1">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className={`mt-2 text-xs ${styles.textColor}`}>Llevas {countedItems} de {totalItems} items contados.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isPasswordModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setError('');
          }}
          onConfirm={handlePasswordChange}
          title="Cambiar Contraseña"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Contraseña</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la contraseña"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperarioView;
