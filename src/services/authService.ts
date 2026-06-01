const API = '/api';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'engineer' | 'manager';
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || `Ошибка ${res.status}`);
    }
    return res.json();
}

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const tokenRes = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const { access_token } = await handleResponse<{ access_token: string }>(tokenRes);

        const meRes = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const userData = await handleResponse<{
            id: string; email: string; name: string; role: string;
        }>(meRes);

        const user: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role === 'manager' ? 'manager' : 'engineer',
        };

        localStorage.setItem('authToken', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('authToken');
    },

    getToken: (): string | null => {
        return localStorage.getItem('authToken');
    },
};