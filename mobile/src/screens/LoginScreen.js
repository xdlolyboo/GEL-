import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import api from '../api/config';
import LiveBackground from '../components/LiveBackground';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        try {
            const response = await api.post('/login', { username, password });
            login(response.data.access_token);
        } catch (error) {
            Alert.alert('Login Failed', 'Invalid credentials');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LiveBackground />
            <View style={styles.content}>
                <Text style={styles.title}>GEL!</Text>
                <Text style={styles.subtitle}>Login to your account</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#3b82f6', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Log In</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(59, 130, 246, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        color: '#f8fafc',
        fontSize: 16,
    },
    button: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 24,
        fontSize: 15,
    },
    linkHighlight: {
        color: '#60a5fa',
        fontWeight: '600',
    },
});

export default LoginScreen;
