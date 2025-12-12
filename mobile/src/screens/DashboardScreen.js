import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const DashboardScreen = () => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [addFriendUsername, setAddFriendUsername] = useState('');

    const locations = [
        "MA cigarette", "B cigarette", "78 cigarette", "FF cigarette", "74 cigarette"
    ];

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends/status');
            setFriends(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/friends/requests');
            setRequests(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFriends();
            fetchRequests();
            const interval = setInterval(() => {
                fetchFriends();
                fetchRequests();
            }, 5000);
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchFriends();
        await fetchRequests();
        setRefreshing(false);
    }, []);

    const handleSendRequest = async () => {
        if (!addFriendUsername) return;
        try {
            await api.post('/friends/request', { username: addFriendUsername });
            Alert.alert('Success', `Request sent to ${addFriendUsername}`);
            setAddFriendUsername('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.msg || 'Failed to send request');
        }
    };

    const handleAccept = async (reqId) => {
        try {
            await api.post('/friends/accept', { request_id: reqId });
            fetchRequests();
            fetchFriends();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept request');
        }
    };

    const handleReject = async (reqId) => {
        try {
            await api.post('/friends/reject', { request_id: reqId });
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject request');
        }
    };

    const handleInvite = async (location) => {
        try {
            await api.post('/invite', {
                receiver_id: selectedFriend.id,
                location: location
            });
            Alert.alert('Sent!', `Invite sent to ${selectedFriend.username}`);
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to send invite');
        }
    };

    const renderFriendItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.username}>{item.username}</Text>
                <View style={[styles.badge, item.is_free ? styles.badgeSuccess : styles.badgeDanger]}>
                    <Text style={[styles.badgeText, item.is_free ? styles.textSuccess : styles.textDanger]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            {item.is_free && (
                <TouchableOpacity
                    style={styles.smokeButton}
                    onPress={() => {
                        setSelectedFriend(item);
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.smokeButtonText}>Smoke?</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const { logout } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.headerTitle}>Friends</Text>
                    <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Text style={{ color: '#34d399', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.addFriendContainer}>
                <TextInput
                    style={styles.addInput}
                    placeholder="Send request to username..."
                    placeholderTextColor="#94a3b8"
                    value={addFriendUsername}
                    onChangeText={setAddFriendUsername}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleSendRequest}>
                    <Text style={styles.addButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f8fafc" />
                }
            >
                {requests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pending Requests</Text>
                        {requests.map(req => (
                            <View key={req.id} style={[styles.card, styles.requestCard]}>
                                <Text style={styles.username}>{req.sender_username}</Text>
                                <View style={styles.requestButtons}>
                                    <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(req.id)}>
                                        <Text style={styles.actionButtonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(req.id)}>
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Friends Status</Text>
                {friends.length === 0 ? (
                    <Text style={styles.emptyText}>No friends added yet.</Text>
                ) : (
                    friends.map(friend => (
                        <View key={friend.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.username}>{friend.username}</Text>
                                <View style={[styles.badge, friend.is_free ? styles.badgeSuccess : styles.badgeDanger]}>
                                    <Text style={[styles.badgeText, friend.is_free ? styles.textSuccess : styles.textDanger]}>
                                        {friend.status}
                                    </Text>
                                </View>
                            </View>

                            {friend.is_free && (
                                <TouchableOpacity
                                    style={styles.smokeButton}
                                    onPress={() => {
                                        setSelectedFriend(friend);
                                        setModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.smokeButtonText}>Smoke?</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        {locations.map(loc => (
                            <TouchableOpacity
                                key={loc}
                                style={styles.locationButton}
                                onPress={() => handleInvite(loc)}
                            >
                                <Text style={styles.locationText}>{loc}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.locationButton, styles.cancelButton]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    logoutText: {
        color: '#f87171',
        fontWeight: 'bold',
        fontSize: 14,
    },
    addFriendContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
    },
    addInput: {
        flex: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 8,
        padding: 12,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    addButton: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textSuccess: { color: '#34d399' },
    textDanger: { color: '#f87171' },
    smokeButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
    },
    smokeButtonText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 50,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 20,
        textAlign: 'center',
    },
    locationButton: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    locationText: {
        color: '#f8fafc',
        fontSize: 16,
        textAlign: 'center',
    },
    cancelButton: {
        borderBottomWidth: 0,
        marginTop: 10,
    },
    cancelText: {
        color: '#94a3b8',
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 10,
    },
    requestCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    requestButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    rejectButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    actionButtonText: {
        color: '#f8fafc',
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
