import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Role, WeekData, Item, WeekStatus, AppState, CountCycle, AuditLogEntry, SettingsData } from '../types';
import { dataService } from '../services/dataService';
import { settingsService } from '../services/settingsService';
import { AppContextType } from '../types';
import { RefreshCw } from '../components/ui/Icons';

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: SettingsData = {
  companyName: 'Gestión de Pañol',
  logoUrl: '',
  loginLogoUrl: '',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const[countCycle, setCountCycle] = useState<CountCycle | null>(null);
  const[historicalCounts, setHistoricalCounts] = useState<CountCycle[]>([]);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [masterStock, setMasterStock] = useState<Record<string, MasterStockItem>>({});
  const [masterStockDate, setMasterStockDate] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    
    // Timeout para prevenir carga infinita si Firebase no responde
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetching data')), 15000)
    );

    try {
      const fetchPromise = Promise.all([
        dataService.getUsers(),
        dataService.getCurrentCount(),
        dataService.getHistoricalCounts(), // <-- OJO: Asegúrate de tener esta función en tu dataService.ts
        dataService.getMasterStock()
      ]);

      const [fetchedUsers, fetchedCurrentCount, fetchedHistorical, fetchedTours, fetchedMasterStockData] = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<any>);
      
      setUsers(fetchedUsers || []);
      setCountCycle(fetchedCurrentCount || null);
      setHistoricalCounts(fetchedHistorical ||[]);
      setTours(fetchedTours ||[]);
      setMasterStock(fetchedMasterStockData?.items || {});
      setMasterStockDate(fetchedMasterStockData?.lastUpdated || null);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  },[]);

  useEffect(() => {
    const init = async () => {
      try {
        const remoteSettings = await settingsService.getSettings();
        if (remoteSettings) {
          setSettings(remoteSettings);
        } else {
          await settingsService.updateAllSettings(defaultSettings);
        }
      } catch (error) {
        console.warn('Ignorando error de settings para no trabar la app:', error);
      } finally {
        await refreshData();
      }
    };
    init();
  }, [refreshData]);

  const resetApplicationData = async () => {
    if (user?.username !== 'Admin') {
      alert('Acción no permitida.');
      return;
    }
    if (window.confirm('¿Está seguro? Esta acción borrará TODOS los datos y restaurará la aplicación a su estado inicial.')) {
      alert('Para reiniciar los datos en Firebase, elimine las colecciones directamente desde la consola de Firestore.');
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (foundUser && foundUser.status === 'inactive') {
      alert('Su usuario está inactivo. Comuníquese con el sector de Soporte Técnico para resolver su situación.');
      return false;
    }
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;

    const updatedUser = { ...user, password: newPassword, mustChangePassword: false };
    const success = await dataService.saveUser(updatedUser);
    if (success) {
      setUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const resetPassword = async (userId: string) => {
    if (!user || user.role !== 'admin') return;

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, password: targetUser.username, mustChangePassword: true };
    const success = await dataService.saveUser(updatedUser);
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  };

  const logout = () => {
    setUser(null);
  };

  // ADAPTACIÓN PARA FIREBASE (NoSQL): Actualizamos el ciclo entero
  const updateItem = async (weekId: string, itemId: string, field: keyof Item, value: any) => {
    if (!user || !countCycle) return;

    const updatedWeeks = countCycle.weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          status: WeekStatus.EnProgreso,
          lastModifiedBy: user.fullName,
          lastModifiedDate: new Date().toISOString(),
          items: w.items.map(i => {
            if (i.id === itemId) {
              const updated = { ...i, [field]: value };
              if (field === 'quantity') {
                updated.countedDate = value !== null && value !== '' ? new Date().toISOString().split('T')[0] : null;
                updated.countedBy = user.fullName;
              }
              return updated;
            }
            return i;
          })
        };
      }
      return w;
    });

    const updatedCycle = { ...countCycle, weeks: updatedWeeks };

   // En Firebase simplemente guardamos el documento completo del ciclo
    const success = await dataService.saveCountCycle(updatedCycle);
    if (success) {
      setCountCycle(updatedCycle);
    }
  };

  const finalizeWeek = async (weekId: string, observation?: string) => {
    if (!user || !countCycle) return;

    const updatedWeeks = countCycle.weeks.map((w, index) => {
      if (w.id === weekId) {
        return {
          ...w,
          status: WeekStatus.Finalizado,
          finalizationObservation: observation,
          finalizedBy: user.fullName,
          finalizationDate: new Date().toISOString(),
          lastModifiedBy: user.fullName,
          lastModifiedDate: new Date().toISOString()
        };
      }
      const prevWeek = countCycle.weeks[index - 1];
      if (prevWeek && prevWeek.id === weekId && w.status === WeekStatus.Bloqueado) {
        return { ...w, status: WeekStatus.Pendiente };
      }
      return w;
    });

    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    
    const allFinalized = updatedWeeks.every(w => w.status === WeekStatus.Finalizado);
    if (allFinalized) {
      await dataService.archiveCountCycle(countCycle.id);
      setCountCycle(null);
      setHistoricalCounts(prev => [updatedCycle, ...prev]);
    } else {
      await dataService.saveCountCycle(updatedCycle);
      setCountCycle(updatedCycle);
    }
  };

  const createNewCount = async (name: string, startDate: string, endDate: string, newWeeks: WeekData[]) => {
    if (countCycle) {
      await dataService.archiveCountCycle(countCycle.id);
    }

    const newCycle: CountCycle = {
      id: `C-${Date.now()}`,
      name,
      startDate,
      endDate,
      creationDate: new Date().toISOString(),
      weeks: newWeeks,
    };

    const success = await dataService.saveCountCycle(newCycle);
    if (success) {
      setCountCycle(newCycle);
      await refreshData();
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'status'>) => {
    if (!user) return false;

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      password: userData.username,
      status: 'active',
      mustChangePassword: true,
    };

    const success = await dataService.saveUser(newUser);
    if (success) {
      setUsers(prev => [...prev, newUser]);
      return true;
    }
    return false;
  };

  const updateSettings = async (newSettings: Partial<SettingsData>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await settingsService.updateAllSettings(updatedSettings);
  };

  const updateUser = async (userId: string, updatedUser: Partial<User>) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const fullUpdatedUser = { ...targetUser, ...updatedUser };
    const success = await dataService.saveUser(fullUpdatedUser);
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? fullUpdatedUser : u));
    }
  };

  const updateWeekItems = async (weekId: string, newItems: Item[]) => {
    if (!user || !countCycle) return;

    const updatedWeeks = countCycle.weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          items: newItems,
          lastModifiedBy: user.fullName,
          lastModifiedDate: new Date().toISOString(),
          status: WeekStatus.EnProgreso,
        };
      }
      return w;
    });

    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    const success = await dataService.saveCountCycle(updatedCycle);
    if (success) {
      setCountCycle(updatedCycle);
    }
  };

 const updateWeekComment = async (weekId: string, comment: string) => {
    if (!user || !countCycle) return;
    const updatedWeeks = countCycle.weeks.map(w => 
      w.id === weekId ? { ...w, adminComment: comment } : w
    );
    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    const success = await dataService.saveCountCycle(updatedCycle);
    if (success) setCountCycle(updatedCycle);
  };

  const deleteCurrentCount = async (cycleId?: string) => {
    if (!user || user.role !== 'admin') return;

    if (cycleId) {
      await dataService.archiveCountCycle(cycleId);
      await refreshData();
    } else if (countCycle) {
      await dataService.archiveCountCycle(countCycle.id);
      setCountCycle(null);
      await refreshData();
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') return;

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const newStatus: 'active' | 'inactive' = targetUser.status === 'active' ? 'inactive' : 'active';
    const updatedUser = { ...targetUser, status: newStatus };
    
    const success = await dataService.saveUser(updatedUser);
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    }
  };

  const updateMasterStock = async (data: Record<string, MasterStockItem>) => {
    const now = new Date().toISOString();
    const success = await dataService.saveMasterStock(data, now);
    if (success) {
      setMasterStock(data);
      setMasterStockDate(now);
    }
  };

  return (
    <AppContext.Provider value={{ 
        user, 
        users,
        weeksData: countCycle?.weeks ||[], 
        historicalCounts,
        login, 
        logout, 
        changePassword,
        resetPassword,
        settings,
        updateSettings,
        saveProgress: () => {}, 
        finalizeWeek, 
        createNewCount,
        updateItem,
        addUser,
        updateUser,
        deleteUser,
        updateWeekItems,
        updateWeekComment,
        deleteCurrentCount,
        refreshData,
        resetApplicationData,
        countCycle,
        masterStock,
        updateMasterStock
    }}>
      {!isLoading ? children : (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-corporate-blue mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Cargando datos del sistema...</p>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};