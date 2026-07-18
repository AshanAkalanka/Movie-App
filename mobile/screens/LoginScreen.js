import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { returnTo } = useLocalSearchParams();
    const router = useRouter();
    const { login } = useAuth();

    const submit = async () => {
        if (!email.trim() || !password) return setError('Enter your email and password.');
        setSubmitting(true); setError('');
        try {
            await login(email, password);
            router.replace(typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/');
        } catch (requestError) {
            setError(requestError?.response?.data?.message || 'We couldn’t sign you in right now. Please try again.');
        } finally { setSubmitting(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Pressable style={styles.close} onPress={() => router.back()}><Ionicons name="close" size={27} color="#fff" /></Pressable>
                    <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
                    <View style={styles.card}>
                        <Text style={styles.title}>Welcome back</Text><Text style={styles.subtitle}>Sign in to play trailers and manage your personal movie list.</Text>
                        <Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@example.com" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                        <Text style={styles.label}>Password</Text><View style={styles.passwordRow}><TextInput value={password} onChangeText={setPassword} style={styles.passwordInput} placeholder="Your password" placeholderTextColor="#777" secureTextEntry={!showPassword} autoComplete="current-password" /><Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#aaa" /></Pressable></View>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <Pressable style={[styles.submit, submitting && styles.disabled]} disabled={submitting} onPress={submit}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Sign In</Text>}</Pressable>
                        <Pressable onPress={() => router.push({ pathname: '/register', params: { returnTo: typeof returnTo === 'string' ? returnTo : '/' } })}><Text style={styles.switchText}>New to Screenly? <Text style={styles.switchStrong}>Create an account</Text></Text></Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' }, flex: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 },
    close: { position: 'absolute', top: 14, right: 18, zIndex: 2 }, logo: { width: 92, height: 92, alignSelf: 'center', marginBottom: 24, borderRadius: 20 },
    card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: '#141414', borderRadius: 12, borderWidth: 1, borderColor: '#292929', padding: 24 },
    title: { color: '#fff', fontSize: 28, fontWeight: '900' }, subtitle: { color: '#999', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 16 },
    label: { color: '#ccc', fontSize: 12, fontWeight: '800', marginTop: 13, marginBottom: 7 }, input: { height: 49, borderRadius: 6, backgroundColor: '#292929', color: '#fff', paddingHorizontal: 14, borderWidth: 1, borderColor: '#3a3a3a' },
    passwordRow: { height: 49, borderRadius: 6, backgroundColor: '#292929', paddingHorizontal: 14, borderWidth: 1, borderColor: '#3a3a3a', flexDirection: 'row', alignItems: 'center' }, passwordInput: { flex: 1, color: '#fff' },
    error: { color: '#ff8a90', fontSize: 12, lineHeight: 17, marginTop: 13 }, submit: { height: 49, borderRadius: 6, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center', marginTop: 20 }, disabled: { opacity: 0.65 }, submitText: { color: '#fff', fontSize: 15, fontWeight: '900' },
    switchText: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 20 }, switchStrong: { color: '#fff', fontWeight: '900' },
});
