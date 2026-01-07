
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode, title: string, subtitle?: string }> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <header className="bg-stone-900 text-stone-100 p-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-stone-400 text-sm mt-1">{subtitle}</p>}
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 mt-4">
        {children}
      </main>
    </div>
  );
};
