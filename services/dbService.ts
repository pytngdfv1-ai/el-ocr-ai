import { Document } from '../types';

const DB_NAME = 'DocumentOCRDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Si la DB ya está inicializada, no hagas nada.
    if (db) {
        return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error al abrir IndexedDB:', request.error);
      reject(new Error('No se pudo abrir la base de datos.'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const addDocument = (doc: Document): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("La base de datos no está inicializada.");
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(doc);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
        console.error('Error al añadir documento:', transaction.error);
        reject(transaction.error);
    }
  });
};

export const getAllDocuments = (): Promise<Document[]> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("La base de datos no está inicializada.");
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Ordenar por fecha de creación (inferida desde el ID `doc-timestamp`) de más nuevo a más viejo
            const sortedDocs = request.result.sort((a, b) => {
                const idA = parseInt(a.id.replace('doc-', ''), 10);
                const idB = parseInt(b.id.replace('doc-', ''), 10);
                return idB - idA;
            });
            resolve(sortedDocs);
        };
        request.onerror = () => {
            console.error('Error al obtener todos los documentos:', request.error);
            reject(request.error);
        }
    });
};

export const updateDocument = (doc: Document): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("La base de datos no está inicializada.");
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(doc);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error al actualizar documento:', transaction.error);
            reject(transaction.error);
        }
    });
};

export const deleteDocument = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("La base de datos no está inicializada.");
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error al eliminar documento:', transaction.error);
            reject(transaction.error);
        }
    });
};
