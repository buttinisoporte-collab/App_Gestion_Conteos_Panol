import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { User, CountCycle, WeekStatus, Item, MasterStockItem } from '../types';

const USERS_KEY = 'panol_users';
const CURRENT_COUNT_KEY = 'panol_current_count';
const HISTORICAL_COUNTS_KEY = 'panol_historical_counts';
const MASTER_STOCK_KEY = 'panol_master_stock';

export const DEFAULT_USERS: User[] = [
  {
    id: 'admin-01',
    username: 'Admin',
    password: 'Admin',
    role: 'admin',
    fullName: 'Administrador del Sistema',
    dni: '00000000',
    employeeId: 'ADM-01',
    status: 'active',
    mustChangePassword: false
  },
  {
    id: 'operario-01',
    username: 'operario',
    password: 'operario',
    role: 'operario',
    fullName: 'Operario Pañol',
    dni: '11111111',
    employeeId: 'OP-01',
    status: 'active',
    mustChangePassword: false
  }
];

export const INITIAL_DEMO_CYCLE: CountCycle = {
  id: 'C-demo-01',
  name: 'Ciclo de Conteo Activo - Pañol',
  startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
  creationDate: new Date().toISOString(),
  weeks: [
    {
      id: 'sem-1',
      name: 'Semana 1 - Filtros y Correas',
      startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now()).toISOString().split('T')[0],
      status: WeekStatus.EnProgreso,
      items: [
        {
          id: 'MAT-1001',
          description: 'Filtro de Aceite LF16015',
          manufacturerCode: 'LF16015',
          category: 'Filtros',
          location: 'Estantería A1-02',
          systemStock: 25,
          quantity: 25,
          countedDate: new Date().toISOString().split('T')[0],
          countedBy: 'Operario Pañol',
          operatorObservation: 'Buen estado'
        },
        {
          id: 'MAT-1002',
          description: 'Filtro de Combustible FS19732',
          manufacturerCode: 'FS19732',
          category: 'Filtros',
          location: 'Estantería A1-03',
          systemStock: 18,
          quantity: 16,
          countedDate: new Date().toISOString().split('T')[0],
          countedBy: 'Operario Pañol',
          operatorObservation: 'Diferencia de 2 unidades'
        },
        {
          id: 'MAT-1003',
          description: 'Correa Poli-V 8PK1420',
          manufacturerCode: '8PK1420',
          category: 'Correas',
          location: 'Estantería B2-01',
          systemStock: 12,
          quantity: null,
          countedDate: null,
          countedBy: null
        }
      ]
    },
    {
      id: 'sem-2',
      name: 'Semana 2 - Lubricantes y Fluidos',
      startDate: new Date(Date.now()).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: WeekStatus.Pendiente,
      items: [
        {
          id: 'MAT-2001',
          description: 'Aceite Motor 15W40 20L',
          manufacturerCode: 'OIL-15W40',
          category: 'Lubricantes',
          location: 'Depósito Central D1',
          systemStock: 30,
          quantity: null,
          countedDate: null,
          countedBy: null
        },
        {
          id: 'MAT-2002',
          description: 'Líquido Refrigerante Anticongelante 5L',
          manufacturerCode: 'REF-5L',
          category: 'Fluidos',
          location: 'Depósito Central D2',
          systemStock: 45,
          quantity: null,
          countedDate: null,
          countedBy: null
        }
      ]
    },
    {
      id: 'sem-3',
      name: 'Semana 3 - Frenos y Suspensión',
      startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: WeekStatus.Bloqueado,
      items: [
        {
          id: 'MAT-3001',
          description: 'Pastillas de Freno Delanteras',
          manufacturerCode: 'PF-DEL-01',
          category: 'Frenos',
          location: 'Estantería C1-04',
          systemStock: 14,
          quantity: null,
          countedDate: null,
          countedBy: null
        }
      ]
    },
    {
      id: 'sem-4',
      name: 'Semana 4 - Neumáticos y Rodamientos',
      startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      status: WeekStatus.Bloqueado,
      items: [
        {
          id: 'MAT-4001',
          description: 'Rodamiento de Rueda 32218',
          manufacturerCode: 'SKF-32218',
          category: 'Rodamientos',
          location: 'Estantería C2-05',
          systemStock: 8,
          quantity: null,
          countedDate: null,
          countedBy: null
        }
      ]
    }
  ]
};

