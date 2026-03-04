
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
  auditLog?: UserAuditEntry[];
}

export interface UserAuditEntry {
  date: string;
  action: string;
  performedBy: string;
  details?: string;
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
  auditLog?: AuditLogEntry[];
}

export interface AuditLogEntry {
  user: string;
  date: string;
  field: keyof Item;
  oldValue: any;
  newValue: any;
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
}

export interface CountCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  creationDate: string;
  weeks: WeekData[];
}

export interface AppState {
  users: User[];
  currentCount: CountCycle | null;
  historicalCounts: CountCycle[];
}

export interface SettingsData {
  companyName: string;
  logoUrl: string;
  loginLogoUrl: string;
}

export interface AppContextType {
  user: User | null;
  weeksData: WeekData[];
  historicalCounts: CountCycle[];
  users: User[];
  settings: SettingsData;
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
  deleteCurrentCount: (cycleId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  resetApplicationData: () => Promise<void>;
  countCycle: CountCycle | null;
  updateSettings: (newSettings: Partial<SettingsData>) => Promise<void>;
}
