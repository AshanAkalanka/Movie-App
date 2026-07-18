import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileAvatar, { PROFILE_STICKERS } from '../components/ProfileAvatar';
import { useAuth } from '../context/AuthContext';

const requestMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export default function AccountSettingsScreen() {
    const { user, loading, updateProfile, changePassword } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        setName(user.name || '');
        setProfileImage(user.profileImage || '');
    }, [user]);

    const profileChanged = Boolean(user) && (name.trim() !== user.name || profileImage !== (user.profileImage || ''));

    const saveProfile = async () => {
        if (!name.trim()) { setProfileError('Enter a display name.'); return; }
        setProfileSaving(true); setProfileError(''); setProfileSuccess('');
        try {
            await updateProfile({ name, profileImage });
            setProfileSuccess('Your profile has been updated.');
        } catch (error) { setProfileError(requestMessage(error, 'Your profile couldn’t be updated right now.')); }
        finally { setProfileSaving(false); }
    };

    const savePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('Complete all three password fields.'); return; }
        if (newPassword.length < 10 || newPassword.length > 72) { setPasswordError('Your new password must contain 10 to 72 characters.'); return; }
        if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
        if (currentPassword === newPassword) { setPasswordError('Choose a password different from your current password.'); return; }
        setPasswordSaving(true); setPasswordError(''); setPasswordSuccess('');
        try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setPasswordSuccess('Password updated. Other signed-in devices have been signed out.');
        } catch (error) { setPasswordError(requestMessage(error, 'Your password couldn’t be changed right now.')); }
        finally { setPasswordSaving(false); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914" /></View>;
    if (!user) return <SafeAreaView style={styles.center}><View style={styles.lockIcon}><Ionicons name="lock-closed" size={34} color="#fff" /></View><Text style={styles.deniedTitle}>Sign in required</Text><Pressable style={styles.doneButton} onPress={() => router.back()}><Text style={styles.doneText}>Go Back</Text></Pressable></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#08080a" />
            <View style={styles.header}><Pressable style={styles.closeButton} onPress={() => router.back()}><Ionicons name="close" size={24} color="#fff" /></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR SCREENLY</Text><Text style={styles.heading}>Account Settings</Text></View><View style={styles.headerSpacer} /></View>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.previewCard}><ProfileAvatar profileImage={profileImage} name={name} size={82} /><View style={styles.previewCopy}><Text style={styles.previewName}>{name.trim() || 'Your name'}</Text><Text style={styles.previewEmail}>{user.email}</Text><View style={styles.rolePill}><Ionicons name={user.role === 'admin' ? 'shield-checkmark' : 'person'} size={12} color={user.role === 'admin' ? '#b9afff' : '#8bd9b6'} /><Text style={[styles.roleText, user.role === 'admin' && styles.adminRoleText]}>{user.role === 'admin' ? 'Administrator' : 'Screenly member'}</Text></View></View></View>

                    <SectionHeading icon="person-outline" title="Profile" caption="Choose how you appear around Screenly." />
                    <Text style={styles.label}>Display name</Text>
                    <View style={styles.inputRow}><Ionicons name="text-outline" size={19} color="#888a93" /><TextInput value={name} onChangeText={(value) => { setName(value); setProfileSuccess(''); }} style={styles.input} placeholder="Your name" placeholderTextColor="#65666e" maxLength={80} autoComplete="name" /></View>

                    <Text style={styles.label}>Choose an icon or sticker</Text>
                    <View style={styles.stickerGrid}>{PROFILE_STICKERS.map((sticker) => {
                        const selected = sticker.id === profileImage;
                        return <Pressable key={sticker.id || 'initial'} accessibilityLabel={`Use ${sticker.label} profile icon`} style={[styles.stickerOption, selected && styles.stickerSelected]} onPress={() => { setProfileImage(sticker.id); setProfileSuccess(''); }}><ProfileAvatar profileImage={sticker.id} name={name} size={49} /><Text style={[styles.stickerLabel, selected && styles.stickerLabelSelected]} numberOfLines={1}>{sticker.label}</Text>{selected ? <View style={styles.check}><Ionicons name="checkmark" size={11} color="#fff" /></View> : null}</Pressable>;
                    })}</View>
                    <Feedback error={profileError} success={profileSuccess} />
                    <Pressable style={[styles.primaryButton, (!profileChanged || profileSaving) && styles.disabled]} disabled={!profileChanged || profileSaving} onPress={saveProfile}>{profileSaving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.primaryText}>Save Profile</Text></>}</Pressable>

                    <View style={styles.divider} />
                    <SectionHeading icon="key-outline" title="Change password" caption="Changing it signs out every other Screenly session." />
                    <PasswordField label="Current password" value={currentPassword} onChangeText={(value) => { setCurrentPassword(value); setPasswordSuccess(''); }} visible={showPasswords} autoComplete="current-password" />
                    <PasswordField label="New password" value={newPassword} onChangeText={(value) => { setNewPassword(value); setPasswordSuccess(''); }} visible={showPasswords} autoComplete="new-password" help="Use 10 to 72 characters." />
                    <PasswordField label="Confirm new password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setPasswordSuccess(''); }} visible={showPasswords} autoComplete="new-password" />
                    <Pressable style={styles.visibilityButton} onPress={() => setShowPasswords((value) => !value)}><Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={18} color="#bbbcc2" /><Text style={styles.visibilityText}>{showPasswords ? 'Hide passwords' : 'Show passwords'}</Text></Pressable>
                    <Feedback error={passwordError} success={passwordSuccess} />
                    <Pressable style={[styles.passwordButton, passwordSaving && styles.disabled]} disabled={passwordSaving} onPress={savePassword}>{passwordSaving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="shield-checkmark-outline" size={20} color="#fff" /><Text style={styles.primaryText}>Update Password</Text></>}</Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function SectionHeading({ icon, title, caption }) {
    return <View style={styles.sectionHeading}><View style={styles.sectionIcon}><Ionicons name={icon} size={21} color="#fff" /></View><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionCaption}>{caption}</Text></View></View>;
}

