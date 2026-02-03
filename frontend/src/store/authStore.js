/**
 * Authentication store using Zustand
 * Manages user authentication state globally
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            // Login action
            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const response = await authAPI.login(credentials);
                    const { access_token, refresh_token, user } = response.data;

                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', refresh_token);

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    toast.success('Login successful!');
                    return true;
                } catch (error) {
                    set({ isLoading: false });
                    return false;
                }
            },

            // Register action
            register: async (userData) => {
                set({ isLoading: true });
                try {
                    const response = await authAPI.register(userData);
                    const { access_token, refresh_token, user } = response.data;

                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', refresh_token);

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    toast.success('Registration successful!');
                    return true;
                } catch (error) {
                    set({ isLoading: false });
                    return false;
                }
            },

            // Logout action
            logout: async () => {
                const { refreshToken } = get();
                try {
                    if (refreshToken) {
                        await authAPI.logout(refreshToken);
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');

                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });

                    toast.success('Logged out successfully');
                }
            },

            // Load user from token
            loadUser: async () => {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                try {
                    const response = await authAPI.getProfile();
                    set({ user: response.data, isAuthenticated: true });
                } catch (error) {
                    // Token invalid - clear auth
                    get().logout();
                }
            },

            // Update user data
            updateUser: (userData) => {
                set({ user: { ...get().user, ...userData } });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
