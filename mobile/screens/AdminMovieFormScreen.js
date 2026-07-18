import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMovie, getMovie, updateMovie } from '../services/movies';
import { deleteAdminImage, getAdminCategories, uploadAdminImage } from '../services/admin';
import { resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryManagerModal, { CategoryPickerModal } from '../components/CategoryManagerModal';

const EMPTY_MOVIE = {
    title: '', description: '', category: '', genres: '', posterUrl: '', backdropUrl: '', youtubeUrl: '', actors: '', director: '', releaseYear: '', duration: '', maturityRating: 'PG', language: 'English', sortOrder: '0', featured: false, published: true,
};
export default function AdminMovieFormScreen() {
    const { id } = useLocalSearchParams();
    const movieId = Array.isArray(id) ? id[0] : id;
    const editing = Boolean(movieId);
    const [form, setForm] = useState(EMPTY_MOVIE);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
    const [error, setError] = useState('');
    const pendingUploads = useRef(new Set());
    const saved = useRef(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!editing || user?.role !== 'admin') return;
        getMovie(movieId).then(({ movie }) => setForm({
            title: movie.title || '', description: movie.description || '', category: movie.category || '', genres: (movie.genres || []).join(', '), posterUrl: movie.posterPath || movie.posterUrl || '', backdropUrl: movie.backdropPath || movie.backdropUrl || '', youtubeUrl: movie.youtubeUrl || movie.youtubeVideoId || '', actors: (movie.actors || []).join(', '), director: movie.director || '', releaseYear: movie.releaseYear ? String(movie.releaseYear) : '', duration: movie.duration || '', maturityRating: movie.maturityRating || 'PG', language: movie.language || 'English', sortOrder: String(movie.sortOrder || 0), featured: Boolean(movie.featured), published: movie.published !== false,
        })).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
    }, [editing, movieId, user?.role]);

    useEffect(() => {
        if (user?.role === 'admin') getAdminCategories().then(setCategories).catch(() => {});
    }, [user?.role]);

    useEffect(() => () => {
        if (!saved.current) pendingUploads.current.forEach((path) => { deleteAdminImage(path); });
    }, []);

    const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const pickImage = async (field) => {
        setError('');
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setError('Allow Screenly to access your photos, then try again.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: field === 'posterUrl' ? [2, 3] : [16, 9], quality: 0.88 });
        if (result.canceled || !result.assets?.[0]) return;
        setUploadingField(field);
        try {
            const path = await uploadAdminImage(result.assets[0]);
            const previous = form[field];
            if (pendingUploads.current.has(previous)) { pendingUploads.current.delete(previous); deleteAdminImage(previous); }
            pendingUploads.current.add(path);
            change(field, path);
        } catch (requestError) { setError(requestError.message); }
        finally { setUploadingField(''); }
    };
    const removeImage = (field) => {
        const value = form[field];
        if (pendingUploads.current.has(value)) { pendingUploads.current.delete(value); deleteAdminImage(value); }
        change(field, '');
    };
    const submit = async () => {
        if (uploadingField) { setError('Wait for the image to finish uploading.'); return; }
        if (!form.title.trim() || !form.description.trim() || !form.category.trim() || !form.posterUrl.trim() || !form.youtubeUrl.trim()) { setError('Add a title, description, category, poster image, and YouTube link.'); return; }
        setSaving(true); setError('');
        try {
            if (editing) await updateMovie(movieId, form); else await createMovie(form);
            saved.current = true;
            pendingUploads.current.clear();
            router.back();
        } catch (requestError) { setError(requestError.message); }
        finally { setSaving(false); }
    };

    if (authLoading || loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914" /></View>;
    if (user?.role !== 'admin') return <SafeAreaView style={styles.center}><Ionicons name="shield-outline" size={50} color="#666" /><Text style={styles.denied}>Administrator access required</Text><Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Go Back</Text></Pressable></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="close" size={25} color="#fff" /></Pressable><View style={styles.headingWrap}><Text style={styles.eyebrow}>ADMIN STUDIO</Text><Text style={styles.heading}>{editing ? 'Edit Movie' : 'Add Movie'}</Text></View><Pressable style={[styles.saveTop, saving && styles.disabled]} disabled={saving} onPress={submit}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTopText}>Save</Text>}</Pressable></View>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Artwork & playback</Text>
                    <View style={styles.artworkRow}>
                        <ArtworkPicker label="Movie poster *" value={form.posterUrl} aspect="poster" uploading={uploadingField === 'posterUrl'} onPick={() => pickImage('posterUrl')} onRemove={() => removeImage('posterUrl')} />
                        <ArtworkPicker label="Backdrop" value={form.backdropUrl} aspect="backdrop" uploading={uploadingField === 'backdropUrl'} onPick={() => pickImage('backdropUrl')} onRemove={() => removeImage('backdropUrl')} />
                    </View>
                    <Text style={styles.artworkHelp}>Choose images from your phone. JPG, PNG, and WebP files up to 8 MB are supported.</Text>
                    <Field label="YouTube link or iframe code *" value={form.youtubeUrl} onChangeText={(value) => change('youtubeUrl', value)} placeholder={'Paste a YouTube URL or <iframe ...></iframe>'} autoCapitalize="none" help="You can paste the complete YouTube embed code. Screenly safely extracts the video automatically." />

                    <Text style={styles.sectionTitle}>Movie information</Text>
                    <Field label="Movie name *" value={form.title} onChangeText={(value) => change('title', value)} placeholder="Movie title" maxLength={140} />
                    <Field label="Description *" value={form.description} onChangeText={(value) => change('description', value)} placeholder="A Netflix-style synopsis" multiline maxLength={5000} />
                    <View style={styles.field}><Text style={styles.label}>Category *</Text><Pressable style={styles.categorySelect} onPress={() => setCategoryPickerOpen(true)}><View style={styles.categorySelectIcon}><Ionicons name="grid-outline" size={19} color="#fff" /></View><View style={styles.categorySelectCopy}><Text style={[styles.categorySelectValue, !form.category && styles.categoryPlaceholder]}>{form.category || 'Choose a category'}</Text><Text style={styles.categorySelectHint}>{categories.length} categories available</Text></View><Ionicons name="chevron-down" size={20} color="#888" /></Pressable></View>
                    <Field label="Genres" value={form.genres} onChangeText={(value) => change('genres', value)} placeholder="Crime, Mystery, Drama" help="Separate multiple genres with commas." />
                    <Field label="Actors" value={form.actors} onChangeText={(value) => change('actors', value)} placeholder="Actor One, Actor Two" help="Separate cast members with commas." />
                    <Field label="Director" value={form.director} onChangeText={(value) => change('director', value)} placeholder="Director name" maxLength={120} />

                    <View style={styles.twoColumns}><View style={styles.column}><Field label="Release year" value={form.releaseYear} onChangeText={(value) => change('releaseYear', value)} placeholder="2026" keyboardType="number-pad" maxLength={4} /></View><View style={styles.column}><Field label="Duration" value={form.duration} onChangeText={(value) => change('duration', value)} placeholder="1h 58m" maxLength={30} /></View></View>
                    <View style={styles.twoColumns}><View style={styles.column}><Field label="Maturity rating" value={form.maturityRating} onChangeText={(value) => change('maturityRating', value)} placeholder="PG-13" maxLength={20} /></View><View style={styles.column}><Field label="Language" value={form.language} onChangeText={(value) => change('language', value)} placeholder="English" maxLength={50} /></View></View>
                    <Field label="Display order" value={form.sortOrder} onChangeText={(value) => change('sortOrder', value)} placeholder="0" keyboardType="number-pad" help="Lower numbers appear first inside a category." />

                    <Text style={styles.sectionTitle}>Availability</Text>
                    <ToggleRow title="Show in Home hero" subtitle="Featured movies rotate in the large Home banner and also appear in the Featured row." value={form.featured} onValueChange={(value) => change('featured', value)} />
                    <ToggleRow title="Published" subtitle="Turn off to keep the movie as an admin-only draft." value={form.published} onValueChange={(value) => change('published', value)} />
                    {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={19} color="#ff858c" /><Text style={styles.error}>{error}</Text></View> : null}
                    <Pressable style={[styles.submit, saving && styles.disabled]} disabled={saving} onPress={submit}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={21} color="#fff" /><Text style={styles.submitText}>{editing ? 'Save Changes' : 'Add to Screenly'}</Text></>}</Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
            <CategoryPickerModal visible={categoryPickerOpen} categories={categories} value={form.category} onClose={() => setCategoryPickerOpen(false)} onSelect={(value) => change('category', value)} onManage={() => setCategoryManagerOpen(true)} />
            <CategoryManagerModal visible={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} onChanged={setCategories} />
        </SafeAreaView>
    );
}