function PasswordField({ label, help, visible, ...props }) {
    return <View style={styles.passwordField}><Text style={styles.label}>{label}</Text><View style={styles.inputRow}><Ionicons name="lock-closed-outline" size={18} color="#888a93" /><TextInput style={styles.input} placeholder="••••••••••" placeholderTextColor="#65666e" secureTextEntry={!visible} maxLength={72} {...props} /></View>{help ? <Text style={styles.help}>{help}</Text> : null}</View>;
}

function Feedback({ error, success }) {
    if (!error && !success) return null;
    return <View style={[styles.feedback, success && styles.successFeedback]}><Ionicons name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={18} color={success ? '#62d7a2' : '#ff858c'} /><Text style={[styles.feedbackText, success && styles.successText]}>{success || error}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08080a' }, flex: { flex: 1 }, center: { flex: 1, backgroundColor: '#08080a', alignItems: 'center', justifyContent: 'center', padding: 30 }, header: { minHeight: 70, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#202127', flexDirection: 'row', alignItems: 'flex-end' }, closeButton: { width: 41, height: 41, borderRadius: 13, backgroundColor: '#1b1c21', alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, paddingHorizontal: 12 }, eyebrow: { color: '#ff4d57', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, heading: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 3 }, headerSpacer: { width: 41 }, scroll: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 17, paddingBottom: 45 },
    previewCard: { minHeight: 116, padding: 16, borderRadius: 16, backgroundColor: '#17181d', borderWidth: 1, borderColor: '#2a2b33', flexDirection: 'row', alignItems: 'center', gap: 15 }, previewCopy: { flex: 1 }, previewName: { color: '#fff', fontSize: 20, fontWeight: '900' }, previewEmail: { color: '#81838c', fontSize: 11, marginTop: 4 }, rolePill: { alignSelf: 'flex-start', marginTop: 9, borderRadius: 9, backgroundColor: '#163027', paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }, roleText: { color: '#8bd9b6', fontSize: 8, fontWeight: '900' }, adminRoleText: { color: '#b9afff' },
    sectionHeading: { marginTop: 25, marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 10 }, sectionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, sectionCopy: { flex: 1 }, sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '900' }, sectionCaption: { color: '#777982', fontSize: 10, lineHeight: 14, marginTop: 3 }, label: { color: '#d2d2d6', fontSize: 11, fontWeight: '800', marginTop: 14, marginBottom: 7 }, inputRow: { height: 49, borderRadius: 11, backgroundColor: '#191a1f', borderWidth: 1, borderColor: '#30313a', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, input: { flex: 1, height: '100%', color: '#fff', fontSize: 13 }, help: { color: '#686a73', fontSize: 9, marginTop: 5 },
    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, stickerOption: { width: '22.8%', minHeight: 83, borderRadius: 12, backgroundColor: '#15161b', borderWidth: 1, borderColor: '#292a31', alignItems: 'center', justifyContent: 'center', padding: 7 }, stickerSelected: { borderColor: '#e50914', backgroundColor: '#251316' }, stickerLabel: { color: '#767880', fontSize: 8, fontWeight: '700', marginTop: 6, maxWidth: '100%' }, stickerLabelSelected: { color: '#fff' }, check: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' },
    primaryButton: { height: 49, borderRadius: 10, backgroundColor: '#e50914', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }, passwordButton: { height: 49, borderRadius: 10, backgroundColor: '#4b3fd1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }, primaryText: { color: '#fff', fontSize: 13, fontWeight: '900' }, disabled: { opacity: 0.48 }, divider: { height: 1, backgroundColor: '#24252b', marginTop: 28 }, passwordField: { marginTop: 0 }, visibilityButton: { alignSelf: 'flex-start', height: 34, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }, visibilityText: { color: '#bbbcc2', fontSize: 10, fontWeight: '800' }, feedback: { marginTop: 12, padding: 11, borderRadius: 9, backgroundColor: '#291518', borderWidth: 1, borderColor: '#482126', flexDirection: 'row', alignItems: 'center', gap: 8 }, successFeedback: { backgroundColor: '#13251d', borderColor: '#214432' }, feedbackText: { flex: 1, color: '#ff858c', fontSize: 10, lineHeight: 15 }, successText: { color: '#72d9aa' }, lockIcon: { width: 75, height: 75, borderRadius: 23, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, deniedTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 16 }, doneButton: { marginTop: 18, borderRadius: 9, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 11 }, doneText: { color: '#000', fontWeight: '900' },
});
