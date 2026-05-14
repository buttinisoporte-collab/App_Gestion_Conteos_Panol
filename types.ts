export type Role = 'admin' | 'operario';

export interface User {
  id: string;
  username: string;
  fullName: string;
  dni: string;
  employeeId: string;
  password?: string;
  role: Role;
  status: 'active' | 'inactive';
  mustChangePassword?: boolean;
}

export interface Item {
  id: string;
  description: string;
  manufacturerCode: string;
  category: string;
  location: string;
  systemStock: number;
  quantity: number | null;
  countedDate?: string | null;
  countedBy?: string | null;
  materialId?: string;
  operatorObservation?: string;
  adminComment?: string;
}

export enum WeekStatus {
  Bloqueado = 'Bloqueado',
  Pendiente = 'Pendiente',
  EnProgreso = 'En Progreso',
  Finalizado = 'Finalizado',
}

export interface WeekData {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: WeekStatus;
  items: Item[];
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  finalizedBy?: string;
  finalizationDate?: string;
  finalizationObservation?: string;
  adminComment?: string;
}

export interface CountCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  creationDate: string;
  weeks: WeekData[];
}

export interface MasterStockItem {
  id: string;
  description: string;
  location: string;
  type: string;
}

export interface SettingsData {
  companyName: string;
  logoUrl: string;
  loginLogoUrl: string;
  predefinedObservations?: string[]; // NUEVO: Lista de observaciones
}

export interface AppContextType {
  user: User | null;
  weeksData: WeekData[];
  historicalCounts: CountCycle[];
  users: User[];
  settings: SettingsData;
  masterStock: Record<string, MasterStockItem>;
  masterStockDate: string | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (userId: string) => Promise<void>;
  saveProgress: () => void;
  updateItem: (weekId: string, itemId: string, field: keyof Item, value: any) => Promise<void>;
  finalizeWeek: (weekId: string, observation?: string) => Promise<void>;
  createNewCount: (name: string, startDate: string, endDate: string, newWeeks: WeekData[]) => Promise<void>;
  addUser: (userData: Omit<User, "id" | "status">) => Promise<boolean>;
  updateUser: (userId: string, updatedUser: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateWeekItems: (weekId: string, newItems: Item[]) => Promise<void>;
  updateWeekComment: (weekId: string, comment: string) => Promise<void>;
  updateMasterStock: (data: Record<string, MasterStockItem>) => Promise<void>;
  deleteCurrentCount: (cycleId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  resetApplicationData: () => Promise<void>;
  countCycle: CountCycle | null;
  updateSettings: (newSettings: Partial<SettingsData>) => Promise<void>;
}