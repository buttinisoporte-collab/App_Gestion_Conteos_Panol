// filepath: components/MasterStockManager.tsx
import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { MasterStockItem } from '../types';
import Modal from './ui/Modal';

export default function MasterStockManager({ onBack }: { onBack: () => void }) {
  const { updateMasterStock, masterStockDate, countCycle, masterStock } = useAppContext();
  
  // --- ESTADOS DECLARADOS ---
  const [pasteData, setPasteData] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processedData, setProcessedData] = useState<Record<string, MasterStockItem>>({});
  const [options, setOptions] = useState({ updateLoc: false, updateStock: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para parsear texto delimitado (tab, coma, punto y coma) con soporte de comillas
  const parseDelimitedText = (text: string): { stock: Record<string, MasterStockItem>; count: number } => {
    const lines = text.split(/\r?\n/);
    const newStock: Record<string, MasterStockItem> = {};
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detectar delimitador de la línea
      let delimiter = '\t';
      if (line.includes('\t')) {
        delimiter = '\t';
      } else {
        const semicolonCount = (line.match(/;/g) || []).length;
        const commaCount = (line.match(/,/g) || []).length;
        delimiter = semicolonCount >= commaCount ? ';' : ',';
      }

      // Separar columnas respetando comillas
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"') {
          if (inQuotes && line[charIdx + 1] === '"') {
            current += '"';
            charIdx++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current.trim());

      const cleanCols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());

      // Saltar fila de cabecera si existe
      if (i === 0 && (cleanCols[0].toLowerCase().includes('id') || cleanCols[0].toLowerCase().includes('material'))) {
        continue;
      }

      if (cleanCols.length >= 4 && cleanCols[0]) {
        const id = cleanCols[0];
        newStock[id] = {
          id,
          description: cleanCols[1] || '',
          location: cleanCols[2] || '',
          type: (cleanCols[3] || 'S/T').toUpperCase(),
          systemStock: cleanCols[4] !== undefined && cleanCols[4] !== '' ? Number(cleanCols[4].replace(',', '.')) : undefined
        };
        count++;
      } else if (cleanCols.length === 3 && cleanCols[0]) {
        const id = cleanCols[0];
        newStock[id] = {
          id,
          description: cleanCols[1] || '',
          location: cleanCols[2] || '',
          type: 'S/T',
          systemStock: undefined
        };
        count++;
      }
    }

    return { stock: newStock, count };
  };

  // Procesar datos y abrir confirmación o ejecutar
  const processRawData = (text: string) => {
    const { stock, count } = parseDelimitedText(text);

    if (count > 0) {
      setProcessedData(stock);
      if (countCycle) {
        setShowConfirmModal(true);
      } else {
        executeUpdate(stock, false, false);
      }
    } else {
      alert('Datos inválidos. El archivo o texto debe contener las columnas: ID_Material, Descripción, Ubicación, TIPO (opcional 5ta: Stock_Sistema).');
    }
  };

  const handleProcess = () => {
    processRawData(pasteData);
  };

  // Subir archivo CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteData(content);
        processRawData(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // Exportar archivo CSV con cabeceras y datos del Stock Maestro (o modelo)
  const handleExportCSV = () => {
    const items = Object.values(masterStock || {});
    const headers = ['ID_Material', 'Descripción', 'Ubicación', 'TIPO', 'Stock_Sistema'];
    const rows: string[] = [];

    // Usar punto y coma (;) como delimitador estándar para abrir directamente en Excel en español
    rows.push(headers.join(';'));

    if (items.length > 0) {
      const escapeCol = (val: any) => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(';') || str.includes('\n') || str.includes('"') || str.includes(',')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      items.forEach(item => {
        rows.push([
          escapeCol(item.id),
          escapeCol(item.description),
          escapeCol(item.location),
          escapeCol(item.type || 'S/T'),
          escapeCol(item.systemStock !== undefined ? item.systemStock : '')
        ].join(';'));
      });
    } else {
      // Filas de modelo de ejemplo si aún no hay artículos
      rows.push('10054;FILTRO DE ACEITE;ESTANTE A1;REPUESTO;15');
      rows.push('10055;CORREA DE DISTRIBUCION;ESTANTE B2;REPUESTO;8');
      rows.push('10056;PASTILLAS DE FRENO;ESTANTE C3;REPUESTO;4');
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Stock_Maestro_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función que llama al servicio en AppContext
  const executeUpdate = async (data: Record<string, MasterStockItem>, upLoc: boolean, upStock: boolean) => {
    try {
      const success = await updateMasterStock(data, upLoc, upStock);
      if (success) {
        alert(`¡Actualización Exitosa!\nSe procesaron ${Object.keys(data).length} artículos.\nLas descripciones se actualizaron en todo el ciclo.`);
        setPasteData('');
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const totalItems = masterStock ? Object.keys(masterStock).length : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard</Button>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Cargar Stock Maestro General</CardTitle>
            <CardDescription className="text-corporate-blue font-bold">
              Última actualización en base de datos: {masterStockDate ? new Date(masterStockDate).toLocaleString('es-AR') : 'Nunca'}
              {totalItems > 0 && ` | ${totalItems} artículos registrados`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleExportCSV}
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50 font-bold text-xs sm:text-sm"
            >
              Exportar .CSV (Modelo / Stock)
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-corporate-blue text-corporate-blue hover:bg-blue-50 font-bold text-xs sm:text-sm"
            >
              Subir Archivo .CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">
            Pegue aquí los datos desde su archivo Excel o suba un archivo .csv. El sistema espera:<br/>
            <b>1. ID_Material | 2. Descripción | 3. Ubicacion | 4. TIPO | 5. Stock (Opcional)</b>
          </p>
          <textarea
            className="w-full h-64 p-3 border rounded-md font-mono text-sm bg-slate-50"
            placeholder="Pegue los datos aquí o suba un archivo .csv..."
            value={pasteData}
            onChange={e => setPasteData(e.target.value)}
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={handleProcess} className="bg-corporate-blue text-white hover:bg-corporate-blue/90 font-bold">
              Procesar y Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE CONFIRMACIÓN */}
      {showConfirmModal && (
        <Modal 
          isOpen={true} 
          onClose={() => setShowConfirmModal(false)} 
          onConfirm={() => executeUpdate(processedData, options.updateLoc, options.updateStock)}
          title="Confirmar Actualización"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Se detectó un <b>Conteo Actual</b>. Las descripciones se actualizarán en todas las semanas.
            </p>
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="text-sm font-bold text-amber-800 mb-3">¿Actualizar también en semanas activas?</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 hover:bg-amber-100 rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-amber-400 text-amber-600"
                    checked={options.updateLoc}
                    onChange={e => setOptions({...options, updateLoc: e.target.checked})}
                  />
                  <span className="text-sm font-medium">Actualizar Ubicaciones</span>
                </label>
                <label className="flex items-center gap-3 p-2 hover:bg-amber-100 rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-amber-400 text-amber-600"
                    checked={options.updateStock}
                    onChange={e => setOptions({...options, updateStock: e.target.checked})}
                  />
                  <span className="text-sm font-medium">Actualizar Stock de Sistema (Columna 5)</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}