import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-500"></div>
      <p className="mt-4 text-lg font-semibold text-indigo-700 dark:text-indigo-400">La IA está analizando tu documento...</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">Esto puede tardar unos segundos.</p>
    </div>
  );
};

export default Loader;