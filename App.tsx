import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Document } from './types';
import { extractInfoFromDocument } from './services/geminiService';
import { initDB, getAllDocuments, addDocument, updateDocument, deleteDocument } from './services/dbService';
import Header from './components/Header';
import DocumentUploader from './components/DocumentUploader';
import SearchBar from './components/SearchBar';
import DocumentList from './components/DocumentList';
import DocumentDetailModal from './components/DocumentDetailModal';
import ConfirmationModal from './components/ConfirmationModal';
import Loader from './components/Loader';
import { ErrorIcon } from './components/Icons';

export type ViewMode = 'grid' | 'list';
export type Theme = 'light' | 'dark' | 'system';

const matchesAdvancedSearch = (ocrText: string, term: string): boolean => {
    const lowercasedOcr = ocrText.toLowerCase();
    const lowercasedTerm = term.toLowerCase();

    // Búsqueda por proximidad: "palabra1 palabra2~5"
    const proximityMatch = lowercasedTerm.match(/^"(.+?)\s(.+?)~(\d+)"$/);
    if (proximityMatch) {
        const [, word1, word2, distanceStr] = proximityMatch;
        const distance = parseInt(distanceStr, 10);
        if (word1 && word2 && !isNaN(distance)) {
            const escapedWord1 = word1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedWord2 = word2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            try {
                const regex = new RegExp(
                    `\\b${escapedWord1}\\b(?:\\s+\\S+){0,${distance}}\\s+\\b${escapedWord2}\\b|\\b${escapedWord2}\\b(?:\\s+\\S+){0,${distance}}\\s+\\b${escapedWord1}\\b`,
                    'i'
                );
                return regex.test(ocrText);
            } catch (e) {
                console.error("Expresión regular de proximidad inválida:", e);
                return false;
            }
        }
    }

    // Búsqueda de frase exacta: "una frase"
    if (lowercasedTerm.startsWith('"') && lowercasedTerm.endsWith('"')) {
        const phrase = lowercasedTerm.substring(1, lowercasedTerm.length - 1);
        return phrase ? lowercasedOcr.includes(phrase) : false;
    }

    // Búsqueda con comodín: palab*
    if (lowercasedTerm.includes('*')) {
        const regexTerm = lowercasedTerm
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*');
        try {
            const regex = new RegExp(regexTerm, 'i');
            return regex.test(ocrText);
        } catch (e) {
            console.error("Expresión regular de búsqueda inválida:", e);
            return false;
        }
    }

    return false; // No se encontró sintaxis avanzada
};


