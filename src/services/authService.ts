// src/services/authService.ts
export interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

export const authService = {
    // Имитация входа (заменить на fetch к  бэкенду)
    login: async (email: string, password: string): Promise<User> => {
        await new Promise((res) => setTimeout(res, 800));

        if (email === 'user@example.com' && password === 'password') {
            const user: User = { id: '1', email, name: 'Инженер Иванов' };
            localStorage.setItem('authToken', 'mock-token-123');
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        }
        throw new Error('Неверный email или пароль');
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
    }
};