export const dataService = {
  // OBTENER USUARIOS
  async getUsers(): Promise<User[]> {
    if (isFirebaseConfigured && db) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 7000)
        );
        const querySnapshot = await Promise.race([
          getDocs(collection(db, 'users')),
          timeoutPromise
        ]);
        if (querySnapshot && !querySnapshot.empty) {
          const users = querySnapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as User)
          }));
          try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
          } catch {
            // ignore
          }
          return users;
        }
      } catch (e) {
        console.warn('Error obteniendo usuarios de Firebase:', e);
      }
    }

    try {
      const local = localStorage.getItem(USERS_KEY);
      if (local) {
        const parsed = JSON.parse(local) as User[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Inicializar con usuarios predeterminados si no hay Firebase configurado
    if (!isFirebaseConfigured) {
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      } catch {
        // ignore
      }
      return DEFAULT_USERS;
    }
    return [];
  },

  // GUARDAR USUARIO
  async saveUser(user: User): Promise<boolean> {
    try {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      let updatedUsers: User[];
      if (index >= 0) {
        updatedUsers = [...users];
        updatedUsers[index] = user;
      } else {
        updatedUsers = [...users, user];
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Error guardando usuario local:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.id), user);
      } catch (err) {
        console.warn('Error guardando usuario en Firebase:', err);
      }
    }

    return true;
  },

  // OBTENER EL CONTEO ACTUAL
  async getCurrentCount(): Promise<CountCycle | null> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'count_cycles'), where('archived', '==', false));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 7000)
        );
        const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);

        if (querySnapshot && !querySnapshot.empty) {
          const current = { id: querySnapshot.docs[0].id, ...(querySnapshot.docs[0].data() as CountCycle) };
          try {
            localStorage.setItem(CURRENT_COUNT_KEY, JSON.stringify(current));
          } catch {
            // ignore
          }
          return current;
        } else {
          try {
            localStorage.removeItem(CURRENT_COUNT_KEY);
          } catch {}
          return null;
        }
      } catch (e) {
        console.warn('Error obteniendo conteo actual de Firebase:', e);
      }
    }

    try {
      const local = localStorage.getItem(CURRENT_COUNT_KEY);
      if (local) {
        return JSON.parse(local) as CountCycle;
      }
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured) {
      try {
        localStorage.setItem(CURRENT_COUNT_KEY, JSON.stringify(INITIAL_DEMO_CYCLE));
        return INITIAL_DEMO_CYCLE;
      } catch {
        return null;
      }
    }
    return null;
  },

  // GUARDAR UN CICLO COMPLETO
  async saveCountCycle(cycle: CountCycle): Promise<boolean> {
    const cycleData = { ...cycle, archived: false };
    try {
      localStorage.setItem(CURRENT_COUNT_KEY, JSON.stringify(cycleData));
    } catch (e) {
      console.warn('Error guardando conteo local:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'count_cycles', cycle.id), cycleData);
      } catch (err) {
        console.warn('Error guardando conteo en Firebase:', err);
      }
    }

    return true;
  },

  // ARCHIVAR CICLO
  async archiveCountCycle(cycleId: string): Promise<boolean> {
    try {
      const current = await this.getCurrentCount();
      if (current && current.id === cycleId) {
        const historical = await this.getHistoricalCounts();
        const archivedCycle = { ...current, archived: true };
        const updatedHistorical = [archivedCycle, ...historical.filter(h => h.id !== cycleId)];
        localStorage.setItem(HISTORICAL_COUNTS_KEY, JSON.stringify(updatedHistorical));
        localStorage.removeItem(CURRENT_COUNT_KEY);
      }
    } catch (e) {
      console.warn('Error archivando ciclo local:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const cycleRef = doc(db, 'count_cycles', cycleId);
        await updateDoc(cycleRef, { archived: true });
      } catch (err) {
        console.warn('Error archivando ciclo en Firebase:', err);
      }
    }

    return true;
  },

  // OBTENER CONTEOS HISTÓRICOS (ARCHIVADOS)
  async getHistoricalCounts(): Promise<CountCycle[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'count_cycles'), where('archived', '==', true));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 7000)
        );
        const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);

        if (querySnapshot && !querySnapshot.empty) {
          const historical = querySnapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as CountCycle)
          }));
          try {
            localStorage.setItem(HISTORICAL_COUNTS_KEY, JSON.stringify(historical));
          } catch {
            // ignore
          }
          return historical;
        }
      } catch (e) {
        console.warn('Error obteniendo históricos de Firebase:', e);
      }
    }

    try {
      const local = localStorage.getItem(HISTORICAL_COUNTS_KEY);
      if (local) {
        return JSON.parse(local) as CountCycle[];
      }
    } catch {
      // ignore
    }

    return [];
  },

  // --- FUNCIONES PARA STOCK MAESTRO ---
  async getMasterStock(): Promise<{ items: Record<string, MasterStockItem>, lastUpdated: string | null }> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'master_stock');
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 7000)
        );
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);

        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          const result = { items: data.items || {}, lastUpdated: data.lastUpdated || null };
          try {
            localStorage.setItem(MASTER_STOCK_KEY, JSON.stringify(result));
          } catch {
            // ignore
          }
          return result;
        }
      } catch (e) {
        console.warn('Error obteniendo stock maestro de Firebase:', e);
      }
    }

    try {
      const local = localStorage.getItem(MASTER_STOCK_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch {
      // ignore
    }

    return { items: {}, lastUpdated: null };
  },

  async saveMasterStock(items: Record<string, MasterStockItem>, lastUpdated: string): Promise<boolean> {
    try {
      localStorage.setItem(MASTER_STOCK_KEY, JSON.stringify({ items, lastUpdated }));
    } catch (e) {
      console.warn('Error guardando stock maestro local:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'master_stock'), { items, lastUpdated });
      } catch (err) {
        console.warn('Error guardando stock maestro en Firebase:', err);
      }
    }

    return true;
  },

  // INICIALIZAR / RESTAURAR DATOS POR DEFECTO
  async seedInitialData(): Promise<void> {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      const current = localStorage.getItem(CURRENT_COUNT_KEY);
      if (!current) {
        localStorage.setItem(CURRENT_COUNT_KEY, JSON.stringify(INITIAL_DEMO_CYCLE));
      }
    } catch (e) {
      console.warn('Error inicializando datos locales:', e);
    }
  }
};
