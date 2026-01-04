import React, { useState, useEffect } from 'react';
// Fi for Menu/Logout/Icons, Fa for WhatsApp/Bottom Nav/Financial Icons
import { FiMenu, FiLogOut, FiBell, FiX, FiHome } from 'react-icons/fi';
import { FaWhatsapp, FaHome, FaChartLine, FaGift, FaUsers, FaDollarSign, FaWallet, FaHistory } from 'react-icons/fa'; 
import { getUsernameFromToken, removeTokens } from '../api/baseURL'; 

// --- COLOR CONSTANTS ---
const GREEN_PRIMARY = '#0a520d';   
const GREEN_LIGHT = '#388E3C';     
const BG_LIGHT = '#F0F4F8';        
const FORM_CARD_BG = '#FFFFFF';    
const INPUT_BG = '#F8FAFC';        
const TEXT_DARK = '#1E293B';       
const TEXT_GRAY = '#64748B';       
const BORDER_COLOR = '#E2E8F0';    
const GREEN_GRADIENT = 'linear-gradient(135deg, #0a520d 0%, #388E3C 100%)';

// --- Navigation Items (For Bottom Nav) ---
const navItems = [
    { name: "Home", icon: FaHome, path: "/" },
    // { name: "Invest", icon: FaChartLine, path: "/profit" },
    { name: "Progress", icon: FaGift, path: "/progress" },
    { name: "Team", icon: FaUsers, path: "/Teams" }, 
];

// --- Sidebar Menu Items (For the 3 lines menu) ---
const sidebarMenuItems = [
    { name: "Home", path: "/", icon: FiHome, color: GREEN_PRIMARY },
    // { name: "Deposit", path: "/deposit", icon: FaDollarSign, color: GREEN_PRIMARY }, 
    // { name: "Withdraw", path: "/withdraw", icon: FaWallet, color: '#B91C1C' }, 
    { name: "Deposit History", path: "/deposit", icon: FaHistory, color: GREEN_LIGHT },
    { name: "Withdraw History", path: "/withdraw", icon: FaHistory, color: '#DC2626' },
    { name: "My Team", path: "/Teams", icon: FaUsers, color: TEXT_DARK },
];

// --- Responsive Breakpoints ---
const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
};

// --- Helper for Header Height (Adjust this if you change header padding/font size) ---
const MOBILE_HEADER_HEIGHT = '64px'; // Approx (12px padding top/bottom + 40px icon height)

// --- DESKTOP CONSTANTS ---
const DESKTOP_SIDEBAR_WIDTH = '260px'; // Width of the fixed sidebar
const DESKTOP_HEADER_HEIGHT = '72px'; // Approximate height for padding

