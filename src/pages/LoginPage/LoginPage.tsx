// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { authService } from '../../services/authService.ts';
import styles from './LoginPage.module.css';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!email.trim() || !password.trim()) {
                throw new Error('Заполните все поля');
            }
            await authService.login(email, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>🔌 ЭнергоПоле</h1>
                <p className={styles.subtitle}>Система обследования объектов</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.loginButton} disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти в систему'}
                    </button>
                </form>

                <div className={styles.demoHint}>
                    <p>Демо: <strong>user@example.com</strong> / <strong>password</strong></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;