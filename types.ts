export type Role = 'admin' | 'operario' | 'inspector';

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
  operatorObservation?: string;
  adminComment?: string;
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

export type RiskSeverity = 'Bajo' | 'Medio' | 'Alto';
export type RiskStatus = 'Abierto' | 'Resuelto';

export interface RiskPoint {
  id: string;
  description: string;
  location: string;
  severity: RiskSeverity;
  status: RiskStatus;
  dateReported: string;
}

export interface Tour {
  id: string;
  date: string;
  inspectorName: string;
  status: 'En Progreso' | 'Finalizado';
  riskPoints: RiskPoint[];
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

export interface MasterStockItem {
  id: string;
  description: string;
  location: string;
  type: string;
}

export interface AppContextType {
  user: User | null;
  weeksData: WeekData[];
  historicalCounts: CountCycle[];
  users: User[];
  settings: SettingsData;
  tours: Tour[];
  masterStock: Record<string, MasterStockItem>;
  masterStockDate: string | null; // NUEVO: Fecha de actualización
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
  deleteCurrentCount: (cycleId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  resetApplicationData: () => Promise<void>;
  countCycle: CountCycle | null;
  updateSettings: (newSettings: Partial<SettingsData>) => Promise<void>;
  createNewTour: () => Promise<void>;
  addRiskPoint: (tourId: string, point: Omit<RiskPoint, 'id' | 'dateReported' | 'status'>) => Promise<void>;
  finalizeTour: (tourId: string) => Promise<void>;
  updateMasterStock: (data: Record<string, MasterStockItem>) => Promise<void>;
}