import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/config';
import LiveBackground from '../components/LiveBackground';

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [emailError, setEmailError] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const handleEmailCheck = async () => {
        if (!email) return;
        try {
            const response = await api.post('/check-email', { email });
            if (!response.data.available) {
                setEmailError('Email is already registered');
            } else {
                setEmailError('');
            }
        } catch (error) {
            console.log('Email check error:', error);
        }
    };

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }
        if (emailError) {
            Alert.alert('Error', emailError);
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/send-verification-code', { email });
            setCodeSent(true);
            Alert.alert('Success', 'Verification code sent to your email!');
        } catch (error) {
            console.error('Send code error:', error);
            const msg = error.response?.data?.msg || 'Failed to send code';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !verificationCode) {
            Alert.alert('Error', 'Please fill in all fields including verification code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/register', {
                username,
                email,
                password,
                verification_code: verificationCode
            });
            Alert.alert('Success', 'Registration successful! Please login.');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Register error:', error);
            const msg = error.response?.data?.msg || error.message || 'An error occurred';
            Alert.alert('Registration Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LiveBackground />
            <View style={styles.content}>
                <Text style={styles.title}>GEL!</Text>
                <Text style={styles.subtitle}>Create your account</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        style={[styles.input, { flex: 1 }, emailError ? { borderColor: '#ef4444', borderWidth: 1 } : null]}
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setEmailError('');
                            setCodeSent(false); // Reset if email changes
                        }}
                        onEndEditing={handleEmailCheck}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {!codeSent && (
                        <TouchableOpacity
                            style={[styles.smallButton, { marginLeft: 10, marginBottom: 15 }]}
                            onPress={handleSendCode}
                            disabled={isLoading}
                        >
                            <Text style={styles.smallButtonText}>Send Code</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {emailError ? <Text style={{ color: '#ef4444', marginBottom: 10, marginLeft: 5 }}>{emailError}</Text> : null}

                {codeSent && (
                    <TextInput
                        style={styles.input}
                        placeholder="Verification Code (6 digits)"
                        placeholderTextColor="#94a3b8"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    onPress={handleRegister}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.button, isLoading && { opacity: 0.7 }]}
                    >
                        <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Register'}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Log In</Text></Text>
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
        textShadowColor: 'rgba(16, 185, 129, 0.5)', // Greenish glow for register
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
        shadowColor: '#10b981',
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
        color: '#34d399',
        fontWeight: '600',
    },
    smallButton: {
        backgroundColor: '#3b82f6',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    smallButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
