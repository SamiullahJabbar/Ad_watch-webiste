import React from 'react';
import Layout from '../components/Layout'; // <-- Tumhara Layout component import ho gaya

// --- Style Constants ---
const GREEN_PRIMARY = '#0a520d'; 
const BG_LIGHT = '#F0F4F8';

function TeamPage() {
  
    // Simple styles for a clean "Coming Soon" look
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
        color: '#64748B', // Gray color
    };

    return (
        // Layout component wraps the content
        <Layout currentPath="/team"> 
            <div style={containerStyle}>
                <h1 style={comingSoonStyle}>
                    👥 My Team
                </h1>
                <p style={subTextStyle}>
                    This page is coming soon. We're building something great for your team management!
                </p>
            </div>
        </Layout>
    );
}

export default TeamPage;