
import React, { useState, useEffect } from 'react';
import DashboardIndicators from './DashboardIndicators';
import { useAppContext } from '../context/AppContext';
import { WeekStatus, WeekData, User } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { PieChart, Activity, Check, Printer, RefreshCw } from './ui/Icons';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Modal from './ui/Modal';
import AlertDialog from './ui/AlertDialog';
import CrearConteo from './CrearConteo';
import PrintView from './PrintView';
import HistoryDashboard from './HistoryDashboard';
import UserManagement from './UserManagement';
import OperatorChart from './OperatorChart';
import Settings from './Settings';

export const getStatusBadge = (status: WeekStatus) => {
  const styles = {
    [WeekStatus.Bloqueado]: 'bg-slate-200 text-slate-700',
    [WeekStatus.Pendiente]: 'bg-yellow-200 text-yellow-800',
    [WeekStatus.EnProgreso]: 'bg-blue-200 text-blue-800',
    [WeekStatus.Finalizado]: 'bg-green-200 text-green-800',
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
};

export const AdminWeekDetailView: React.FC<{ week: WeekData; onBack: () => void; }> = ({ week, onBack }) => {
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button onClick={onBack} variant="secondary" className="mb-4">
                &larr; Volver
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Detalle del Conteo - {week.name}</CardTitle>
                    <CardDescription>
                        Vista detallada de los artículos contados. Modificado por última vez por {week.lastModifiedBy || 'nadie'} el {week.lastModifiedDate ? new Date(week.lastModifiedDate).toLocaleString('es-AR') : 'N/A'}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden sm:table-cell">ID Material</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">Stock Sistema</TableHead>
                                <TableHead className="text-center">Contado</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">Diferencia</TableHead>
                                <TableHead className="hidden sm:table-cell">Fecha Conteo</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">Auditoría</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {week.items.map((item) => (
                                <React.Fragment key={item.id}>
                                    <TableRow className={item.quantity !== null && item.systemStock !== item.quantity ? 'bg-red-50' : ''}>
                                        <TableCell className="font-mono sm:table-cell hidden">{item.id}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="sm:hidden">
                                                <span className="font-bold">{item.id}</span> - {item.location}
                                            </div>
                                            {item.description}
                                            <div className="text-xs text-slate-500 font-normal">{item.manufacturerCode}</div>
                                        </TableCell>
                                        <TableCell className="font-mono sm:table-cell hidden">{item.location}</TableCell>
                                        <TableCell className="text-center font-semibold text-slate-600 sm:table-cell hidden">{item.systemStock}</TableCell>
                                        <TableCell className={`text-center font-bold ${item.quantity !== null && item.systemStock !== item.quantity ? 'text-red-600' : 'text-green-700'}`}>
                                            <span className="sm:hidden font-normal text-slate-500">Contado: </span>
                                            {item.quantity ?? 'No contado'}
                                        </TableCell>
                                        <TableCell className="text-center sm:table-cell hidden">
                                            {item.quantity !== null && item.systemStock !== item.quantity && (
                                                <Check className="h-6 w-6 text-red-600 mx-auto" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 sm:table-cell hidden">
                                            {item.countedDate ? new Date(item.countedDate).toLocaleDateString('es-AR') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-center sm:table-cell hidden">
                                            {item.auditLog && item.auditLog.length > 0 && (
                                                <Button variant="ghost" size="sm" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                                    {expandedItemId === item.id ? 'Cerrar' : 'Ver Log'}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {expandedItemId === item.id && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="p-2 bg-slate-50">
                                                <div className="p-4">
                                                    <h4 className="font-bold mb-2">Historial de Cambios para {item.id}</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Usuario</TableHead>
                                                                <TableHead>Fecha</TableHead>
                                                                <TableHead>Campo</TableHead>
                                                                <TableHead>Valor Anterior</TableHead>
                                                                <TableHead>Valor Nuevo</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {item.auditLog?.map((log, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{log.user}</TableCell>
                                                                    <TableCell>{new Date(log.date).toLocaleString('es-AR')}</TableCell>
                                                                    <TableCell>{log.field}</TableCell>
                                                                    <TableCell>{String(log.oldValue)}</TableCell>
                                                                    <TableCell>{String(log.newValue)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const DashboardView: React.FC<{
    onShowCreate: () => void;
    onSelectWeek: (week: WeekData) => void;
    onPrintWeek: (week: WeekData) => void;
    onShowHistory: () => void;
    onShowUsers: () => void;
    onFinalizeWeek: (week: WeekData) => void;
    onDeleteCount: () => void;
    user: User | null;
    onShowSettings: () => void;
    onShowReset: () => void;
}> = ({ onShowCreate, onSelectWeek, onPrintWeek, onShowHistory, onShowUsers, onFinalizeWeek, onDeleteCount, user, onShowSettings, onShowReset }) => {
    const { weeksData, refreshData, users, resetApplicationData } = useAppContext();
    const finalizedWeeks = weeksData.filter(w => w.status === WeekStatus.Finalizado).length;
    const totalWeeks = weeksData.length;
    const progressPercentage = totalWeeks > 0 ? Math.round((finalizedWeeks / totalWeeks) * 100) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const itemsCountedToday = weeksData
      .flatMap(w => w.items)
      .filter(item => item.countedDate && item.countedDate.startsWith(today) && item.quantity !== null && item.quantity > 0).length;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-3xl font-bold text-slate-800">Dashboard de Administrador</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <Button onClick={onShowHistory} variant="secondary">Ver Historial de Conteos</Button>
                <Button onClick={onShowUsers} variant="secondary">Gestionar Usuarios</Button>
                <Button onClick={onShowSettings} variant="outline">Configuración</Button>
                <Button onClick={onShowCreate} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">Crear Nuevo Conteo</Button>
                {user?.username === 'Admin' && (
                  <Button onClick={onShowReset} variant="destructive">Reiniciar Datos</Button>
                )}
                {user?.username === 'Admin' && weeksData.length > 0 && (
                  <Button onClick={onDeleteCount} variant="destructive">Eliminar Conteo Actual</Button>
                )}
                <Button onClick={refreshData} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {weeksData.length === 0 ? (
              <Card className="text-center py-12">
                <CardHeader>
                  <CardTitle>No hay un conteo activo</CardTitle>
                  <CardDescription>Cree un nuevo ciclo de conteo para comenzar a trabajar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={onShowCreate} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">Crear Nuevo Conteo</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="mb-8">
                <DashboardIndicators weeksData={weeksData} />
              </div>
            )}
            {weeksData.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Progreso General (Conteo Actual)</CardTitle>
                      <PieChart className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{progressPercentage}%</div>
                      <p className="text-xs text-slate-500">{finalizedWeeks} de {totalWeeks} semanas finalizadas</p>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Ítems Contados Hoy</CardTitle>
                      <Activity className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{itemsCountedToday}</div>
                      <p className="text-xs text-slate-500">Total de items con cantidad registrada hoy</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-8">
                  <OperatorChart weeksData={weeksData} users={users} />
                </div>
          
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Semanas (Conteo Actual)</CardTitle>
                    <CardDescription>Resumen del estado y progreso de cada semana de conteo. Haga clic en una fila para ver el detalle.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Semana</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Modificado por</TableHead>
                          <TableHead>Fecha de Modificación</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                          <TableHead className="text-right">Finalizar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeksData.map((week) => (
                          <TableRow key={week.id}>
                            <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => week.status !== WeekStatus.Bloqueado && onSelectWeek(week)}>{week.name}</TableCell>
                            <TableCell>{getStatusBadge(week.status)}</TableCell>
                            <TableCell>{week.status === 'Finalizado' ? (week.finalizedBy || 'N/A') : (week.lastModifiedBy || 'N/A')}</TableCell>
                            <TableCell>{week.status === 'Finalizado' ? (week.finalizationDate ? new Date(week.finalizationDate).toLocaleString('es-AR') : 'N/A') : (week.lastModifiedDate ? new Date(week.lastModifiedDate).toLocaleString('es-AR') : 'N/A')}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => onPrintWeek(week)}>
                                    <Printer className="h-5 w-5" />
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                                {(week.status === WeekStatus.EnProgreso || week.status === WeekStatus.Pendiente) && (
                                    <Button size="sm" onClick={() => onFinalizeWeek(week)} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">
                                        Finalizar Semana
                                    </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
        </div>
    );
};

const DashboardAdmin: React.FC = () => {
    const { finalizeWeek, deleteCurrentCount, user, weeksData, refreshData, resetApplicationData } = useAppContext();

  useEffect(() => {
    refreshData();
  }, []);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showResetDataModal, setShowResetDataModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [weekToFinalize, setWeekToFinalize] = useState<WeekData | null>(null);
    const [observation, setObservation] = useState('');
    const [view, setView] = useState<'dashboard' | 'create' | 'detail' | 'print' | 'history' | 'users' | 'settings'>('dashboard');
    const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

    const handleSelectWeek = (week: WeekData) => {
        setSelectedWeek(week);
        setView('detail');
    };
    
    const handlePrintWeek = (week: WeekData) => {
        setSelectedWeek(week);
        setView('print');
    };

    const handleBackToDashboard = () => {
        setSelectedWeek(null);
        setView('dashboard');
    };

    const openFinalizeModal = (week: WeekData) => {
        setWeekToFinalize(week);
        setIsModalOpen(true);
    };

    const handleDeleteCount = () => {
        deleteCurrentCount();
        setIsDeleteModalOpen(false);
        setDeleteConfirmationText('');
    };

    const confirmFinalizeWeek = () => {
        if (weekToFinalize) {
            const today = new Date().toISOString().split('T')[0];
            if (weekToFinalize.endDate && today > weekToFinalize.endDate && !observation.trim()) {
                alert('Debe ingresar una observación por el cierre fuera de término.');
                return;
            }
            finalizeWeek(weekToFinalize.id, observation);
            setIsModalOpen(false);
            setWeekToFinalize(null);
            setObservation('');
        }
    };

    switch (view) {
        case 'create':
            return <CrearConteo onBack={handleBackToDashboard} />;
        case 'detail':
            return selectedWeek ? <AdminWeekDetailView week={selectedWeek} onBack={handleBackToDashboard} /> : null;
        case 'print':
            return selectedWeek ? <PrintView week={selectedWeek} onBack={handleBackToDashboard} /> : null;
        case 'history':
            return <HistoryDashboard onBack={handleBackToDashboard} />;
        case 'users':
            return <UserManagement onBack={handleBackToDashboard} />;
        case 'settings':
            return <Settings onBack={handleBackToDashboard} />;
        case 'dashboard':
        default:
            return (
                <>
                    <DashboardView 
                        onShowCreate={() => setView('create')} 
                        onSelectWeek={handleSelectWeek} 
                        onPrintWeek={handlePrintWeek} 
                        onShowHistory={() => setView('history')}
                        onShowUsers={() => setView('users')}
                        onShowSettings={() => setView('settings')}
                        onFinalizeWeek={openFinalizeModal}
                        onDeleteCount={() => setIsDeleteModalOpen(true)}
                        user={user}
                        onShowReset={() => setShowResetDataModal(true)}
                    />
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onConfirm={confirmFinalizeWeek}
                        title={`Finalizar ${weekToFinalize?.name}`}
                    >
                        <p>¿Está seguro de que desea finalizar esta semana?</p>
                        {weekToFinalize?.endDate && new Date().toISOString().split('T')[0] > weekToFinalize.endDate && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700">Observación por Cierre Atrasado</label>
                                <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    className="w-full p-2 border rounded-md mt-1"
                                    placeholder="Ingrese el motivo del cierre fuera de término..."
                                />
                            </div>
                        )}
                        <p className="font-semibold text-red-600 mt-2">Esta acción no se puede deshacer y no podrá realizar más cambios en este conteo.</p>
                        <p className="mt-2">La siguiente semana quedará desbloqueada para el conteo.</p>
                    </Modal>
                    {showResetDataModal && (
                        <AlertDialog
                            isOpen={true}
                            onClose={() => setShowResetDataModal(false)}
                            onConfirm={() => { resetApplicationData(); setShowResetDataModal(false); }}
                            title="¿Reiniciar Todos los Datos?"
                            description="Esta acción es irreversible y borrará todos los conteos, usuarios y configuraciones. La aplicación volverá a su estado inicial."
                            confirmText="Sí, Reiniciar Todo"
                        />
                    )}
                    <Modal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleDeleteCount}
                        title="Eliminar Conteo Actual"
                        confirmDisabled={deleteConfirmationText !== `eliminar ${weeksData.length > 0 ? weeksData[0].name.split(' ')[0] : ''}`}
                    >
                        <p className="font-semibold text-red-600">¡Atención! Esta acción es irreversible y eliminará el conteo actual.</p>
                        <p className="mt-2">Para confirmar, escriba exactamente <span className="font-bold">eliminar {weeksData.length > 0 ? weeksData[0].name.split(' ')[0] : ''}</span> en el campo de abajo.</p>
                        <Input 
                            type="text"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            className="mt-4 w-full"
                        />
                    </Modal>
                </>
            );
    }
};

export default DashboardAdmin;
