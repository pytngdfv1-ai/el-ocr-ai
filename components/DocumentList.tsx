import React from 'react';
import { Document } from '../types';
import DocumentCard from './DocumentCard';
import DocumentRow from './DocumentRow';
import { DocumentIcon } from './Icons';
import { ViewMode } from '../App';

interface DocumentListProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  onDocumentDelete: (documentId: string) => void;
  viewMode: ViewMode;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDocumentSelect, onDocumentDelete, viewMode }) => {
  if (documents.length === 0) {
    return (
      <div className="mt-16 text-center">
        <DocumentIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No se encontraron documentos</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Prueba a cambiar tu búsqueda o a subir un nuevo documento.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => (
            <DocumentCard 
              key={doc.id} 
              document={doc} 
              onSelect={() => onDocumentSelect(doc)}
              onDelete={() => onDocumentDelete(doc.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onSelect={() => onDocumentSelect(doc)}
              onDelete={() => onDocumentDelete(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;