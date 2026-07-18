import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MovieCard from '../components/MovieCard';
import { getMovies } from '../services/movies';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const runSearch = useCallback(async (value = '') => {
        setLoading(true); setError('');
        try { setResults(await getMovies({ search: value })); }
        catch (requestError) { setResults([]); setError(requestError.message); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { const timer = setTimeout(() => runSearch(query.trim()), query.trim() ? 350 : 0); return () => clearTimeout(timer); }, [query, runSearch]);
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <View style={styles.header}><Text style={styles.title}>Search Screenly</Text><View style={styles.searchBox}><Ionicons name="search" size={21} color="#aaa" /><TextInput value={query} onChangeText={setQuery} placeholder="Titles, cast, genres" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" />{query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={21} color="#aaa" /></Pressable> : null}</View>{error ? <Text style={styles.error}>{error}</Text> : null}<Text style={styles.resultsTitle}>{query ? `Results for “${query}”` : 'All Movies'}</Text></View>
            {loading ? <ActivityIndicator color="#e50914" style={styles.loader} /> : <FlatList data={results} keyExtractor={(item) => String(item.id)} numColumns={2} columnWrapperStyle={styles.gridRow} contentContainerStyle={styles.grid} renderItem={({ item }) => <MovieCard movie={item} showDetails />} ListEmptyComponent={<View style={styles.empty}><Ionicons name="search-outline" size={44} color="#555" /><Text style={styles.emptyText}>No matching movies</Text></View>} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' }, header: { paddingHorizontal: 16 }, title: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 8, marginBottom: 16 }, searchBox: { height: 50, borderRadius: 8, backgroundColor: '#242424', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10 }, input: { flex: 1, color: '#fff', fontSize: 15 }, error: { color: '#ff858c', fontSize: 12, marginTop: 12 }, resultsTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 22, marginBottom: 12 }, loader: { marginTop: 55 }, grid: { paddingHorizontal: 16, paddingBottom: 88, flexGrow: 1 }, gridRow: { justifyContent: 'space-between' }, empty: { alignItems: 'center', paddingTop: 60 }, emptyText: { color: '#888', marginTop: 10 },
});
