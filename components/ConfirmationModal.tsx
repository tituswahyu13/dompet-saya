"use client"
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isDark, 
  confirmText = "Hapus", 
  cancelText = "Batal",
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 ${
        isDark 
          ? 'bg-slate-900/90 border-white/5 shadow-black/50 text-white' 
          : 'bg-white/90 border-slate-200 shadow-slate-200/50 text-slate-900'
      } backdrop-blur-xl`}>
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            type === 'danger' 
              ? 'bg-red-500/10 text-red-500' 
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {type === 'danger' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
            <p className="text-sm font-medium opacity-60 leading-relaxed max-w-[280px] mx-auto">
              {message}
            </p>
          </div>

          <div className="flex w-full gap-3 pt-2">
            <button
              onClick={onCancel}
              className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              } active:scale-95`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                type === 'danger'
                  ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                  : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
