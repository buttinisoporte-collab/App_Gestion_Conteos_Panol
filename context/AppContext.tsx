import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, WeekData, Item, WeekStatus, CountCycle, SettingsData, MasterStockItem } from '../types';
import { dataService } from '../services/dataService';
import { settingsService } from '../services/settingsService';
import { AppContextType } from '../types';
import { RefreshCw } from '../components/ui/Icons';

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: SettingsData = { companyName: 'Gestión de Pañol', logoUrl: '', loginLogoUrl: '',predefinedObservations: [] };

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const[countCycle, setCountCycle] = useState<CountCycle | null>(null);
  const [historicalCounts, setHistoricalCounts] = useState<CountCycle[]>([]);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [masterStock, setMasterStock] = useState<Record<string, MasterStockItem>>({});
  const[masterStockDate, setMasterStockDate] = useState<string | null>(null);updateMasterStock
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching data')), 15000));

    try {
      const fetchPromise = Promise.all([
        dataService.getUsers(),
        dataService.getCurrentCount(),
        dataService.getHistoricalCounts(),
        dataService.getMasterStock()
      ]);

      const [fetchedUsers, fetchedCurrentCount, fetchedHistorical, fetchedMasterStockObj] = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<any>);
      
      setUsers(fetchedUsers || []);
      setCountCycle(fetchedCurrentCount || null);
      setHistoricalCounts(fetchedHistorical ||[]);
      setMasterStock(fetchedMasterStockObj?.items || {});
      setMasterStockDate(fetchedMasterStockObj?.lastUpdated || null);
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
        if (remoteSettings) setSettings(remoteSettings);
        else await settingsService.updateAllSettings(defaultSettings);
      } catch (error) {
        console.warn('Ignorando error de settings para no trabar la app:', error);
      } finally {
        await refreshData();
      }
    };
    init();
  }, [refreshData]);

  const resetApplicationData = async () => {
    if (user?.username !== 'Admin') return alert('Acción no permitida.');
    if (window.confirm('¿Está seguro? Esta acción borrará TODOS los datos y restaurará la aplicación a su estado inicial.')) {
      alert('Para reiniciar los datos en Firebase, elimine las colecciones directamente desde la consola.');
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (foundUser && foundUser.status === 'inactive') { alert('Su usuario está inactivo.'); return false; }
    if (foundUser) { setUser(foundUser); return true; }
    return false;
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;
    const updatedUser = { ...user, password: newPassword, mustChangePassword: false };
    const success = await dataService.saveUser(updatedUser);
    if (success) { setUser(updatedUser); setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u)); }
  };

  const resetPassword = async (userId: string) => {
    if (!user || user.role !== 'admin') return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, password: targetUser.username, mustChangePassword: true };
    const success = await dataService.saveUser(updatedUser);
    if (success) setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
  };

  const logout = () => setUser(null);

  const updateItem = async (weekId: string, itemId: string, field: keyof Item, value: any) => {};

  const finalizeWeek = async (weekId: string, observation?: string) => {
    if (!user || !countCycle) return;
    const updatedWeeks = countCycle.weeks.map((w, index) => {
      if (w.id === weekId) return { ...w, status: WeekStatus.Finalizado, finalizationObservation: observation, finalizedBy: user.fullName, finalizationDate: new Date().toISOString(), lastModifiedBy: user.fullName, lastModifiedDate: new Date().toISOString() };
      const prevWeek = countCycle.weeks[index - 1];
      if (prevWeek && prevWeek.id === weekId && w.status === WeekStatus.Bloqueado) return { ...w, status: WeekStatus.Pendiente };
      return w;
    });

    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    const allFinalized = updatedWeeks.every(w => w.status === WeekStatus.Finalizado);
    
    if (allFinalized) { await dataService.archiveCountCycle(countCycle.id); setCountCycle(null); setHistoricalCounts(prev => [updatedCycle, ...prev]); } 
    else { await dataService.saveCountCycle(updatedCycle); setCountCycle(updatedCycle); }
  };

  const createNewCount = async (name: string, startDate: string, endDate: string, newWeeks: WeekData[]) => {
    if (countCycle) await dataService.archiveCountCycle(countCycle.id);
    const newCycle: CountCycle = { id: `C-${Date.now()}`, name, startDate, endDate, creationDate: new Date().toISOString(), weeks: newWeeks };
    const success = await dataService.saveCountCycle(newCycle);
    if (success) { setCountCycle(newCycle); await refreshData(); }
  };

  const addUser = async (userData: Omit<User, 'id' | 'status'>) => {
    if (!user) return false;
    const newUser: User = { ...userData, id: `user-${Date.now()}`, password: userData.username, status: 'active', mustChangePassword: true };
    const success = await dataService.saveUser(newUser);
    if (success) { setUsers(prev => [...prev, newUser]); return true; }
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
    if (success) setUsers(prev => prev.map(u => u.id === userId ? fullUpdatedUser : u));
  };

  const updateWeekItems = async (weekId: string, newItems: Item[]) => {
    if (!user || !countCycle) return;
    const updatedWeeks = countCycle.weeks.map(w => {
      if (w.id === weekId) return { ...w, items: newItems, lastModifiedBy: user.fullName, lastModifiedDate: new Date().toISOString(), status: WeekStatus.EnProgreso };
      return w;
    });
    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    const success = await dataService.saveCountCycle(updatedCycle);
    if (success) setCountCycle(updatedCycle);
  };

  const updateWeekComment = async (weekId: string, comment: string) => {
    if (!user || !countCycle) return;
    const updatedWeeks = countCycle.weeks.map(w => w.id === weekId ? { ...w, adminComment: comment } : w);
    const updatedCycle = { ...countCycle, weeks: updatedWeeks };
    const success = await dataService.saveCountCycle(updatedCycle);
    if (success) setCountCycle(updatedCycle);
  };

  const updateMasterStock = async (
    data: Record<string, MasterStockItem>, 
    updateLocations: boolean = false, 
    updateStock: boolean = false
  ) => {
    const now = new Date().toISOString();
    
    // 1. Guardar en base de datos de Stock Maestro
    const success = await dataService.saveMasterStock(data, now);
    
    if (success) {
      setMasterStock(data);
      setMasterStockDate(now);

      // 2. Si hay un conteo activo, propagar cambios
      if (countCycle) {
        const updatedWeeks = countCycle.weeks.map(week => {
          // Solo actualizamos ubicación y stock en semanas NO finalizadas si el usuario lo pidió
          const canUpdateDetails = (week.status === WeekStatus.EnProgreso || week.status === WeekStatus.Pendiente);
          
          const updatedItems = week.items.map(item => {
            // Obtener el ID real quitando el prefijo "S1-"
            const realId = item.id.includes('-') ? item.id.split('-')[1] : item.id;
            const newData = data[realId];

            if (newData) {
              return {
                ...item,
                // Descripción se actualiza SIEMPRE en todas las semanas del ciclo
                description: newData.description,
                // Ubicación y Stock solo si se confirmó y la semana está activa
                location: (updateLocations && canUpdateDetails) ? newData.location : item.location,
                systemStock: (updateStock && canUpdateDetails && newData.systemStock !== undefined) 
                  ? newData.systemStock 
                  : item.systemStock
              };
            }
            return item;
          });

          return { ...week, items: updatedItems };
        });

        const updatedCycle = { ...countCycle, weeks: updatedWeeks };
        await dataService.saveCountCycle(updatedCycle);
        setCountCycle(updatedCycle);
      }
    }
    return success;
  };

  const deleteCurrentCount = async (cycleId?: string) => {
    if (!user || user.role !== 'admin') return;
    if (cycleId) { await dataService.archiveCountCycle(cycleId); await refreshData(); } 
    else if (countCycle) { await dataService.archiveCountCycle(countCycle.id); setCountCycle(null); await refreshData(); }
  };

  const deleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    const updatedUser = { ...targetUser, status: newStatus };
    const success = await dataService.saveUser(updatedUser);
    if (success) setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
  };

  return (
    <AppContext.Provider value={{ user, users, weeksData: countCycle?.weeks ||[], historicalCounts, login, logout, changePassword, resetPassword, settings, updateSettings, saveProgress: () => {}, finalizeWeek, createNewCount, updateItem, addUser, updateUser, deleteUser, updateWeekItems, updateWeekComment, deleteCurrentCount, refreshData, resetApplicationData, countCycle, masterStock, masterStockDate, updateMasterStock }}>
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
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};