// --- Main Layout Component ---
function Layout({ children, currentPath = "/" }) {
    const [username, setUsername] = useState('Loading...');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Responsive check with safe window reference
    const isMobile = windowWidth <= BREAKPOINTS.mobile;
    const isTablet = windowWidth > BREAKPOINTS.mobile && windowWidth <= BREAKPOINTS.tablet;

    useEffect(() => {
        setUsername(getUsernameFromToken());
    }, []);

    useEffect(() => {
        // Safe window check for SSR
        if (typeof window === 'undefined') return;

        const handleResize = () => setWindowWidth(window.innerWidth);
        // Check scroll on the whole window for sticky header shadow
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

    // Close sidebar when clicking on overlay or resizing to desktop
    useEffect(() => {
        if (!isMobile && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [isMobile, isSidebarOpen]);

    // --- RESPONSIVE STYLES ---
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: BG_LIGHT,
            fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
            paddingBottom: isMobile ? '70px' : '0',
            width: '100%',
            overflowX: 'hidden',
            position: 'relative',
        },
        
        // --- RESPONSIVE HEADER ---
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '16px 24px',
            backgroundColor: FORM_CARD_BG,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            borderBottom: `1px solid ${BORDER_COLOR}`,
            // NOTE: Mobile FIX - Changed to 'fixed' for absolute scroll fix
            position: isMobile ? 'fixed' : 'sticky', // This is temporary, will be overwritten for desktop fix
            top: 0,
            zIndex: 1000,
            transition: 'all 0.3s ease',
            width: '100%', 
            left: 0, 
            right: 0, 
            boxSizing: 'border-box',
            flexShrink: 0,
            height: DESKTOP_HEADER_HEIGHT, // Define height for better desktop padding calculation
        },
        headerShadow: { // New style for shadow when scrolled
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px',
            flex: 1,
            minWidth: 0,
        },
        userBadge: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
        },
        welcomeText: {
            fontSize: isMobile ? '12px' : '14px',
            color: TEXT_GRAY,
            fontWeight: '500',
            margin: 0,
            // FIX: Ensure 'Welcome back' is visible on desktop
            display: isMobile ? 'none' : 'block', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.2',
        },
        headerText: {
            fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
            fontWeight: '700',
            color: TEXT_DARK,
            margin: 0,
            textTransform: 'capitalize',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.2',
        },
        headerRight: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            flexShrink: 0,
        },
        iconButton: {
            cursor: 'pointer',
            padding: isMobile ? '8px' : '10px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            color: TEXT_DARK,
            fontSize: isMobile ? '20px' : '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            minWidth: '40px',
            minHeight: '40px',
        },
        whatsappIcon: {
            color: '#25D366',
        },
        notificationIcon: {
            color: TEXT_GRAY,
            position: 'relative',
        },
        notificationDot: {
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            backgroundColor: '#EF4444',
            borderRadius: '50%',
        },

        // --- RESPONSIVE MAIN CONTENT ---
        mainContent: {
            flexGrow: 1,
            // MOBILE FIX: Added paddingTop to compensate for fixed header
            padding: isMobile ? `calc(${MOBILE_HEADER_HEIGHT} + 16px) 16px 16px` : '0', 
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
        },
        contentWrapper: {
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
        },
        
        // --- MOBILE BOTTOM NAV (Hidden on Desktop) ---
        bottomNav: {
            display: isMobile ? 'flex' : 'none',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: FORM_CARD_BG,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            borderTop: `1px solid ${BORDER_COLOR}`,
            height: '60px',
            zIndex: 1000,
            justifyContent: 'space-around',
            width: '100%',
            boxSizing: 'border-box',
        },
        navItem: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: TEXT_GRAY,
            fontSize: '12px',
            fontWeight: '600',
            padding: '8px 4px',
            transition: 'all 0.2s ease',
            minWidth: '60px',
            boxSizing: 'border-box',
        },
        navItemActive: {
            color: GREEN_PRIMARY,
            backgroundColor: `${GREEN_PRIMARY}08`,
        },
        navIcon: {
            fontSize: '20px',
            marginBottom: '4px',
            transition: 'all 0.2s ease',
        },

        // --- RESPONSIVE SIDEBAR (Mobile/Overlay) ---
        sidebar: {
            position: 'fixed',
            top: 0,
            left: isSidebarOpen ? 0 : '-100%',
            width: isMobile ? '280px' : DESKTOP_SIDEBAR_WIDTH,
            height: '100%',
            backgroundColor: FORM_CARD_BG,
            boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            zIndex: 2000,
            transition: 'left 0.3s ease',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            boxSizing: 'border-box',
        },
        overlay: {
            display: isSidebarOpen ? 'block' : 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1500,
            animation: isSidebarOpen ? 'fadeIn 0.3s ease' : 'none',
        },
        sidebarHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 20px 20px 20px',
            marginBottom: '16px',
            borderBottom: `1px solid ${BORDER_COLOR}`,
            boxSizing: 'border-sizing',
        },
        sidebarTitle: {
            fontSize: '20px',
            fontWeight: '700',
            background: GREEN_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        },
        closeButton: {
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            color: TEXT_GRAY,
            fontSize: '20px',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
        },
        sidebarItem: {
            padding: '14px 20px',
            fontSize: '16px',
            color: TEXT_DARK,
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '4px solid transparent',
            margin: '2px 0',
            boxSizing: 'border-box',
            border: 'none',
            background: 'none',
            width: '100%',
            textAlign: 'left',
        },
        logoutButton: {
            marginTop: 'auto',
            color: '#B91C1C',
            fontWeight: '600',
            borderTop: `1px solid ${BORDER_COLOR}`,
            margin: '16px 0 0 0',
        },

        // --- DESKTOP SIDEBAR (Alternative for desktop) ---
        desktopSidebar: {
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            width: DESKTOP_SIDEBAR_WIDTH, // Use constant width
            backgroundColor: FORM_CARD_BG,
            borderRight: `1px solid ${BORDER_COLOR}`,
            padding: '24px 0',
            height: '100vh',
            // FIX 1: Sidebar is FIXED
            position: 'fixed', 
            top: 0,
            left: 0, 
            overflowY: 'auto', 
            flexShrink: 0,
            boxSizing: 'border-box',
            zIndex: 1100, 
        },
        desktopContainer: {
            minHeight: '100vh',
            width: '100%',
            overflowX: 'hidden',
        },
        desktopMainContent: {
            flex: 1,
            // FIX 2: Add left margin to account for the fixed sidebar
            marginLeft: DESKTOP_SIDEBAR_WIDTH, 
            minHeight: '100vh',
            boxSizing: 'border-box',
        },
        desktopContentArea: {
            // FIX 3: Add top padding to start content BELOW the FIXED header
            padding: `calc(${DESKTOP_HEADER_HEIGHT} + 24px) 24px 24px`,
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
        }
    };

    // Desktop layout with permanent sidebar
    if (!isMobile) {
        return (
            <div style={styles.desktopContainer}>
                {/* 1. Desktop Sidebar (FIXED: position: 'fixed' prevents page scroll) */}
                <aside style={styles.desktopSidebar}>
                    <div style={{...styles.sidebarHeader, border: 'none', marginBottom: '24px'}}>
                        <div style={styles.sidebarTitle}>Advision Ads</div>
                    </div>
                    
                    {/* Desktop Menu Items */}
                    {sidebarMenuItems.map((item, index) => (
                        <a 
                            key={index} 
                            href={item.path} 
                            style={{
                                ...styles.sidebarItem,
                                ...(currentPath === item.path ? {
                                    backgroundColor: INPUT_BG,
                                    borderLeft: `4px solid ${item.color}`,
                                    paddingLeft: 'calc(20px - 2px)',
                                } : {})
                            }}
                            onMouseEnter={(e) => {
                                if (currentPath !== item.path) {
                                    e.currentTarget.style.backgroundColor = INPUT_BG;
                                    e.currentTarget.style.borderLeft = `4px solid ${item.color}`;
                                    e.currentTarget.style.paddingLeft = 'calc(20px - 2px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPath !== item.path) {
                                    e.currentTarget.style.backgroundColor = FORM_CARD_BG;
                                    e.currentTarget.style.borderLeft = '4px solid transparent';
                                    e.currentTarget.style.paddingLeft = '20px';
                                }
                            }}
                        >
                            <item.icon style={{ fontSize: '18px', color: item.color }} />
                            {item.name}
                        </a>
                    ))}
                    
                    {/* Logout Button (Stays at the bottom of the fixed sidebar) */}
                    <button 
                        style={{ ...styles.sidebarItem, ...styles.logoutButton, marginTop: 'auto' }}
                        onClick={handleLogout}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                            e.currentTarget.style.borderLeft = '4px solid #B91C1C';
                            e.currentTarget.style.paddingLeft = 'calc(20px - 2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = FORM_CARD_BG;
                            e.currentTarget.style.borderLeft = '4px solid transparent';
                            e.currentTarget.style.paddingLeft = '20px';
                        }}
                    >
                        <FiLogOut style={{ fontSize: '18px' }} />
                        Log Out
                    </button>
                </aside>

                {/* Desktop Main Content Area (Scrollable content) */}
                <div style={styles.desktopMainContent}>
                    {/* 2. Desktop Header (FIXED: Now fixed to viewport top, and positioned to the right of the sidebar) */}
                    <header style={{
                        ...styles.header, 
                        // --- FIX FOR SCROLLING HEADER ---
                        position: 'fixed', // Use FIXED to keep it always visible
                        top: 0, 
                        left: DESKTOP_SIDEBAR_WIDTH, // Start position after the fixed sidebar
                        width: `calc(100% - ${DESKTOP_SIDEBAR_WIDTH})`, // Take up the remaining width
                        // ---------------------------------
                        zIndex: 1000, 
                        ...(isScrolled ? styles.headerShadow : {}), // Apply shadow based on scroll
                        boxShadow: isScrolled ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                        <div style={styles.headerLeft}>
                            <div style={styles.userBadge}>
                                {/* This 'Welcome back' text will stay visible */}
                                <p style={styles.welcomeText}>Welcome back</p>
                                <span style={styles.headerText}>{username}</span>
                            </div>
                        </div>
                        
                        <div style={styles.headerRight}>
                            <button 
                                style={{...styles.iconButton, ...styles.notificationIcon, position: 'relative'}}
                                onClick={() => alert('Notifications coming soon!')}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${BORDER_COLOR}50`}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <FiBell />
                                <div style={styles.notificationDot}></div>
                            </button>
                            
                            <button 
                                style={{ 
                                    ...styles.iconButton, 
                                    ...styles.whatsappIcon,
                                    backgroundColor: `${GREEN_PRIMARY}08`,
                                }}
                                onClick={handleWhatsAppClick}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${GREEN_PRIMARY}15`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = `${GREEN_PRIMARY}08`;
                                }}
                            >
                                <FaWhatsapp />
                            </button>
                        </div>
                    </header>
                    
                    {/* Page Content */}
                    <main style={styles.desktopContentArea}> 
                        <div style={styles.desktopContentWrapper}>
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Mobile Layout (No changes needed here, as mobile header was already fixed)
    return (
        <div style={styles.container}>
            {/* 1. MOBILE HEADER - FIXED with position: 'fixed' */}
            <header style={styles.header}> 
                <div style={styles.headerLeft}>
                    <button 
                        style={{
                            ...styles.iconButton,
                            background: isSidebarOpen ? `${GREEN_PRIMARY}10` : 'transparent',
                            color: isSidebarOpen ? GREEN_PRIMARY : TEXT_DARK,
                        }}
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <FiMenu />
                    </button>
                    <div style={styles.userBadge}>
                        <span style={styles.headerText}>{username}</span>
                    </div>
                </div>
                
                <div style={styles.headerRight}>
                    <button 
                        style={{...styles.iconButton, ...styles.notificationIcon, position: 'relative'}}
                        onClick={() => alert('Notifications coming soon!')}
                    >
                        <FiBell />
                        <div style={styles.notificationDot}></div>
                    </button>
                    
                    <button 
                        style={{ 
                            ...styles.iconButton, 
                            ...styles.whatsappIcon,
                            backgroundColor: `${GREEN_PRIMARY}08`,
                        }}
                        onClick={handleWhatsAppClick}
                    >
                        <FaWhatsapp />
                    </button>
                </div>
            </header>
            
            {/* 2. MOBILE SIDEBAR */}
            <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.sidebarTitle}>Menu</div>
                    <button 
                        style={styles.closeButton}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <FiX />
                    </button>
                </div>
                
                {/* Mobile Menu Items - WITHOUT HOME */}
                {sidebarMenuItems.filter(item => item.name !== "Home").map((item, index) => (
                    <a 
                        key={index} 
                        href={item.path} 
                        style={styles.sidebarItem}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <item.icon style={{ fontSize: '18px', color: item.color }} />
                        {item.name}
                    </a>
                ))}
                
                <button 
                    style={{ ...styles.sidebarItem, ...styles.logoutButton }}
                    onClick={handleLogout}
                >
                    <FiLogOut style={{ fontSize: '18px' }} />
                    Log Out
                </button>
            </div>

            {/* 3. MOBILE MAIN CONTENT - Has top padding for fixed header */}
            <main style={styles.mainContent}>
                <div style={styles.contentWrapper}>
                    {children}
                </div>
            </main>

            {/* 4. MOBILE BOTTOM NAVIGATION */}
            <nav style={styles.bottomNav}>
                {navItems.map((item) => {
                    const isActive = currentPath === item.path || 
                                   (item.path === '/' && currentPath === '/') ||
                                   (item.path !== '/' && currentPath.startsWith(item.path));
                    return (
                        <a 
                            key={item.name} 
                            href={item.path} 
                            style={{
                                ...styles.navItem,
                                ...(isActive ? styles.navItemActive : {}),
                            }}
                        >
                            <item.icon style={styles.navIcon} />
                            {item.name}
                        </a>
                    );
                })}
            </nav>

            {/* CSS Animations */}
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                /* Global styles */
                * {
                    box-sizing: border-box;
                }
                
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    overflow-x: hidden;
                    /* This is critical for sticky/fixed elements to work on body scroll */
                    overflow-y: scroll; 
                    background: ${BG_LIGHT};
                }
                
                /* Ensure header stays visible on mobile */
                @media (max-width: 768px) {
                    /* Removed redundant/conflicting sticky styles here, now relying on inline 'fixed' */
                }
                `}
            </style>
        </div>
    );
}

export default Layout;