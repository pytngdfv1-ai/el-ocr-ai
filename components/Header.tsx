import React from 'react';
import { LogoIcon, SunIcon, MoonIcon, SystemIcon } from './Icons';
import { Theme } from '../App';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeInfo = () => {
    switch (theme) {
      case 'light':
        return { Icon: SunIcon, label: 'Tema Claro' };
      case 'dark':
        return { Icon: MoonIcon, label: 'Tema Oscuro' };
      case 'system':
        return { Icon: SystemIcon, label: 'Tema del Sistema' };
    }
  };

  const { Icon, label } = getThemeInfo();

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
      aria-label={`Cambiar tema: ${label}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
};


const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  return (
    <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-3 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
            <LogoIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-500" />
            <div className="ml-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">EL OCR</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tu biblioteca de documentos inteligente</p>
            </div>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
};

export default Header;