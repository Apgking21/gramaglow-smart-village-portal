import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PortalProvider } from './context/PortalContext';
import Layout from './components/Layout';
import Home from './pages/Home'; import Notices from './pages/Notices'; import Schemes from './pages/Schemes'; import Grievance from './pages/Grievance';
import './styles.css';
export default function App(){return <PortalProvider><BrowserRouter><Routes><Route element={<Layout/>}><Route index element={<Home/>}/><Route path="notices" element={<Notices/>}/><Route path="schemes" element={<Schemes/>}/><Route path="grievance" element={<Grievance/>}/><Route path="*" element={<Home/>}/></Route></Routes></BrowserRouter></PortalProvider>;}
