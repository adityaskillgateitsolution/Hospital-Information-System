'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHISStore } from '@/store/hisStore';
import { Lock, User, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PROJECT ROOT PAGE (/)
 * This page renders the Login component directly as the root of the application.
 * 
 * IMPORTANT FOR DEVELOPERS:
 * 1. This is a Next.js project. Use 'npm run dev' to start the server.
 * 2. Access the site via http://localhost:3000.
 * 3. DO NOT use "Live Server" (port 5500) as it cannot execute Next.js logic.
 */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useHISStore((state) => state.login);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin credentials for the HIS system
    if (username === 'admin@123' && password === 'admin123') {
      login(username);
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)'
    }}>
      {/* Left Panel: Medical Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden'
      }} className="hide-mobile">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Activity size={64} style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.1' }}>
            MediSync <br /> Enterprise HIS
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px' }}>
            Next-generation hospital management for modern healthcare providers.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Right Panel: Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{
            width: '100%',
            maxWidth: '450px',
            padding: '48px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--text-main)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--text-main)',
                  fontSize: '1rem'
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>
            )}

            <button
              type="submit"
              className="card-hover"
              style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                marginTop: '8px'
              }}
            >
              Sign In
            </button>
          </form>

          <div style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            <ShieldCheck size={16} color="var(--accent)" />
            <span>Secure 256-bit encrypted login</span>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
