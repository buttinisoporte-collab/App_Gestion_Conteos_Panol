
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Role, WeekData, Item, WeekStatus, AppState, CountCycle, AuditLogEntry, SettingsData } from '../types';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../services/dataService';
import { settingsService } from '../services/settingsService';



import { AppContextType } from '../types';
import { getInitialData } from '../services/dataService';

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: SettingsData = {
  companyName: 'Gestión de Pañol',
  logoUrl: '',
  loginLogoUrl: '',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(() => loadDataFromLocalStorage());
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      const remoteSettings = await settingsService.getSettings();
      if (remoteSettings) {
        setSettings(remoteSettings);
      } else {
        // If no remote settings, try to migrate from local storage or use defaults
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
          // Sync to Supabase for the first time
          await settingsService.updateAllSettings(parsed);
        } else {
          await settingsService.updateAllSettings(defaultSettings);
        }
      }
    };
    fetchSettings();
  }, []);

  const refreshData = () => {
    setAppState(loadDataFromLocalStorage());
  };

  const resetApplicationData = () => {
    if (user?.username !== 'Admin') {
      alert('Acción no permitida.');
      return;
    }
    if (window.confirm('¿Está seguro? Esta acción borrará TODOS los datos y restaurará la aplicación a su estado inicial.')) {
      const initialData = getInitialData();
      saveDataToLocalStorage(initialData);
      setAppState(initialData);
      // Forzar un refresco de la página para asegurar que todo se reinicie
      window.location.reload();
    }
  };

  const login = (username: string, password?: string): boolean => {
    const foundUser = appState.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

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

  const changePassword = (newPassword: string) => {
    if (!user) return;

    setAppState(prevState => {
      const updatedUsers = prevState.users.map(u => {
        if (u.id === user.id) {
          const newEntry = {
            date: new Date().toISOString(),
            action: 'Cambio de Contraseña',
            performedBy: user.fullName, // Use fullName
            details: 'El usuario cambió su propia contraseña'
          };
          const updated = { ...u, password: newPassword, mustChangePassword: false, auditLog: [...(u.auditLog || []), newEntry] };
          setUser(updated);
          return updated;
        }
        return u;
      });
      const newState = { ...prevState, users: updatedUsers };
      saveDataToLocalStorage(newState);
      return newState;
    });
  };

  const resetPassword = (userId: string) => {
    if (!user || user.role !== 'admin') return;

    setAppState(prevState => {
      const updatedUsers = prevState.users.map(u => {
        if (u.id === userId) {
          const newEntry = {
            date: new Date().toISOString(),
            action: 'Reseteo de Contraseña',
            performedBy: user.fullName, // Use fullName
            details: `Administrador reseteó la clave al valor inicial (${u.username})`
          };
          return { ...u, password: u.username, mustChangePassword: true, auditLog: [...(u.auditLog || []), newEntry] };
        }
        return u;
      });
      const newState = { ...prevState, users: updatedUsers };
      saveDataToLocalStorage(newState);
      return newState;
    });
  };

  const logout = () => {
    setUser(null);
  };
  
  const updateCurrentCountWeeks = (newWeeks: WeekData[]) => {
    setAppState(prevState => {
      if (!prevState.currentCount) return prevState;
      const newState = {
        ...prevState,
        currentCount: {
          ...prevState.currentCount,
          weeks: newWeeks,
        },
      };
      saveDataToLocalStorage(newState);
      return newState;
    });
  };

  const updateItem = (weekId: string, itemId: string, field: keyof Item, value: any) => {
    if (!user || !appState.currentCount) return;

    const newWeeks = appState.currentCount.weeks.map(w => {
        if (w.id === weekId) {
            const newItems = w.items.map(item => {
                if (item.id === itemId) {
                    const oldValue = item[field];
                    if (oldValue === value) return item;

                    const newLogEntry: AuditLogEntry = {
                        user: user.fullName, // Use fullName
                        date: new Date().toISOString(),
                        field: field,
                        oldValue: oldValue,
                        newValue: value
                    };

                    const updatedItem = { 
                        ...item, 
                        [field]: value,
                        auditLog: [...(item.auditLog || []), newLogEntry]
                    };

                    if (field === 'quantity') {
                        if (value !== null && value !== '') {
                            updatedItem.countedDate = new Date().toISOString().split('T')[0];
                        } else {
                            updatedItem.countedDate = null;
                        }
                    }
                    return updatedItem;
                }
                return item;
            });
            return { 
                ...w, 
                items: newItems,
                status: WeekStatus.EnProgreso,
                lastModifiedBy: user.fullName, // Use fullName
                lastModifiedDate: new Date().toISOString()
            };
        }
        return w;
    });

    updateCurrentCountWeeks(newWeeks);
  };


  const saveProgress = useCallback(() => {
    saveDataToLocalStorage(appState);
  }, [appState]);

  const finalizeWeek = (weekId: string, observation?: string) => {
    if (!user || !appState.currentCount) return;

    saveProgress();

    setAppState(prevState => {
        if (!prevState.currentCount) return prevState;

        let weekIndex = -1;
        const finalWeeks = prevState.currentCount.weeks.map((week, index) => {
            if (week.id === weekId) {
                weekIndex = index;
                return { 
                    ...week, 
                    status: WeekStatus.Finalizado,
                    finalizationObservation: observation,
                    finalizedBy: user.fullName,
                    finalizationDate: new Date().toISOString(),
                    lastModifiedBy: user.fullName, // Use fullName
                    lastModifiedDate: new Date().toISOString()
                };
            }
            return week;
        });

        if (weekIndex !== -1 && weekIndex + 1 < finalWeeks.length) {
            if(finalWeeks[weekIndex + 1].status === WeekStatus.Bloqueado) {
              finalWeeks[weekIndex + 1].status = WeekStatus.Pendiente;
            }
        }

        const allWeeksFinalized = finalWeeks.every(w => w.status === WeekStatus.Finalizado);

        if (allWeeksFinalized) {
            const newState = {
                ...prevState,
                currentCount: null,
                historicalCounts: [...prevState.historicalCounts, { ...prevState.currentCount, weeks: finalWeeks }],
            };
            saveDataToLocalStorage(newState);
            return newState;
        }
        
        const newState = {
            ...prevState,
            currentCount: {
                ...prevState.currentCount,
                weeks: finalWeeks,
            }
        };
        saveDataToLocalStorage(newState);
        return newState;
    });
  };
  
  const createNewCount = (name: string, startDate: string, endDate: string, newWeeks: WeekData[]) => {
    setAppState(prevState => {
      const newHistoricalCounts = [...prevState.historicalCounts];
      // Archive the current count if it exists and has been started
      if (prevState.currentCount && prevState.currentCount.weeks.some(w => w.status !== WeekStatus.Pendiente && w.status !== WeekStatus.Bloqueado)) {
        newHistoricalCounts.push(prevState.currentCount);
      }

      const newCountCycle: CountCycle = {
        id: `C-${Date.now()}`,
        name: name,
        startDate,
        endDate,
        creationDate: new Date().toISOString(),
        weeks: newWeeks,
      };

      const newState: AppState = {
        users: prevState.users,
        currentCount: newCountCycle,
        historicalCounts: newHistoricalCounts,
      };
      
      saveDataToLocalStorage(newState);
      return newState;
    });
  }

  const addUser = (userData: Omit<User, 'id' | 'status'>) => {
    if (!user) return false;

    const existingUser = appState.users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (existingUser) {
      alert('El nombre de usuario ya existe.');
      return false;
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      password: userData.username,
      status: 'active',
      mustChangePassword: true,
      auditLog: [{
        date: new Date().toISOString(),
        action: 'Creación de Usuario',
        performedBy: user.fullName, // Use fullName
        details: 'Usuario creado con contraseña inicial igual al username'
      }]
    };
    setAppState(prevState => {
        const newState = { ...prevState, users: [...prevState.users, newUser] };
        saveDataToLocalStorage(newState);
        return newState;
    });
    return true;
  };

  const updateSettings = async (newSettings: Partial<SettingsData>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    await settingsService.updateAllSettings(updatedSettings);
  };

  const updateUser = (userId: string, updatedUser: Partial<User>) => {
    setAppState(prevState => {
        const newUsers = prevState.users.map(u => u.id === userId ? { ...u, ...updatedUser } : u);
        const newState = { ...prevState, users: newUsers };
        saveDataToLocalStorage(newState);
        return newState;
    });
  };

  const updateWeekItems = (weekId: string, newItems: Item[]) => {
    if (!user || !appState.currentCount) return;

    const newWeeks = appState.currentCount.weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          items: newItems,
          lastModifiedBy: user.fullName,
          lastModifiedDate: new Date().toISOString(),
          status: WeekStatus.EnProgreso, // Mark as in progress again
        };
      }
      return w;
    });

    updateCurrentCountWeeks(newWeeks);
  };

  const deleteCurrentCount = (cycleId?: string) => {
    if (!user || user.role !== 'admin') {
      alert('Acción no permitida.');
      return;
    }

    if (cycleId) {
      // Delete a historical count
      if (user.username !== 'Admin') {
        alert('Solo el usuario \"Admin\" puede eliminar conteos del historial.');
        return;
      }
      setAppState(prevState => {
        const newHistoricalCounts = prevState.historicalCounts.filter(c => c.id !== cycleId);
        const newState = { ...prevState, historicalCounts: newHistoricalCounts };
        saveDataToLocalStorage(newState);
        return newState;
      });
    } else {
      // Delete the current count
      if (user.username !== 'Admin') {
        alert('Solo el usuario \"Admin\" puede eliminar el conteo actual.');
        return;
      }
      setAppState(prevState => {
        if (!prevState.currentCount) return prevState;
        const deletedCount = { 
          ...prevState.currentCount, 
          name: `${prevState.currentCount.name} (ELIMINADO)`
        };
        const newState = {
          ...prevState,
          currentCount: null,
          historicalCounts: [...prevState.historicalCounts, deletedCount],
        };
        saveDataToLocalStorage(newState);
        return newState;
      });
    }
  };

  const deleteUser = (userId: string) => {
    // This function is now used to toggle status
    if (!user || user.role !== 'admin') return;

    setAppState(prevState => {
      const updatedUsers = prevState.users.map(u => {
        if (u.id === userId) {
          const newStatus: 'active' | 'inactive' = u.status === 'active' ? 'inactive' : 'active';
          const newEntry = {
            date: new Date().toISOString(),
            action: `Cambio de Estado a ${newStatus.toUpperCase()}`,
            performedBy: user.fullName, // Use fullName
            details: `El estado del usuario fue cambiado por un administrador.`
          };
          return { ...u, status: newStatus, auditLog: [...(u.auditLog || []), newEntry] };
        }
        return u;
      });
      const newState = { ...prevState, users: updatedUsers };
      saveDataToLocalStorage(newState);
      return newState;
    });
  };

  return (
    <AppContext.Provider value={{ 
        user, 
        users: appState.users,
        weeksData: appState.currentCount?.weeks || [], 
        historicalCounts: appState.historicalCounts,
        login, 
        logout, 
        changePassword,
        resetPassword,
        settings,
        updateSettings,
        saveProgress, 
        finalizeWeek, 
        createNewCount,
        updateItem,
        addUser,
        updateUser,
        deleteUser,
        updateWeekItems,
        deleteCurrentCount,
        refreshData,
        resetApplicationData,
        countCycle: appState.currentCount
    }}>


      {children}
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
