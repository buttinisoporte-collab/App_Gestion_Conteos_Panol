
import { WeekData, Item, WeekStatus, AppState, CountCycle } from '../types';

const MOCK_ITEMS_S1: Item[] = [
  { id: 'F001', description: 'Filtro de Aceite Motor X', manufacturerCode: 'MANN-W940', category: 'Filtros', location: 'A1-S1-P1', systemStock: 10, quantity: null },
  { id: 'C002', description: 'Correa Poly-V 6PK1080', manufacturerCode: 'GATES-6PK1080', category: 'Correas', location: 'A1-S1-P2', systemStock: 15, quantity: null },
  { id: 'L003', description: 'Lámpara H7 12V 55W', manufacturerCode: 'OSRAM-64210', category: 'Iluminación', location: 'A1-S2-P1', systemStock: 50, quantity: null },
  { id: 'B004', description: 'Batería 12V 75Ah', manufacturerCode: 'MOURA-M22GD', category: 'Eléctrico', location: 'B2-S1-P1', systemStock: 5, quantity: null },
  { id: 'P005', description: 'Pastillas de Freno Delanteras', manufacturerCode: 'FRASLE-PD150', category: 'Frenos', location: 'C1-S3-P3', systemStock: 22, quantity: null },
];

const MOCK_ITEMS_S2: Item[] = [
  { id: 'F006', description: 'Filtro de Aire Cabina', manufacturerCode: 'FRAM-CF10134', category: 'Filtros', location: 'A1-S1-P3', systemStock: 12, quantity: null },
  { id: 'A007', description: 'Amortiguador Delantero', manufacturerCode: 'MONROE-33052', category: 'Suspensión', location: 'D2-S2-P1', systemStock: 8, quantity: null },
  { id: 'E008', description: 'Escobilla Limpiaparabrisas 24"', manufacturerCode: 'BOSCH-3397007555', category: 'Accesorios', location: 'E1-S1-P5', systemStock: 30, quantity: null },
  { id: 'R009', description: 'Rulemán Rueda Delantera', manufacturerCode: 'SKF-VKBA3644', category: 'Rodamientos', location: 'F3-S2-P2', systemStock: 16, quantity: null },
  { id: 'T010', description: 'Termostato Motor', manufacturerCode: 'THOMSON-TH45587', category: 'Motor', location: 'A2-S4-P1', systemStock: 9, quantity: null },
];

const generateEmptyItems = (startId: number): Item[] => {
    return Array.from({ length: 5 }, (_, i) => ({
        id: `G${startId + i}`,
        description: `Componente Genérico ${startId + i}`,
        manufacturerCode: '',
        category: 'General',
        location: `Z${startId + i}-S1-P1`,
        systemStock: Math.floor(Math.random() * 20),
        quantity: null,
    }));
};

const getInitialWeeks = (): WeekData[] => [
    { id: 'S1', name: 'Semana 1', status: WeekStatus.Pendiente, items: JSON.parse(JSON.stringify(MOCK_ITEMS_S1)) },
    { id: 'S2', name: 'Semana 2', status: WeekStatus.Bloqueado, items: JSON.parse(JSON.stringify(MOCK_ITEMS_S2)) },
    { id: 'S3', name: 'Semana 3', status: WeekStatus.Bloqueado, items: generateEmptyItems(11) },
    { id: 'S4', name: 'Semana 4', status: WeekStatus.Bloqueado, items: generateEmptyItems(16) },
    { id: 'S5', name: 'Semana 5', status: WeekStatus.Bloqueado, items: generateEmptyItems(21) },
    { id: 'S6', name: 'Semana 6', status: WeekStatus.Bloqueado, items: generateEmptyItems(26) },
    { id: 'S7', name: 'Semana 7', status: WeekStatus.Bloqueado, items: generateEmptyItems(31) },
    { id: 'S8', name: 'Semana 8', status: WeekStatus.Bloqueado, items: generateEmptyItems(36) },
];

export const getInitialData = (): AppState => {
  // This function will return the default state of the application
  return {
    users: [
      {
        id: 'admin-01',
        username: 'Admin',
        fullName: 'Administrador del Sistema',
        dni: '00000000',
        employeeId: '000',
        password: 'Admin',
        role: 'admin',
        status: 'active',
        mustChangePassword: false,
        auditLog: []
      },
      {
        id: 'user-01',
        username: 'operario1',
        fullName: 'Juan Perez',
        dni: '12345678',
        employeeId: '101',
        password: 'operario1',
        role: 'operario',
        status: 'active',
        mustChangePassword: true,
        auditLog: []
      },
    ],
    currentCount: null,
    historicalCounts: [],
  };
};

const STORAGE_KEY = 'conteoPañolData_v2';

export const loadDataFromLocalStorage = (): AppState => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      // Basic validation to ensure it's the new format
      if (data.hasOwnProperty('currentCount') && data.hasOwnProperty('historicalCounts')) {
        let modified = false;
        // Ensure users exist even in old data
        if (!data.users || data.users.length === 0) {
          data.users = getInitialData().users;
          modified = true;
        } else {
          // Ensure existing users have passwords and mustChangePassword flag if missing
          const originalUsers = JSON.stringify(data.users);
          data.users = data.users.map((u: any) => ({
            ...u,
            password: u.password || u.username,
            mustChangePassword: u.mustChangePassword !== undefined ? u.mustChangePassword : true,
            auditLog: u.auditLog || []
          }));
          if (originalUsers !== JSON.stringify(data.users)) {
            modified = true;
          }
        }
        if (modified) {
          saveDataToLocalStorage(data);
        }
        return data;
      }
    }
  } catch (error) {
    console.error("Error loading data from localStorage", error);
  }
  // If no new data, let's see if we can migrate old data
  try {
    const oldData = localStorage.getItem('conteoPañolData');
    if(oldData) {
        const weeks: WeekData[] = JSON.parse(oldData);
        if(Array.isArray(weeks)) {
            const migratedData: AppState = {
                users: getInitialData().users,
                currentCount: {
                    id: `migrated-${Date.now()}`,
                    name: `Conteo Migrado`,
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    creationDate: new Date().toISOString(),
                    weeks: weeks
                },
                historicalCounts: []
            };
            saveDataToLocalStorage(migratedData);
            localStorage.removeItem('conteoPañolData');
            return migratedData;
        }
    }
  } catch (error) {
    console.error("Error migrating old data", error);
  }

  return getInitialData();
};

export const saveDataToLocalStorage = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data to localStorage", error);
  }
};
