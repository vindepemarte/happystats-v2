// Layout for chart pages

import React from 'react';

interface ChartsLayoutProps {
  children: React.ReactNode;
}

const ChartsLayout: React.FC<ChartsLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};

export default ChartsLayout;