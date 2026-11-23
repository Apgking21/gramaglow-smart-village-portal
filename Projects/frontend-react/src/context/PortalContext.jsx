import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const PortalContext = createContext(null);
export function PortalProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('gg-theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('gg-language') || 'en');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('gg-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = language; localStorage.setItem('gg-language', language); }, [language]);
  const value = useMemo(() => ({ theme, language, toggleTheme: () => setTheme(v => v === 'light' ? 'dark' : 'light'), toggleLanguage: () => setLanguage(v => v === 'en' ? 'hi' : 'en') }), [theme, language]);
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
export const usePortal = () => { const value = useContext(PortalContext); if (!value) throw new Error('usePortal must be used inside PortalProvider'); return value; };
