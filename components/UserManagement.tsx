import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Role } from '../types';
import { Button } from './ui/Button';
import AlertDialog from './ui/AlertDialog';
import { Input } from './ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Modal from './ui/Modal';

const UserManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { users, addUser, updateUser, deleteUser, resetPassword } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void; confirmText?: string; } | null>(null);

  const handleOpenModal = (user: User | null = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (user: User) => {
    if (currentUser) {
      updateUser(user.id, user);
    } else {
      addUser(user);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">
        &larr; Volver al Dashboard
      </Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Añadir, editar o eliminar usuarios del sistema.</CardDescription>
            </div>
            <Button onClick={() => handleOpenModal()}>Añadir Usuario</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">Rol</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Estado Clave</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <React.Fragment key={user.id}>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="font-bold">{user.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono sm:hidden">
                        {user.role} - {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono hidden sm:block">{user.username} | DNI: {user.dni} | Legajo: {user.employeeId}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.role}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.mustChangePassword ? (
                        <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded">Pendiente Cambio</span>
                      ) : (
                        <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded">Actualizada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}>
                        {expandedUserId === user.id ? 'Cerrar Log' : 'Ver Log'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setDialog({
                          isOpen: true,
                          title: '¿Resetear Contraseña?',
                          description: `La contraseña para ${user.fullName} se reseteará a "${user.username}". El usuario deberá cambiarla en su próximo inicio de sesión.`,
                          confirmText: 'Sí, Resetear',
                          onConfirm: () => {
                            resetPassword(user.id);
                            setDialog(null);
                            alert(`Contraseña reseteada a: ${user.username}`);
                          }
                        });
                      }}>Reset Clave</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}>Editar</Button>
                      <Button variant="ghost" size="sm" className={user.status === 'active' ? 'text-red-600' : 'text-green-600'} onClick={() => {
                        setDialog({
                          isOpen: true,
                          title: `¿${user.status === 'active' ? 'Desactivar' : 'Activar'} Usuario?`,
                          description: `¿Está seguro de que desea ${user.status === 'active' ? 'desactivar' : 'activar'} al usuario ${user.fullName}?`,
                          confirmText: user.status === 'active' ? 'Sí, Desactivar' : 'Sí, Activar',
                          onConfirm: () => {
                            deleteUser(user.id);
                            setDialog(null);
                          }
                        });
                      }}>
                        {user.status === 'active' ? 'Inactivar' : 'Activar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedUserId === user.id && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-slate-50 p-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-slate-700">Historial de Auditoría de Usuario</h4>
                          {user.auditLog && user.auditLog.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto border rounded bg-white">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Fecha</TableHead>
                                    <TableHead className="text-xs">Acción</TableHead>
                                    <TableHead className="text-xs">Por</TableHead>
                                    <TableHead className="text-xs">Detalles</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.auditLog.map((log, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="text-xs">{new Date(log.date).toLocaleString('es-AR')}</TableCell>
                                      <TableCell className="text-xs font-medium">{log.action}</TableCell>
                                      <TableCell className="text-xs">{log.performedBy}</TableCell>
                                      <TableCell className="text-xs text-slate-500">{log.details}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No hay registros de auditoría.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialog && (
        <AlertDialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          description={dialog.description}
          confirmText={dialog.confirmText}
        />
      )}
      {isModalOpen && (
        <UserModal 
          user={currentUser} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
};

const UserModal: React.FC<{ user: User | null; onClose: () => void; onSave: (user: Omit<User, 'id' | 'status' | 'auditLog' | 'mustChangePassword' | 'password'>) => void; }> = ({ user, onClose, onSave }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [dni, setDni] = useState(user?.dni || '');
  const [employeeId, setEmployeeId] = useState(user?.employeeId || '');
  const [role, setRole] = useState<Role>(user?.role || 'operario');

  const handleSubmit = () => {
    if (!username || !fullName || !dni || !employeeId) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    onSave({ username, fullName, dni, employeeId, role });
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      onConfirm={handleSubmit} 
      title={user ? 'Editar Usuario' : 'Añadir Usuario'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre de Usuario</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: jsmith" disabled={!!user} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Apellido y Nombre</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">DNI</label>
          <Input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej: 12345678" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Legajo</label>
          <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Ej: 9876" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full p-2 border rounded-md">
            <option value="operario">Operario</option>
            <option value="encargado">Encargado</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default UserManagement;