const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme as Theme;
      }
    } catch (error) {
      console.error('No se pudo leer el tema de localStorage', error);
    }
    return 'system';
  });

  // Efecto para aplicar el tema
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('No se pudo guardar el tema en localStorage', error);
    }
  }, [theme]);

  // Listener para cambios en el tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Cargar documentos desde IndexedDB al iniciar
  useEffect(() => {
    const loadData = async () => {
        try {
            await initDB();
            const storedDocs = await getAllDocuments();
            setDocuments(storedDocs);
        } catch (error) {
            console.error("Error al cargar documentos desde IndexedDB:", error);
            setError("No se pudieron cargar los documentos guardados. Es posible que tu navegador no sea compatible o esté en modo privado.");
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const base64String = dataUrl.split(',')[1];
        const { textoOCR, metadata } = await extractInfoFromDocument(base64String, file.type);
        
        const newDocument: Document = {
          id: `doc-${Date.now()}`,
          nombreArchivo: file.name,
          imagenUrl: dataUrl,
          textoOCR,
          metadata,
          qnaHistory: [],
        };
        
        await addDocument(newDocument);
        setDocuments(prevDocs => [newDocument, ...prevDocs]);
        setIsLoading(false);
      };
      reader.onerror = () => {
        throw new Error('Error al leer el archivo.');
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);
  
  const handleUpdateDocument = async (updatedDocument: Document) => {
    try {
        await updateDocument(updatedDocument);
        setDocuments(prevDocs =>
          prevDocs.map(doc => (doc.id === updatedDocument.id ? updatedDocument : doc))
        );
    } catch (error) {
        console.error("Error al actualizar el documento:", error);
        setError("No se pudo guardar la actualización del documento.");
    }
  };

  useEffect(() => {
    let currentFiltered = [...documents];

    if (searchTerm) {
        // Divide el término de búsqueda respetando las frases entre comillas
        const terms: string[] = searchTerm.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

        const positiveTerms: string[] = [];
        const negativeTerms: string[] = [];

        terms.forEach(term => {
            if (term.startsWith('-') && term.length > 1) {
                negativeTerms.push(term.substring(1));
            } else {
                positiveTerms.push(term);
            }
        });

        currentFiltered = currentFiltered.filter(doc => {
            const combinedText = [
                doc.nombreArchivo,
                doc.metadata.remitente,
                doc.metadata.destinatario,
                doc.metadata.tipoDocumento,
                doc.metadata.resumen,
                doc.textoOCR,
            ].join(' ').toLowerCase();

            // 1. Comprobar exclusiones (cualquier término negativo que coincida -> excluir)
            const isExcluded = negativeTerms.some(term => {
                const lowercasedTerm = term.toLowerCase();
                if (lowercasedTerm.startsWith('"') && lowercasedTerm.endsWith('"')) {
                    const phrase = lowercasedTerm.substring(1, lowercasedTerm.length - 1);
                    return combinedText.includes(phrase);
                }
                return combinedText.includes(lowercasedTerm);
            });

            if (isExcluded) {
                return false;
            }

            // 2. Comprobar inclusiones (todos los términos positivos deben coincidir)
            if (positiveTerms.length === 0) {
                return true; // No hay términos positivos para buscar, pero no fue excluido
            }

            return positiveTerms.every(term => {
                const isAdvanced = (term.startsWith('"') && term.endsWith('"')) || term.includes('*') || term.match(/^"(.+?)\s(.+?)~(\d+)"$/);
                
                if (isAdvanced) {
                    // Las búsquedas avanzadas solo se aplican al texto OCR
                    return matchesAdvancedSearch(doc.textoOCR, term);
                } else {
                    // El término estándar busca en todas partes
                    return combinedText.toLowerCase().includes(term.toLowerCase());
                }
            });
        });
    }

    if (selectedTag) {
      currentFiltered = currentFiltered.filter(doc => doc.metadata.etiquetas.includes(selectedTag));
    }

    setFilteredDocuments(currentFiltered);
}, [documents, searchTerm, selectedTag]);


  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    documents.forEach(doc => {
      doc.metadata.etiquetas.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [documents]);

  const handleDeleteRequest = (documentId: string) => {
    const docToDelete = documents.find(doc => doc.id === documentId);
    if (docToDelete) {
      setDocumentToDelete(docToDelete);
    }
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    try {
        await deleteDocument(documentToDelete.id);
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentToDelete.id));
        setDocumentToDelete(null);
    } catch(error) {
        console.error("Error al eliminar el documento:", error);
        setError("No se pudo eliminar el documento.");
    }
  };

  const handleCancelDelete = () => {
    setDocumentToDelete(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {isLoading && <Loader />}
      <Header theme={theme} setTheme={setTheme} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <DocumentUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

          {error && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative flex items-center" role="alert">
                <ErrorIcon className="w-5 h-5 mr-2"/>
                <span className="block sm:inline">{error}</span>
            </div>
          )}

          {documents.length > 0 && (
            <div className="mt-8">
              <SearchBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                tags={allTags}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
              <DocumentList 
                documents={filteredDocuments} 
                onDocumentSelect={setSelectedDocument}
                onDocumentDelete={handleDeleteRequest}
                viewMode={viewMode}
              />
            </div>
          )}
        </div>
      </main>

      {selectedDocument && (
        <DocumentDetailModal 
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdateDocument={handleUpdateDocument}
        />
      )}

      {documentToDelete && (
        <ConfirmationModal
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Eliminar Documento"
          message={`¿Estás seguro de que quieres eliminar "${documentToDelete.nombreArchivo}"? Esta acción no se puede deshacer.`}
        />
      )}
    </div>
  );
};

export default App;