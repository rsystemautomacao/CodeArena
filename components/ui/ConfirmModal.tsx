'use client';

import { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: ConfirmModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'info':
        return <Info className="w-8 h-8 text-blue-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'success':
        return {
          confirm: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'info':
        return {
          confirm: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      default:
        return {
          confirm: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColors.cancel}`}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-md font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColors.confirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
