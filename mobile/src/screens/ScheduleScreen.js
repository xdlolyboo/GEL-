import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/config';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const ScheduleScreen = () => {
    const [schedule, setSchedule] = useState([]);
    const [day, setDay] = useState('0');
    const [modalVisible, setModalVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [newClass, setNewClass] = useState({
        day_of_week: '0',
        start_time: '',
        end_time: '',
        course_name: ''
    });
    const [startTime, setStartTime] = useState(''); // Added based on handleAdd usage
    const [endTime, setEndTime] = useState('');
    const [courseName, setCourseName] = useState('');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const fetchSchedule = async () => {
        try {
            const res = await api.get('/schedule');
            setSchedule(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSchedule();
        }, [])
    );

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setIsUploading(true);
        const formData = new FormData();

        if (Platform.OS === 'web') {
            // On web, we need to convert the URI to a Blob
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, 'schedule.jpg');
        } else {
            // On mobile, we use the object format
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'schedule.jpg',
            });
        }

        try {
            await api.post('/schedule/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Alert.alert('Success', 'Schedule parsed and added!');
            fetchSchedule();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload schedule');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAdd = async () => {
        if (!startTime || !endTime) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        try {
            await api.post('/schedule', {
                day_of_week: parseInt(day),
                start_time: startTime,
                end_time: endTime,
                course_name: courseName
            });
            Alert.alert('Success', 'Class added');
            setCourseName('');
            fetchSchedule();
        } catch (error) {
            Alert.alert('Error', 'Failed to add class');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/schedule?id=${id}`);
            fetchSchedule();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete class');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.dayText}>{days[item.day_of_week]}</Text>
                <Text style={styles.timeText}>{item.start_time} - {item.end_time}</Text>
                <Text style={styles.courseText}>{item.course_name}</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Schedule</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={[styles.uploadButton, isUploading && styles.disabledButton]}
                        onPress={pickImage}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>📷 AI Upload</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Add Class</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Day (0-6)"
                        placeholderTextColor="#94a3b8"
                        value={day}
                        onChangeText={setDay}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Start (HH:MM)"
                        placeholderTextColor="#94a3b8"
                        value={startTime}
                        onChangeText={setStartTime}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="End (HH:MM)"
                        placeholderTextColor="#94a3b8"
                        value={endTime}
                        onChangeText={setEndTime}
                    />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Course Name"
                    placeholderTextColor="#94a3b8"
                    value={courseName}
                    onChangeText={setCourseName}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Add Class</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={schedule.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    uploadButton: {
        backgroundColor: '#8b5cf6', // Purple for AI
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    form: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    label: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    input: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 8,
        padding: 12,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#10b981',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
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
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardContent: {
        flex: 1,
    },
    dayText: {
        color: '#3b82f6',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    timeText: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '600',
    },
    courseText: {
        color: '#94a3b8',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    deleteText: {
        color: '#f87171',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default ScheduleScreen;
