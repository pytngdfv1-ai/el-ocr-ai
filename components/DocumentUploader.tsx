import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onFileUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    if (!isLoading) setIsDragging(true);
  }, [handleDragEvents, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  }, [handleDragEvents]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleDragEvents, isLoading, onFileUpload]);
  
  const baseClasses = "relative block w-full rounded-lg border-2 border-dashed p-12 text-center focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 transition-colors duration-200";
  const idleClasses = "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600";
  const draggingClasses = "border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20";
  const loadingClasses = "border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 cursor-not-allowed";

  const getDynamicClasses = () => {
    if (isLoading) return loadingClasses;
    if (isDragging) return draggingClasses;
    return idleClasses;
  };
  
  return (
    <div className="mt-2">
      <label
        htmlFor="file-upload"
        className={`${baseClasses} ${getDynamicClasses()}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
        <span className="mt-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          {isLoading ? 'Analizando documento...' : 'Sube un documento'}
        </span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
          {isDragging ? '¡Suelta el archivo aquí!' : 'o arrastra y suelta'}
        </span>
        <input 
          id="file-upload" 
          name="file-upload" 
          type="file" 
          className="sr-only" 
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          disabled={isLoading}
        />
      </label>
    </div>
  );
};

export default DocumentUploader;