export interface User {
    id: string;
    email: string;
    name: string;
    role: 'engineer' | 'manager';
}

export const authService = {
    // Имитация входа (заменить на fetch к  бэкенду)
    login: async (email: string, password: string): Promise<User> => {
        await new Promise((res) => setTimeout(res, 800));

        if (email === 'manager@example.com' && password === 'manager') {
            const user: User = { id: '1', email, name: 'Менеджер Сидоров', role: 'manager' };
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', 'mock-manager-token');
            return user;
        }
        if (email === 'user@example.com' && password === 'password') {
            const user: User = { id: '2', email, name: 'Инженер Иванов', role: 'engineer' };
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', 'mock-engineer-token');
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