function Field({ label, help, multiline, ...props }) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.textarea]} placeholderTextColor="#686868" multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} {...props} />{help ? <Text style={styles.help}>{help}</Text> : null}</View>;
}
function ToggleRow({ title, subtitle, value, onValueChange }) {
    return <View style={styles.toggleRow}><View style={styles.toggleCopy}><Text style={styles.toggleTitle}>{title}</Text><Text style={styles.toggleSubtitle}>{subtitle}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#333', true: '#7f050b' }} thumbColor={value ? '#e50914' : '#aaa'} /></View>;
}
function ArtworkPicker({ label, value, aspect, uploading, onPick, onRemove }) {
    return <View style={styles.artworkField}><Text style={styles.label}>{label}</Text><Pressable style={[styles.artworkPicker, aspect === 'poster' ? styles.posterPicker : styles.backdropPicker]} onPress={onPick}>{value ? <Image source={resolveMediaUrl(value)} style={styles.artworkImage} contentFit="cover" /> : <View style={styles.artworkEmpty}><View style={styles.galleryIcon}><Ionicons name="images-outline" size={24} color="#fff" /></View><Text style={styles.artworkEmptyTitle}>Choose photo</Text><Text style={styles.artworkEmptyText}>From your gallery</Text></View>}{uploading ? <View style={styles.uploading}><ActivityIndicator color="#fff" /><Text style={styles.uploadingText}>Uploading…</Text></View> : null}</Pressable>{value && !uploading ? <View style={styles.artworkActions}><Pressable style={styles.changePhoto} onPress={onPick}><Ionicons name="images-outline" size={16} color="#ddd" /><Text style={styles.changePhotoText}>Change</Text></Pressable><Pressable style={styles.removePhoto} onPress={onRemove}><Ionicons name="trash-outline" size={16} color="#ff7a81" /></Pressable></View> : null}</View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' }, flex: { flex: 1 }, center: { flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center', padding: 30 }, denied: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 16 }, backButton: { backgroundColor: '#fff', borderRadius: 5, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20 }, backText: { color: '#000', fontWeight: '900' },
    header: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' }, iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center' }, headingWrap: { flex: 1, paddingHorizontal: 12 }, eyebrow: { color: '#e50914', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, heading: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 }, saveTop: { minWidth: 64, height: 38, borderRadius: 6, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, saveTopText: { color: '#fff', fontWeight: '900' },
    scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 50 }, sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 25, marginBottom: 2 },
    artworkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 5 }, artworkField: { flex: 1 }, artworkPicker: { width: '100%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#191a20', borderWidth: 1, borderColor: '#343640' }, posterPicker: { aspectRatio: 2 / 3 }, backdropPicker: { aspectRatio: 16 / 9 }, artworkImage: { width: '100%', height: '100%' }, artworkEmpty: { flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center', padding: 10 }, galleryIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, artworkEmptyTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 9 }, artworkEmptyText: { color: '#777', fontSize: 9, marginTop: 3 }, uploading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', gap: 8 }, uploadingText: { color: '#fff', fontSize: 11, fontWeight: '800' }, artworkActions: { flexDirection: 'row', gap: 7, marginTop: 7 }, changePhoto: { flex: 1, height: 34, borderRadius: 7, backgroundColor: '#272830', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, changePhotoText: { color: '#ddd', fontSize: 10, fontWeight: '800' }, removePhoto: { width: 36, height: 34, borderRadius: 7, backgroundColor: '#32181c', alignItems: 'center', justifyContent: 'center' }, artworkHelp: { color: '#6d6f79', fontSize: 10, lineHeight: 15, marginTop: 10 },
    field: { marginTop: 14 }, label: { color: '#ccc', fontSize: 12, fontWeight: '800', marginBottom: 7 }, input: { minHeight: 48, borderRadius: 7, backgroundColor: '#202020', borderWidth: 1, borderColor: '#343434', color: '#fff', paddingHorizontal: 13, fontSize: 14 }, textarea: { minHeight: 125, paddingTop: 13, paddingBottom: 13 }, help: { color: '#666', fontSize: 10, lineHeight: 15, marginTop: 5 },
    categorySelect: { minHeight: 58, borderRadius: 9, backgroundColor: '#202020', borderWidth: 1, borderColor: '#343434', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, categorySelectIcon: { width: 37, height: 37, borderRadius: 10, backgroundColor: '#e50914', alignItems: 'center', justifyContent: 'center' }, categorySelectCopy: { flex: 1 }, categorySelectValue: { color: '#fff', fontSize: 13, fontWeight: '900' }, categoryPlaceholder: { color: '#888' }, categorySelectHint: { color: '#666', fontSize: 9, marginTop: 3 },
    twoColumns: { flexDirection: 'row', gap: 11 }, column: { flex: 1 }, toggleRow: { minHeight: 72, marginTop: 11, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#171717', borderWidth: 1, borderColor: '#292929', flexDirection: 'row', alignItems: 'center' }, toggleCopy: { flex: 1, paddingRight: 10 }, toggleTitle: { color: '#fff', fontSize: 14, fontWeight: '900' }, toggleSubtitle: { color: '#777', fontSize: 10, lineHeight: 15, marginTop: 3 },
    errorBox: { marginTop: 18, padding: 13, borderRadius: 7, backgroundColor: '#251214', flexDirection: 'row', alignItems: 'center', gap: 9 }, error: { color: '#ff858c', fontSize: 12, lineHeight: 17, flex: 1 }, submit: { height: 52, borderRadius: 7, marginTop: 20, backgroundColor: '#e50914', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, submitText: { color: '#fff', fontSize: 15, fontWeight: '900' }, disabled: { opacity: 0.6 },
});
