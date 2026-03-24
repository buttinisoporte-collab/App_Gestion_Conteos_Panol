import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';

// Formato de los datos que pegaremos del ERP
interface ParsedData {
    id: string;
    description: string;
    stockSistema: number;
}

export default function ReporteVisualizador({ onBack }: { onBack?: () => void }) {
    const { weeksData, saveExternalStock, updateWeekItems, countCycle } = useAppContext();
    const[selectedWeekId, setSelectedWeekId] = useState<string>(weeksData[0]?.id || '');
    const[pasteData, setPasteData] = useState('');
    
    // Estado para la previsualización antes de guardar
    const[previewData, setPreviewData] = useState<Record<string, ParsedData> | null>(null);
    // Estado para mostrar la caja de texto si queremos anexar más datos
    const [isAppending, setIsAppending] = useState(false);

    const selectedWeek = weeksData.find(w => w.id === selectedWeekId);

    // 1. PROCESAR DATOS PEGADOS (Genera Previsualización)
    const handleProcessData = () => {
        if (!selectedWeek) return;
        const rows = pasteData.trim().split('\n');
        const newPreview: Record<string, ParsedData> = {};

        rows.forEach((row, i) => {
            const cols = row.split('\t').map(c => c.trim());
            if (i === 0 && cols[0].toLowerCase().includes('id')) return; // Saltar encabezado
            
            // Esperamos exactamente 3 columnas: ID, Descripción, Stock
            if (cols.length >= 3) {
                const id = cols[0];
                newPreview[id] = {
                    id,
                    description: cols[1] || '-',
                    stockSistema: parseFloat(cols[2].replace(',', '.')) || 0
                };
            }
        });

        if (Object.keys(newPreview).length > 0) {
            setPreviewData(newPreview);
            setIsAppending(false);
        } else {
            alert('No se encontraron datos válidos. Copie 3 columnas de Excel: ID Material, Descripción, Stock.');
        }
    };

    // 2. GUARDAR DATOS (Anexa, guarda y crea faltantes en la App)
    const handleSaveData = async () => {
        if (!selectedWeek || !previewData) return;

        // Mezclamos los datos que ya existían con los nuevos (Anexar)
        const currentExt = selectedWeek.externalStock || {};
        const mergedExt = { ...currentExt, ...previewData };

        // Buscamos ítems que NO existen en la base de la App para agregarlos
        const existingAppIds = new Set(selectedWeek.items.map(i => i.id.toLowerCase()));
        const newAppItems = [...selectedWeek.items];
        let addedCount = 0;

        Object.values(previewData).forEach(extItem => {
            if (!existingAppIds.has(extItem.id.toLowerCase())) {
                newAppItems.push({
                    id: extItem.id,
                    description: extItem.description,
                    manufacturerCode: '-',
                    category: '-',
                    location: 'Faltante de ERP',
                    systemStock: extItem.stockSistema,
                    quantity: 0, // Se deja el conteo en 0 como se solicitó
                });
                addedCount++;
            }
        });

        // Actualizamos los ítems reales de la app (si hubo nuevos)
        if (addedCount > 0) {
            await updateWeekItems(selectedWeek.id, newAppItems);
        }
        
        // Guardamos el historial del ERP
        if (saveExternalStock) {
            await saveExternalStock(selectedWeek.id, mergedExt as any);
        }

        setPreviewData(null);
        setPasteData('');
        alert(`Cruce guardado exitosamente.\nSe detectaron y agregaron ${addedCount} ítems faltantes al conteo de la aplicación dejándolos en cantidad 0.`);
    };

    const handleCancelPreview = () => {
        setPreviewData(null);
        setPasteData('');
    };

    const handleClearAll = () => {
        if (window.confirm('¿Está seguro de borrar todo el cruce del ERP para esta semana? Esto no borrará lo que contaron los operarios, solo el cruce.')) {
            if (saveExternalStock) saveExternalStock(selectedWeek!.id, {} as any);
        }
    };

    // 3. GENERAR FILAS PARA LA TABLA (Combina App + ERP)
    const displayRows = useMemo(() => {
        if (!selectedWeek) return[];
        
        const activeExtData = previewData 
            ? { ...(selectedWeek.externalStock || {}), ...previewData } 
            : (selectedWeek.externalStock || {});

        const rows: any[] =[];
        const processedIds = new Set<string>();

        // Agregamos todos los ítems que ya tiene la App
        selectedWeek.items.forEach(item => {
            const ext = activeExtData[item.id] || activeExtData[item.id.toLowerCase()];
            const stockSist = ext ? ext.stockSistema : item.systemStock;
            const desc = ext ? ext.description : item.description;
            
            rows.push({
                id: item.id,
                description: desc,
                location: item.location,
                stockSistema: stockSist,
                contadoApp: item.quantity !== null ? item.quantity : 'No contado',
                diferencia: item.quantity !== null ? item.quantity - stockSist : '',
                isNew: false
            });
            processedIds.add(item.id.toLowerCase());
        });

        // Agregamos los que vienen del ERP y no están en la App (Se resaltarán en la tabla)
        Object.values(activeExtData).forEach((ext: any) => {
            if (!processedIds.has(ext.id.toLowerCase())) {
                rows.push({
                    id: ext.id,
                    description: ext.description,
                    location: 'Se agregará a App',
                    stockSistema: ext.stockSistema,
                    contadoApp: 0, // Se mostrará como 0 porque así se guardará
                    diferencia: 0 - ext.stockSistema,
                    isNew: true 
                });
            }
        });

        return rows;
    },[selectedWeek, previewData]);

    const exportToExcel = () => {
        const data = displayRows.map(r => ({
            'ID Material': r.id,
            'Descripción': r.description,
            'Ubicación': r.location,
            'Stock Sistema': r.stockSistema,
            'Contado App': r.contadoApp,
            'Diferencia Final': r.diferencia
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte Stock');
        XLSX.writeFile(wb, `Reporte_Cruce_${selectedWeek?.name}.xlsx`);
    };

    if (!countCycle) return <div className="p-8 text-center text-slate-500">No hay conteos activos.</div>;

    const hasSavedData = selectedWeek?.externalStock && Object.keys(selectedWeek.externalStock).length > 0;

    return (
        <div className="container mx-auto p-4 sm:p-8">
            {onBack && <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard Admin</Button>}
            
            <h2 className="text-3xl font-bold mb-6 text-corporate-blue">Cruce de Stock Sistema vs Físico</h2>
            
            <div className="mb-6 flex gap-4 items-center">
                <label className="font-semibold">Seleccionar Semana:</label>
                <select 
                    className="p-2 border rounded-md min-w-[200px]"
                    value={selectedWeekId} 
                    onChange={e => { setSelectedWeekId(e.target.value); setPreviewData(null); setIsAppending(false); }}
                >
                    {weeksData.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {/* SECCIÓN DE CARGA DE DATOS (Aparece si no hay datos, o si tocamos "Anexar") */}
            {(!hasSavedData || isAppending) && !previewData && (
                <Card className="mb-6 border-corporate-blue/30 shadow-md">
                    <CardHeader>
                        <CardTitle>{hasSavedData ? 'Anexar Nuevos Datos' : 'Cargar Datos del Sistema de Gestión'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                            Copie los datos desde Excel y péguelos aquí. Se esperan 3 columnas en este orden exacto:<br/>
                            <b>1. ID Material | 2. Descripción | 3. Stock Sistema</b>
                        </p>
                        <textarea 
                            className="w-full h-48 p-3 border rounded-md font-mono text-sm bg-slate-50"
                            placeholder="Pegue aquí el bloque de Excel..."
                            value={pasteData}
                            onChange={e => setPasteData(e.target.value)}
                        />
                        <div className="mt-4 flex gap-2">
                            <Button onClick={handleProcessData} className="bg-corporate-blue text-white">
                                Procesar y Previsualizar
                            </Button>
                            {hasSavedData && (
                                <Button onClick={() => setIsAppending(false)} variant="ghost">Cancelar Anexado</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AVISO DE PREVISUALIZACIÓN ANTES DE GUARDAR */}
            {previewData && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-amber-800 text-lg">Modo Previsualización</h3>
                        <p className="text-sm text-amber-700">Revise la tabla debajo. Los ítems resaltados en amarillo son faltantes que se agregarán a la App con cantidad 0.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCancelPreview} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">Cancelar</Button>
                        <Button onClick={handleSaveData} className="bg-green-600 text-white hover:bg-green-700">Confirmar y Guardar Cruce</Button>
                    </div>
                </div>
            )}

            {/* TABLA DE RESULTADOS (Se muestra si hay datos guardados o estamos en previsualización) */}
            {(hasSavedData || previewData) && (
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Cruce Resultante ({selectedWeek?.name})</CardTitle>
                        {!previewData && (
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => setIsAppending(true)} className="border-corporate-blue text-corporate-blue">
                                    + Anexar más datos
                                </Button>
                                <Button variant="outline" onClick={handleClearAll} className="text-red-600 border-red-200 hover:bg-red-50">
                                    Borrar Cruce
                                </Button>
                                <Button variant="secondary" onClick={exportToExcel} className="bg-green-700 text-white hover:bg-green-800">
                                    Exportar a Excel
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[60vh] overflow-y-auto border rounded-md relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-100 shadow-sm z-10 outline outline-1 outline-slate-200">
                                    <TableRow>
                                        <TableHead>ID Material</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead className="text-center">Stock ERP</TableHead>
                                        <TableHead className="text-center">Contado App</TableHead>
                                        <TableHead className="text-center font-bold text-red-700">Diferencia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayRows.map((row, idx) => (
                                        <TableRow key={`${row.id}-${idx}`} className={row.isNew ? 'bg-amber-100/50' : ''}>
                                            <TableCell className="font-mono text-xs">{row.id}</TableCell>
                                            <TableCell className="text-sm font-medium">{row.description}</TableCell>
                                            <TableCell className="text-sm">{row.location}</TableCell>
                                            <TableCell className="text-center font-bold text-slate-500 bg-slate-50/50">{row.stockSistema}</TableCell>
                                            <TableCell className="text-center font-bold text-corporate-blue">{row.contadoApp}</TableCell>
                                            <TableCell className={`text-center font-bold ${row.diferencia !== '' && row.diferencia !== 0 ? 'text-red-600 bg-red-50' : 'text-green-600'}`}>
                                                {row.diferencia}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}