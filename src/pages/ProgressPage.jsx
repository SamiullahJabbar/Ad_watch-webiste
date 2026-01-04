import React from 'react';
import Layout from '../components/Layout'; // <-- Layout component imported!

// --- Style Constants ---
const GREEN_PRIMARY = '#0a520d'; 
const BG_LIGHT = '#F0F4F8';
const TEXT_DARK = '#1E293B';

function ProgressPage() {
  
    // Styles for centering the "Coming Soon" message
    const containerStyle = {
        minHeight: '100vh',
        background: BG_LIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
    };

    const comingSoonStyle = {
        fontSize: '2rem',
        fontWeight: '800',
        color: GREEN_PRIMARY,
        marginBottom: '1rem',
    };

    const subTextStyle = {
        fontSize: '1.2rem',
        color: TEXT_DARK,
        opacity: 0.7,
    };

    return (
        // Layout component wraps the content, set a unique path
        <Layout currentPath="/progress"> 
            <div style={containerStyle}>
                <h1 style={comingSoonStyle}>
                    📈 Progress Tracking
                </h1>
                <p style={subTextStyle}>
                    This page is currently under development and is coming soon!
                </p>
                <p style={{ ...subTextStyle, fontSize: '1rem', marginTop: '0.5rem' }}>
                    Yahaan aap apni investments ka status aur growth track kar payenge.
                </p>
            </div>
        </Layout>
    );
}

export default ProgressPage;