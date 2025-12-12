import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LiveBackground = () => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(translateX, {
                            toValue: -50,
                            duration: 10000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateX, {
                            toValue: 0,
                            duration: 10000,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(translateY, {
                            toValue: -50,
                            duration: 15000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: 0,
                            duration: 15000,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        };

        animate();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.animatedContainer,
                    {
                        transform: [
                            { translateX },
                            { translateY },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    // Deep nebula colors: Dark Blue -> Purple -> Black -> Deep Red
                    colors={['#0f172a', '#312e81', '#1e1b4b', '#0f172a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0f172a',
        overflow: 'hidden',
    },
    animatedContainer: {
        width: width * 1.5,
        height: height * 1.5,
        position: 'absolute',
        top: -50,
        left: -50,
    },
    gradient: {
        flex: 1,
    },
});

export default LiveBackground;
