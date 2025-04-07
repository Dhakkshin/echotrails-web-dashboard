"use client";

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#000000',
            color: '#ffffff',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '60px 24px',
        },
        logo: {
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            backgroundColor: '#00ff9d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 auto',
            marginBottom: '24px',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
        },
        title: {
            fontSize: '48px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '16px',
        },
        subtitle: {
            fontSize: '20px',
            textAlign: 'center',
            color: '#a0a0a0',
            marginBottom: '48px',
            maxWidth: '600px',
            marginInline: 'auto',
        },
        buttons: {
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '64px',
        },
        buttonPrimary: {
            padding: '16px 32px',
            backgroundColor: '#00ff9d',
            color: '#000000',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
            textDecoration: 'none',
        },
        buttonSecondary: {
            padding: '16px 32px',
            backgroundColor: '#111111',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '14px',
            border: '1px solid #333',
            textDecoration: 'none',
        },
        featureSection: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
            maxWidth: '900px',
            margin: '0 auto',
        },
        featureCard: {
            backgroundColor: '#111111',
            padding: '32px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
        },
        featureEmoji: {
            fontSize: '32px',
            marginBottom: '12px',
        },
        featureTitle: {
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px',
        },
        featureText: {
            color: '#bbbbbb',
        },
        downloadSection: {
            textAlign: 'center',
            marginTop: '48px',
            padding: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        downloadTitle: {
            fontSize: '24px',
            fontWeight: '600',
            color: '#00ff9d',
            marginBottom: '16px',
        },
        downloadLink: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 32px',
            backgroundColor: '#00ff9d',
            color: '#000000',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '14px',
            textDecoration: 'none',
            marginTop: '16px',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
        },
        downloadText: {
            color: '#a0a0a0',
            fontSize: '16px',
            marginBottom: '24px',
        },
    };

    return (
        <div style={styles.container}>
            <Navbar />
            <div style={styles.logo}>ET</div>
            <h1 style={styles.title}>EchoTrails</h1>
            <p style={styles.subtitle}>
                Drop your voice into the world. Discover hidden memories wherever your footsteps take you.
            </p>

            <div style={styles.buttons}>
                <Link href="/signup" legacyBehavior>
                    <a style={styles.buttonPrimary}>Get Started</a>
                </Link>
                <Link href="/map" legacyBehavior>
                    <a style={styles.buttonSecondary}>Explore Map</a>
                </Link>
            </div>

            <div style={styles.featureSection}>
                <div style={styles.featureCard}>
                    <div style={styles.featureEmoji}>🎙️</div>
                    <h3 style={styles.featureTitle}>Record</h3>
                    <p style={styles.featureText}>
                        Leave a voice message at your current GPS location.
                    </p>
                </div>
                <div style={styles.featureCard}>
                    <div style={styles.featureEmoji}>🔐</div>
                    <h3 style={styles.featureTitle}>Customize</h3>
                    <p style={styles.featureText}>
                        Set visibility — public, private, or time-locked.
                    </p>
                </div>
                <div style={styles.featureCard}>
                    <div style={styles.featureEmoji}>🗺️</div>
                    <h3 style={styles.featureTitle}>Discover</h3>
                    <p style={styles.featureText}>
                        Unlock audio when visiting the right spot.
                    </p>
                </div>
            </div>

            <div style={styles.downloadSection}>
                <h2 style={styles.downloadTitle}>Get the Mobile App</h2>
                <p style={styles.downloadText}>
                    Experience EchoTrails on the go with our mobile app.
                    Available for Android. (iOS users, you aint getting it😏)
                </p>
                <a 
                    href="https://expo.dev/accounts/pream14/projects/bolt-expo-nativewind/builds/a5dc6978-7485-4f9a-87c6-dcfa1f9e41bc"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadLink}
                >
                    📱 Download Mobile App
                </a>
            </div>
        </div>
    );
}
