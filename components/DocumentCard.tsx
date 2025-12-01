import React from 'react';
import { Document } from '../types';
import { CalendarIcon, UserIcon, TrashIcon } from './Icons';

interface DocumentCardProps {
  document: Document;
  onSelect: () => void;
  onDelete: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onSelect, onDelete }) => {
  const { nombreArchivo, imagenUrl, metadata } = document;
  const { remitente, fecha, etiquetas, tipoDocumento } = metadata;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div 
      onClick={onSelect} 
      className="relative col-span-1 flex flex-col divide-y divide-gray-200 dark:divide-slate-700 rounded-lg bg-white dark:bg-slate-800 text-center shadow transition-transform duration-200 hover:scale-105 hover:shadow-lg dark:hover:shadow-indigo-500/10 cursor-pointer"
    >
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-red-500"
        aria-label={`Eliminar ${nombreArchivo}`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>

      <div className="flex flex-1 flex-col p-6">
        <div className="text-left -mt-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-cyan-50 dark:bg-cyan-900/50 px-2 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 ring-1 ring-inset ring-cyan-700/10 dark:ring-cyan-400/20">
                {tipoDocumento}
            </span>
        </div>
        <img className="mx-auto h-32 w-32 flex-shrink-0 rounded-md object-cover bg-slate-100 dark:bg-slate-700" src={imagenUrl} alt={`Vista previa de ${nombreArchivo}`} />
        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{nombreArchivo}</h3>
        <dl className="mt-1 flex flex-grow flex-col justify-between">
          <dt className="sr-only">Metadata</dt>
          <dd className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-2">
            <div className="flex items-center justify-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                <span>{remitente}</span>
            </div>
            {fecha && (
              <div className="flex items-center justify-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                  <time dateTime={fecha}>{fecha}</time>
              </div>
            )}
          </dd>
        </dl>
      </div>
      <div>
        <div className="-mt-px flex divide-x divide-gray-200 dark:divide-slate-700 p-2">
          <div className="flex w-0 flex-1 flex-wrap items-center justify-center py-2 gap-2">
            {etiquetas.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;