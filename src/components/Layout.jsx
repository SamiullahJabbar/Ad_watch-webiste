import React, { useState, useEffect } from 'react';
import { 
    FiMenu, FiLogOut, FiBell, FiX, FiHome, 
    FiSettings, FiLayers, FiShare2, FiStar, FiChevronDown 
} from 'react-icons/fi';
import { 
    FaWhatsapp, FaHome, FaGift, FaUsers, 
    FaHistory, FaRegGem 
} from 'react-icons/fa'; 
import { getUsernameFromToken, removeTokens } from '../api/baseURL'; 
import './Layout.css';

import { IoPeople } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { TbLogout2 } from "react-icons/tb";

// Currency Context ko import kiya
import { useCurrency } from './CurrencyContext';

// Navigation Items for Bottom Bar
const navItems = [
    { name: "Home", icon: FaHome, path: "/" },
    { name: "Plans", icon: FaGift, path: "/myplan" },
    { name: "Team", icon: FaUsers, path: "/Teams" }, 
];

// Expanded Sidebar Menu Items
const sidebarMenuItems = [
    { name: "Home", path: "/", icon: FiHome, color: '#0a520d' },
    { name: "My Plan", path: "/myplan", icon: FaCalendarAlt, color: '#0a520d' },
    { name: "Referral", path: "/ReferralProgram", icon: IoPeople, color: '#388E3C' },
    { name: "Deposit History", path: "/DepositHistory", icon: FaHistory, color: '#388E3C' },
    { name: "Withdraw History", path: "/WithdrawHistory", icon: FaHistory, color: '#DC2626' },
    { name: "My Team", path: "/Teams", icon: FaUsers, color: '#092757ff' },
    { name: "Settings", path: "/Settings", icon: IoMdSettings, color: '#202122ff' },
];

const BREAKPOINTS = { mobile: 768 };

function Layout({ children, currentPath = "/" }) {
    const { currency, changeCurrency } = useCurrency();
    const [username, setUsername] = useState('Loading...');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const isMobile = windowWidth <= BREAKPOINTS.mobile;

    useEffect(() => {
        setUsername(getUsernameFromToken());
        const handleResize = () => setWindowWidth(window.innerWidth);
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleWhatsAppClick = () => {
        const whatsappNumber = "923001234567"; 
        const message = "Hello, I need support regarding my account.";
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleLogout = () => {
        removeTokens();
        window.location.href = '/login'; 
    };

    const Header = () => (
        <header className={`main-header ${isScrolled ? 'header-scrolled' : ''}`} 
                style={!isMobile ? { 
                    position: 'fixed', top: 0, left: '260px', 
                    width: 'calc(100% - 260px)', height: '72px', padding: '0 24px' 
                } : {}}>
            <div className="header-left">
                {isMobile && (
                    <button className="icon-button" onClick={() => setIsSidebarOpen(true)}>
                        <FiMenu size={22} />
                    </button>
                )}
                <div className="user-badge">
                    {!isMobile && <p className="welcome-text">Welcome back</p>}
                    <span className="header-text" style={{ fontSize: isMobile ? '16px' : '18px' }}>{username}</span>
                </div>
            </div>
            
            <div className="header-right">
                {/* --- PROFESSIONAL CURRENCY DROPDOWN --- */}
                <div className="currency-selector-container">
                    <select 
                        value={currency} 
                        onChange={(e) => changeCurrency(e.target.value)}
                        className="currency-custom-select"
                    >
                        <option value="PKR">PKR (Rs)</option>
                        <option value="USDT">USDT (₮)</option>
                        <option value="TRX">TRX (TRX)</option>
                    </select>
                    <FiChevronDown className="select-icon" />
                </div>

                <button className="icon-button" onClick={() => alert('Notifications coming soon!')}>
                    <FiBell size={20} style={{ color: '#64748B' }} />
                    <div className="notification-dot"></div>
                </button>
                <button className="icon-button whatsapp-icon" onClick={handleWhatsAppClick}>
                    <FaWhatsapp size={22} />
                </button>
            </div>
        </header>
    );

    const SidebarLinks = ({ closeMobile }) => (
        <div className="sidebar-menu-list">
            {sidebarMenuItems.map((item, index) => (
                <a 
                    key={index} 
                    href={item.path} 
                    className={`sidebar-item ${currentPath === item.path ? 'active' : ''}`}
                    onClick={() => closeMobile && setIsSidebarOpen(false)}
                    style={currentPath === item.path ? { borderLeftColor: item.color } : {}}
                >
                    <item.icon size={18} style={{ color: item.color }} />
                    {item.name}
                </a>
            ))}
            <button className="sidebar-item logout-button" onClick={handleLogout}>
                <TbLogout2 size={18} /> Log Out
            </button>
        </div>
    );

    if (!isMobile) {
        return (
            <div className="layout-container">
                <aside className="desktop-sidebar">
                    <div className="sidebar-title">Advision Ads</div>
                    <SidebarLinks closeMobile={false} />
                </aside>

                <div className="desktop-main-content">
                    <Header />
                    <main className="desktop-content-area">
                        {children}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-container">
            <Header />
            
            {isSidebarOpen && <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} />}
            
            <div className="mobile-sidebar" style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
                    <div className="sidebar-title" style={{ padding: 0, marginBottom: 0 }}>Menu</div>
                    <button className="icon-button" onClick={() => setIsSidebarOpen(false)}><FiX size={24} /></button>
                </div>
                <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <SidebarLinks closeMobile={true} />
                </div>
            </div>

            <main style={{ paddingTop: '80px', paddingBottom: '20px', paddingLeft: '16px', paddingRight: '16px', flex: 1 }}>
                {children}
            </main>

            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                        <a key={item.name} href={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                            <item.icon size={22} style={{ marginBottom: '4px' }} />
                            <span>{item.name}</span>
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}

export default Layout;