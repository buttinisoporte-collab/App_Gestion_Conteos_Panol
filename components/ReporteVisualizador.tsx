import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';

export default function ReporteVisualizador({ onBack }: { onBack?: () => void }) {
    const { weeksData, saveExternalStock, countCycle } = useAppContext();
    const[selectedWeekId, setSelectedWeekId] = useState<string>(weeksData[0]?.id || '');
    const[pasteData, setPasteData] = useState('');

    const selectedWeek = weeksData.find(w => w.id === selectedWeekId);

    const handleProcessData = () => {
        if(!selectedWeek) return;
        const rows = pasteData.trim().split('\n');
        const newExternalStock: Record<string, any> = {};

        rows.forEach((row, i) => {
            const cols = row.split('\t').map(c => c.trim());
            if(i === 0 && cols[0].toLowerCase().includes('id')) return; // Saltar encabezado
            if (cols.length >= 4) {
                const id = cols[0];
                newExternalStock[id] = {
                    id,
                    rubro: cols[1] || '-',
                    lista: cols[2] || '-',
                    stockSistema: parseFloat(cols[3].replace(',', '.')) || 0
                };
            }
        });

        if(Object.keys(newExternalStock).length > 0) {
            if(saveExternalStock) saveExternalStock(selectedWeek.id, newExternalStock);
            setPasteData('');
        } else {
            alert('No se encontraron datos válidos. Copie desde Excel 4 columnas: ID Material, Rubro, Lista, Stock.');
        }
    };

    const exportToExcel = () => {
        if(!selectedWeek || !selectedWeek.externalStock) return;
        const data = selectedWeek.items.map(item => {
            const ext = selectedWeek.externalStock![item.id] || { rubro: '-', lista: '-', stockSistema: item.systemStock };
            return {
                'ID Material': item.id,
                'Descripción': item.description,
                'Ubicación': item.location,
                'Rubro': ext.rubro,
                'Lista': ext.lista,
                'Stock Sistema': ext.stockSistema,
                'Contado App': item.quantity !== null ? item.quantity : 'No contado',
                'Diferencia Final': item.quantity !== null ? item.quantity - ext.stockSistema : ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte Stock');
        XLSX.writeFile(wb, `Reporte_Stock_Final_${selectedWeek.name}.xlsx`);
    };

    if(!countCycle) return <div className="p-8 text-center text-slate-500">No hay conteos activos.</div>;

    return (
        <div className="container mx-auto p-4 sm:p-8">
            {onBack && <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard Admin</Button>}
            
            <h2 className="text-3xl font-bold mb-6 text-corporate-blue">Cruce de Stock Sistema vs Físico</h2>
            
            <div className="mb-6 flex gap-4 items-center">
                <label className="font-semibold">Seleccionar Semana:</label>
                <select 
                    className="p-2 border rounded-md min-w-[200px]"
                    value={selectedWeekId} 
                    onChange={e => setSelectedWeekId(e.target.value)}
                >
                    {weeksData.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {!selectedWeek?.externalStock ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Cargar Datos del Sistema de Gestión ({selectedWeek?.name})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                            Copie los datos desde su sistema (Excel) y péguelos aquí. Se esperan 4 columnas en este orden exacto:<br/>
                            <b>1. ID Material | 2. Rubro | 3. Lista | 4. Stock Sistema</b>
                        </p>
                        <textarea 
                            className="w-full h-48 p-3 border rounded-md font-mono text-sm bg-slate-50"
                            placeholder="Pegue aquí el bloque de Excel..."
                            value={pasteData}
                            onChange={e => setPasteData(e.target.value)}
                        />
                        <Button onClick={handleProcessData} className="mt-4 bg-corporate-blue text-white">
                            Procesar y Cruzar Datos
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Reporte Generado ({selectedWeek.name})</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => saveExternalStock && saveExternalStock(selectedWeek.id, {} as any)}>
                                Borrar Datos y Recargar
                            </Button>
                            <Button variant="secondary" onClick={exportToExcel} className="bg-green-700 text-white hover:bg-green-800">
                                Exportar a Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[60vh] overflow-y-auto border rounded-md relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-100 shadow-sm z-10 outline outline-1 outline-slate-200">
                                    <TableRow>
                                        <TableHead>ID Material</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead>Rubro</TableHead>
                                        <TableHead>Lista</TableHead>
                                        <TableHead className="text-center">Stock Sistema</TableHead>
                                        <TableHead className="text-center">Contado App</TableHead>
                                        <TableHead className="text-center font-bold text-red-700">Diferencia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedWeek.items.map(item => {
                                        const ext = selectedWeek.externalStock![item.id] || { rubro: '-', lista: '-', stockSistema: item.systemStock };
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                <TableCell className="text-sm font-medium">{item.description}</TableCell>
                                                <TableCell className="text-sm">{item.location}</TableCell>
                                                <TableCell className="text-sm">{ext.rubro}</TableCell>
                                                <TableCell className="text-sm">{ext.lista}</TableCell>
                                                <TableCell className="text-center font-bold text-slate-500 bg-slate-50">{ext.stockSistema}</TableCell>
                                                <TableCell className="text-center font-bold text-corporate-blue">{item.quantity ?? '-'}</TableCell>
                                                <TableCell className={`text-center font-bold ${item.quantity !== null && item.quantity !== ext.stockSistema ? 'text-red-600 bg-red-50' : 'text-green-600'}`}>
                                                    {item.quantity !== null && item.quantity !== ext.stockSistema ? item.quantity - ext.stockSistema : (item.quantity !== null ? '0' : '-')}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}