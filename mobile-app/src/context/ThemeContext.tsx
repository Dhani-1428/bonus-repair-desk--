import React, { createContext, useContext, ReactNode } from 'react';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const darkTheme: Theme = {
  colors: {
    primary: '#e78a53', // Orange primary color
    secondary: '#4a90e2', // Blue secondary
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#8e8e93',
    border: '#2a2a2a',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ff9500',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={darkTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
