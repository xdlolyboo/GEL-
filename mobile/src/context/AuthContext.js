import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../api/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token;
            try {
                if (Platform.OS === 'web') {
                    token = localStorage.getItem('userToken');
                } else {
                    token = await SecureStore.getItemAsync('userToken');
                }
            } catch (e) {
                console.log('Restoring token failed', e);
            }

            if (token) {
                setUserToken(token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const login = async (token) => {
        setUserToken(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (Platform.OS === 'web') {
            localStorage.setItem('userToken', token);
        } else {
            await SecureStore.setItemAsync('userToken', token);
        }
    };

    const logout = async () => {
        setUserToken(null);
        delete api.defaults.headers.common['Authorization'];
        if (Platform.OS === 'web') {
            localStorage.removeItem('userToken');
        } else {
            await SecureStore.deleteItemAsync('userToken');
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
