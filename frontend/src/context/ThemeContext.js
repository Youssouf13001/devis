import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Sombre',
    icon: '🌙',
    colors: {
      background: '#020617',
      backgroundSecondary: '#0f172a',
      foreground: '#f8fafc',
      card: 'rgba(15, 23, 42, 0.6)',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      primary: '#f59e0b',
      primaryGlow: 'rgba(245, 158, 11, 0.3)',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      muted: '#64748b',
      success: '#22c55e',
      danger: '#ef4444',
    }
  },
  light: {
    name: 'Clair',
    icon: '☀️',
    colors: {
      background: '#f8fafc',
      backgroundSecondary: '#e2e8f0',
      foreground: '#0f172a',
      card: 'rgba(255, 255, 255, 0.9)',
      cardBorder: 'rgba(0, 0, 0, 0.1)',
      primary: '#d97706',
      primaryGlow: 'rgba(217, 119, 6, 0.2)',
      secondary: '#7c3aed',
      accent: '#0891b2',
      muted: '#64748b',
      success: '#16a34a',
      danger: '#dc2626',
    }
  },
  orange: {
    name: 'Orange',
    icon: '🟠',
    colors: {
      background: '#1c1410',
      backgroundSecondary: '#2d1f17',
      foreground: '#fef3e2',
      card: 'rgba(45, 31, 23, 0.8)',
      cardBorder: 'rgba(251, 191, 36, 0.2)',
      primary: '#fb923c',
      primaryGlow: 'rgba(251, 146, 60, 0.4)',
      secondary: '#fbbf24',
      accent: '#f97316',
      muted: '#a8a29e',
      success: '#84cc16',
      danger: '#ef4444',
    }
  },
  violet: {
    name: 'Violet',
    icon: '💜',
    colors: {
      background: '#0f0a1a',
      backgroundSecondary: '#1a1025',
      foreground: '#f5f3ff',
      card: 'rgba(26, 16, 37, 0.8)',
      cardBorder: 'rgba(139, 92, 246, 0.2)',
      primary: '#a78bfa',
      primaryGlow: 'rgba(167, 139, 250, 0.4)',
      secondary: '#c084fc',
      accent: '#e879f9',
      muted: '#a1a1aa',
      success: '#4ade80',
      danger: '#f87171',
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && themes[saved] ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const colors = themes[theme].colors;
    
    // Apply CSS variables
    document.documentElement.style.setProperty('--theme-background', colors.background);
    document.documentElement.style.setProperty('--theme-background-secondary', colors.backgroundSecondary);
    document.documentElement.style.setProperty('--theme-foreground', colors.foreground);
    document.documentElement.style.setProperty('--theme-card', colors.card);
    document.documentElement.style.setProperty('--theme-card-border', colors.cardBorder);
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-glow', colors.primaryGlow);
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', colors.accent);
    document.documentElement.style.setProperty('--theme-muted', colors.muted);
    document.documentElement.style.setProperty('--theme-success', colors.success);
    document.documentElement.style.setProperty('--theme-danger', colors.danger);
    
    // Update body background
    document.body.style.background = colors.background;
    document.body.style.color = colors.foreground;
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themes, changeTheme, currentTheme: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
