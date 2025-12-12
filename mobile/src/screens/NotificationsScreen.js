import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/config';
import { useFocusEffect } from '@react-navigation/native';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
            // Poll every 5 seconds
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, []);

    const handleDismiss = async (id) => {
        try {
            await api.post('/notifications/read', { id });
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to dismiss notification');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.content}>
                <Text style={styles.message}>
                    <Text style={styles.sender}>{item.sender_username}</Text> invited you for a smoke break at <Text style={styles.location}>{item.location}</Text>
                </Text>
                <Text style={styles.time}>{item.timestamp}</Text>
            </View>
            <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(item.id)}
            >
                <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Text style={{ color: '#34d399', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f8fafc" />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No new notifications.</Text>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    message: {
        color: '#cbd5e1',
        fontSize: 16,
        lineHeight: 24,
    },
    sender: {
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    location: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    time: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 5,
    },
    dismissButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    dismissText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 50,
    },
});

export default NotificationsScreen;
