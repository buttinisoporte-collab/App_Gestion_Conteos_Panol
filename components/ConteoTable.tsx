import React, { useState, useEffect, useMemo } from 'react';
import { WeekData, Item } from '../types';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Check } from './ui/Icons';
import ReporteSemanal from './ReporteSemanal';
import ModificarSemana from './ModificarSemana';
import Modal from './ui/Modal';
import AlertDialog from './ui/AlertDialog';

const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

interface ConteoTableProps { week: WeekData; onBack: () => void; onPrint: (week: WeekData) => void; }

const ConteoTable: React.FC<ConteoTableProps> = ({ week, onBack, onPrint }) => {
  const { user, updateWeekItems, weeksData, finalizeWeek, masterStock } = useAppContext();
  const currentWeekData = weeksData.find(w => w.id === week.id) || week;
  const [editedItems, setEditedItems] = useState<Item[]>(() => JSON.parse(JSON.stringify(currentWeekData.items)));
  const [isFinalized, setIsFinalized] = useState(currentWeekData.status === 'Finalizado');
  const [view, setView] = useState<'table' | 'report' | 'modify'>('table');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const[showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const[itemOrder, setItemOrder] = useState<string[]>([]);
  const[hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const updatedWeek = weeksData.find(w => w.id === week.id);
    if (updatedWeek) setIsFinalized(updatedWeek.status === 'Finalizado');
  }, [weeksData, week.id]);

  useEffect(() => {
    const initialSortedIds = [...currentWeekData.items]
        .sort((a, b) => {
            const aCounted = a.quantity !== null;
            const bCounted = b.quantity !== null;
            if (aCounted === bCounted) return 0;
            return aCounted ? 1 : -1;
        })
        .map(item => item.id);
    setItemOrder(initialSortedIds);
  }, [week.id]);

  useEffect(() => {
    if (!hasUnsavedChanges || isFinalized) return;
    const timeoutId = setTimeout(() => { updateWeekItems(week.id, editedItems); setHasUnsavedChanges(false); }, 1500);
    return () => clearTimeout(timeoutId);
  },[editedItems, hasUnsavedChanges, isFinalized, week.id, updateWeekItems]);

  const handleItemChange = (itemId: string, field: keyof Item, value: string | number | null) => {
    setEditedItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity') {
          updated.countedDate = value !== null && value !== '' ? new Date().toISOString().split('T')[0] : null;
          updated.countedBy = user?.fullName || null;
        }
        return updated;
      }
      return item;
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => { updateWeekItems(week.id, editedItems); setHasUnsavedChanges(false); setShowSaveModal(true); setTimeout(() => { setShowSaveModal(false); onBack(); }, 1500); };
  const handleFinalize = () => setShowFinalizeModal(true);
  const confirmFinalize = async () => { if (hasUnsavedChanges) { await updateWeekItems(week.id, editedItems); setHasUnsavedChanges(false); } finalizeWeek(week.id); setIsFinalized(true); setShowFinalizeModal(false); };
  
  const canEdit = user?.role === 'admin' || !isFinalized;

  const sortedAndFilteredItems = useMemo(() => {
    const itemsById = new Map(editedItems.map(item =>[item.id, item]));
    const orderedItems = itemOrder.map(id => itemsById.get(id)).filter(Boolean) as Item[];
    if (!searchTerm) return orderedItems;
    return orderedItems.filter(item => item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [editedItems, searchTerm, itemOrder]);

  return (
    <>
      {view === 'report' && <ReporteSemanal week={week} onBack={() => setView('table')} />}
      {view === 'modify' && <ModificarSemana week={week} onBack={() => setView('table')} />}
      {view === 'table' && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-screen">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white/80 backdrop-blur-sm py-4 -mx-4 px-4 sticky top-0 z-10 border-b">
            <div>
              <Button onClick={onBack} variant="secondary" className="mb-2">&larr; Volver a Semanas</Button>
              <h2 className="text-2xl font-bold text-corporate-blue">Conteo - {week.name}</h2>
              <p className="text-slate-600">{isFinalized && user?.role !== 'admin' ? 'Este conteo ha sido finalizado.' : 'Complete los datos y guarde su avance.'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => setView('report')} variant="secondary">Ver Reporte Semanal</Button>
              <Button onClick={() => onPrint({ ...week, items: editedItems })} variant="secondary">Descargar Planilla</Button>
              {!isFinalized && <Button onClick={handleSave} className="bg-corporate-blue text-white">Guardar Avance {hasUnsavedChanges && "*"}</Button>}
            </div>
          </div>

          {showSaveModal && <Modal isOpen={true} onClose={() => { setShowSaveModal(false); onBack(); }} onConfirm={() => { setShowSaveModal(false); onBack(); }} title="Progreso Guardado"><p>Su avance ha sido guardado.</p></Modal>}
          {showFinalizeModal && <AlertDialog isOpen={true} onClose={() => setShowFinalizeModal(false)} onConfirm={confirmFinalize} title="¿Finalizar Semana?" description="Esta acción no se puede deshacer." confirmText="Sí, Finalizar" />}

          <div className="flex items-center mb-4">
            <Input placeholder="Buscar por ID o Descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
          </div>
          
          <div className="bg-white rounded-lg shadow-md border overflow-hidden flex flex-col h-[calc(100vh-230px)]">
            <div className="overflow-y-auto flex-grow">
              <Table className="relative w-full">
                <TableHeader className="sticky top-0 bg-slate-100 z-20 shadow-sm outline outline-1 outline-slate-200">
                  <TableRow>
                    <TableHead className="hidden md:table-cell">ID Material</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Tipo</TableHead>
                    <TableHead className="text-center">Stock Sistema</TableHead>
                    <TableHead className="text-center">Cantidad Contada</TableHead>
                    <TableHead className="text-center">Diferencia</TableHead>
                    <TableHead>Observación Operario</TableHead>
                    {user?.role === 'admin' && <TableHead>Comentario Admin</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredItems.map((item) => {
                    const realId = getRealId(item.id);
                    const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="hidden md:table-cell font-mono">{item.id}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Input type="text" value={item.location} onChange={(e) => handleItemChange(item.id, 'location', e.target.value)} disabled={!canEdit} className="w-32 font-mono" />
                        </TableCell>
                        
                        {/* NUEVA CELDA: TIPO */}
                        <TableCell className="hidden sm:table-cell text-center font-bold text-slate-500">{tipo}</TableCell>
                        
                        <TableCell className="text-center">
                           <Input type="number" value={item.systemStock} onChange={(e) => handleItemChange(item.id, 'systemStock', e.target.valueAsNumber || 0)} disabled={!canEdit} className="w-24 text-center font-bold mx-auto bg-slate-50" min="0" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input type="number" value={item.quantity === null ? '' : item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value === '' ? null : e.target.valueAsNumber)} disabled={!canEdit} className="w-24 text-center text-lg font-bold mx-auto" min="0" />
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity !== null && item.systemStock !== item.quantity && <Check className="h-6 w-6 text-red-600 mx-auto" />}
                        </TableCell>
                        <TableCell>
                          <Input type="text" placeholder="Observación..." value={item.operatorObservation || ''} onChange={(e) => handleItemChange(item.id, 'operatorObservation', e.target.value)} disabled={!canEdit} className="min-w-[150px]" />
                        </TableCell>
                        {user?.role === 'admin' && (
                          <TableCell>
                            <Input type="text" placeholder="Nota admin..." value={item.adminComment || ''} onChange={(e) => handleItemChange(item.id, 'adminComment', e.target.value)} className="min-w-[150px] bg-yellow-50" />
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConteoTable;