import { NavLink, Outlet } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
export default function Layout() {
  const { theme, language, toggleTheme, toggleLanguage } = usePortal();
  const hi = language === 'hi';
  return <><div className="gov-strip"/><header className="site-header"><div className="brand"><span className="brand-mark">🌾</span><div><strong>GramaGlow</strong><small>{hi ? 'डिजिटल ग्राम पंचायत पोर्टल' : 'Digital Panchayat Portal'}</small></div></div><div className="tools"><button onClick={toggleLanguage}>{hi ? 'English' : 'हिन्दी'}</button><button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button></div><nav><NavLink to="/">{hi ? 'मुख्य पृष्ठ' : 'Home'}</NavLink><NavLink to="/notices">{hi ? 'सूचनाएँ' : 'Notices'}</NavLink><NavLink to="/schemes">{hi ? 'योजनाएँ' : 'Schemes'}</NavLink><NavLink to="/grievance">{hi ? 'शिकायत दर्ज करें' : 'File grievance'}</NavLink></nav></header><main className="container"><Outlet/></main><footer>🌱 {hi ? 'पारदर्शी शासन • सशक्त ग्राम' : 'Transparent governance • Empowered villages'}</footer></>;
}
