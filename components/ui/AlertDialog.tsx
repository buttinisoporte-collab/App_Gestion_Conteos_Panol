import React from 'react'; 

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-3 text-slate-800">{title}</h2>
        <p className="text-slate-600 mb-8">{description}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
