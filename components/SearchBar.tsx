import React from 'react';
import { SearchIcon, TagIcon, GridViewIcon, ListViewIcon } from './Icons';
import { ViewMode } from '../App';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, tags, selectedTag, setSelectedTag, viewMode, setViewMode }) => {
  return (
    <div className="space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder='Búsqueda: "frase", *, -palabra, "p1 p2~5"'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-0 bg-white dark:bg-slate-800 py-2.5 pl-10 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative flex-grow">
           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <TagIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="block w-full appearance-none rounded-md border-0 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-8 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
          >
            <option value="">Todas las etiquetas</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-1 rounded-md bg-slate-200 dark:bg-slate-700 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            aria-label="Vista de cuadrícula"
          >
            <GridViewIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            aria-label="Vista de lista"
          >
            <ListViewIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;