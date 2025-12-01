import React from 'react';
import { Document } from '../types';
import { CalendarIcon, UserIcon, TrashIcon, RecipientIcon } from './Icons';

interface DocumentRowProps {
  document: Document;
  onSelect: () => void;
  onDelete: () => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ document, onSelect, onDelete }) => {
  const { nombreArchivo, imagenUrl, metadata } = document;
  const { remitente, destinatario, fecha, tipoDocumento } = metadata;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      onClick={onSelect} 
      className="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow transition-shadow duration-200 hover:shadow-md dark:hover:shadow-indigo-500/10 cursor-pointer"
    >
      <img className="h-12 w-12 flex-shrink-0 rounded-md object-cover bg-slate-100 dark:bg-slate-700" src={imagenUrl} alt={`Vista previa de ${nombreArchivo}`} />
      
      <div className="ml-4 flex-grow grid grid-cols-1 md:grid-cols-3 gap-x-4 items-center">
        <div className="truncate">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{nombreArchivo}</p>
          <span className="inline-flex items-center rounded-md bg-cyan-50 dark:bg-cyan-900/50 px-2 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 ring-1 ring-inset ring-cyan-700/10 dark:ring-cyan-400/20">
            {tipoDocumento}
          </span>
        </div>
        
        <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400 space-y-1">
           <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                <span className="truncate" title={remitente}>{remitente}</span>
            </div>
             <div className="flex items-center space-x-2">
                <RecipientIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                <span className="truncate" title={destinatario}>{destinatario}</span>
            </div>
        </div>
        
        {fecha && (
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
              <time dateTime={fecha}>{fecha}</time>
          </div>
        )}
      </div>

      <div className="ml-4 flex items-center space-x-3">
        <button
          onClick={onSelect}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
        >
          Ver
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
          aria-label={`Eliminar ${nombreArchivo}`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DocumentRow;