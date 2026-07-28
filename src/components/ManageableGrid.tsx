import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManageableGridProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconColorClass?: string;
  iconBgClass?: string;
  canManage: boolean;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const ManageableGrid: React.FC<ManageableGridProps> = ({
  title,
  description,
  icon: Icon,
  iconColorClass = 'text-sky-400',
  iconBgClass = 'bg-sky-500/10',
  canManage,
  onAdd,
  addLabel = 'Add New',
  children,
  rightContent
}) => {
  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-3 rounded-xl ${iconBgClass} ${iconColorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
            {description && (
              <p className="text-slate-400 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {rightContent}
          {canManage && onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-900/50"
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

interface ManageableCardOverlayProps {
  canManage: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const ManageableCardOverlay: React.FC<ManageableCardOverlayProps> = ({
  canManage,
  onEdit,
  onDelete
}) => {
  if (!canManage) return null;

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(e);
          }}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-sky-600 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg border border-slate-700/50"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(e);
          }}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg border border-slate-700/50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 mx-auto">
          <Trash2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white text-center mb-2">{title}</h2>
        <p className="text-slate-400 text-center mb-8">{description}</p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors flex justify-center items-center gap-2"
          >
            {isDeleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
