import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteAdminUser, getAdminStats, getAdminUsers, updateAdminUser } from '../services/admin';
import { deleteMovie, getMovies } from '../services/movies';
import { useAuth } from '../context/AuthContext';
import CategoryManagerModal from '../components/CategoryManagerModal';

const TABS = [
    { id: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { id: 'movies', label: 'Movies', icon: 'film-outline' },
    { id: 'members', label: 'Members', icon: 'people-outline' },
];

export default function AdminMoviesScreen() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [movies, setMovies] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [movieQuery, setMovieQuery] = useState('');
    const [movieFilter, setMovieFilter] = useState('all');
    const [memberQuery, setMemberQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
    const router = useRouter();

    const load = useCallback(async (quiet = false) => {
        if (user?.role !== 'admin') { setLoading(false); return; }
        if (!quiet) setLoading(true);
        try {
            const [nextStats, nextMovies, nextMembers] = await Promise.all([getAdminStats(), getMovies({ includeUnpublished: true }), getAdminUsers()]);
            setStats(nextStats); setMovies(nextMovies); setMembers(nextMembers);
        } catch (requestError) {
            Alert.alert('Couldn’t refresh Admin Console', requestError.message);
        } finally { setLoading(false); setRefreshing(false); }
    }, [user?.role]);
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const filteredMovies = useMemo(() => movies.filter((movie) => {
        const matchesQuery = !movieQuery.trim() || `${movie.title} ${movie.category}`.toLowerCase().includes(movieQuery.trim().toLowerCase());
        const matchesFilter = movieFilter === 'all' || (movieFilter === 'published' ? movie.published : !movie.published);
        return matchesQuery && matchesFilter;
    }), [movies, movieQuery, movieFilter]);
    const filteredMembers = useMemo(() => members.filter((member) => !memberQuery.trim() || `${member.name} ${member.email}`.toLowerCase().includes(memberQuery.trim().toLowerCase())), [members, memberQuery]);

    const removeMovie = (movie) => Alert.alert('Remove this movie?', `${movie.title} will disappear from Screenly and cannot be restored.`, [
        { text: 'Keep Movie', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => { try { await deleteMovie(movie.id); setMovies((items) => items.filter((item) => item.id !== movie.id)); load(true); } catch (error) { Alert.alert('Movie not removed', error.message); } } },
    ]);
    const changeMember = async (updates) => {
        if (!selectedMember) return;
        try {
            const updated = await updateAdminUser(selectedMember.id, updates);
            setMembers((items) => items.map((item) => item.id === updated.id ? updated : item));
            setSelectedMember(null); load(true);
        } catch (error) { Alert.alert('Member not updated', error.message); }
    };
    const removeMember = () => {
        const member = selectedMember;
        setSelectedMember(null);
        if (!member) return;
        Alert.alert('Remove this member?', `${member.name} will lose their Screenly account and saved access.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove Member', style: 'destructive', onPress: async () => { try { await deleteAdminUser(member.id); setMembers((items) => items.filter((item) => item.id !== member.id)); load(true); } catch (error) { Alert.alert('Member not removed', error.message); } } },
        ]);
    };

    if (authLoading || loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ff3b47" /><Text style={styles.loadingText}>Preparing your workspace…</Text></View>;
    if (user?.role !== 'admin') return <SafeAreaView style={styles.center}><View style={styles.deniedIcon}><Ionicons name="lock-closed" size={31} color="#fff" /></View><Text style={styles.deniedTitle}>This space is for administrators</Text><Text style={styles.deniedText}>Use an administrator profile to open Screenly Console.</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#08090c" />
            <View style={styles.header}>
                <View><Text style={styles.product}>SCREENLY CONSOLE</Text><Text style={styles.heading}>Good to see you, {user.name?.split(' ')[0]}</Text></View>
                <Pressable style={styles.addButton} onPress={() => router.push('/admin-movie')}><Ionicons name="add" size={25} color="#fff" /></Pressable>
            </View>
            <View style={styles.tabs}>{TABS.map((tab) => <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, activeTab === tab.id && styles.tabActive]}><Ionicons name={tab.icon} size={17} color={activeTab === tab.id ? '#fff' : '#747783'} /><Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text></Pressable>)}</View>

            {activeTab === 'overview' ? <Overview stats={stats} onRefresh={() => { setRefreshing(true); load(true); }} refreshing={refreshing} onAdd={() => router.push('/admin-movie')} onMovies={() => setActiveTab('movies')} onMembers={() => setActiveTab('members')} /> : null}
            {activeTab === 'movies' ? <Movies movies={filteredMovies} query={movieQuery} setQuery={setMovieQuery} filter={movieFilter} setFilter={setMovieFilter} onAdd={() => router.push('/admin-movie')} onCategories={() => setCategoryManagerOpen(true)} onEdit={(movie) => router.push({ pathname: '/admin-movie', params: { id: String(movie.id) } })} onDelete={removeMovie} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} /> : null}
            {activeTab === 'members' ? <Members members={filteredMembers} currentUserId={user.id} query={memberQuery} setQuery={setMemberQuery} onSelect={setSelectedMember} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} /> : null}
            <MemberSheet member={selectedMember} isSelf={selectedMember?.id === user.id} onClose={() => setSelectedMember(null)} onSuspend={() => changeMember({ suspended: !selectedMember.suspended })} onRole={() => changeMember({ role: selectedMember.role === 'admin' ? 'user' : 'admin' })} onDelete={removeMember} />
            <CategoryManagerModal visible={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />
        </SafeAreaView>
    );
}

function Overview({ stats, refreshing, onRefresh, onAdd, onMovies, onMembers }) {
    const summary = stats?.summary || {};
    const maxCategory = Math.max(1, ...(stats?.categories || []).map((item) => item.count));
    return (
        <ScrollView style={styles.flex} contentContainerStyle={styles.overview} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#ff3b47" onRefresh={onRefresh} />}>
            <View style={styles.heroCard}><View><Text style={styles.heroLabel}>THIS WEEK</Text><Text style={styles.heroValue}>{summary.playsLast7Days || 0} plays</Text><Text style={styles.heroCaption}>{summary.newUsers || 0} new member{summary.newUsers === 1 ? '' : 's'} joined</Text></View><View style={styles.heroIcon}><Ionicons name="trending-up" size={31} color="#fff" /></View></View>
            <View style={styles.statGrid}>
                <StatCard icon="film" label="Movies" value={summary.totalMovies || 0} tint="#ff4e58" />
                <StatCard icon="people" label="Members" value={summary.totalUsers || 0} tint="#7c6cff" />
                <StatCard icon="play" label="Total plays" value={summary.totalPlays || 0} tint="#35c58a" />
                <StatCard icon="sparkles" label="Featured" value={summary.featuredMovies || 0} tint="#f5ad42" />
            </View>
            <SectionTitle title="Quick actions" />
            <View style={styles.quickGrid}><QuickAction icon="add-circle" title="Add movie" caption="Publish something new" onPress={onAdd} /><QuickAction icon="albums" title="Catalog" caption="Edit titles and drafts" onPress={onMovies} /><QuickAction icon="people" title="Members" caption="Roles and account access" onPress={onMembers} /></View>
            <SectionTitle title="Catalog health" />
            <View style={styles.panel}><ProgressRow label="Published" value={summary.publishedMovies || 0} total={summary.totalMovies || 0} color="#35c58a" /><ProgressRow label="Drafts" value={summary.draftMovies || 0} total={summary.totalMovies || 0} color="#f5ad42" /><ProgressRow label="Featured" value={summary.featuredMovies || 0} total={summary.totalMovies || 0} color="#ff4e58" /></View>
            <SectionTitle title="Categories" />
            <View style={styles.panel}>{stats?.categories?.length ? stats.categories.map((category) => <View key={category.name} style={styles.categoryRow}><View style={styles.categoryHeader}><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryCount}>{category.count}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(8, category.count / maxCategory * 100)}%` }]} /></View></View>) : <EmptyPanel icon="pie-chart-outline" text="Category insights appear after movies are added." />}</View>
            <SectionTitle title="Most played" />
            <View style={styles.panel}>{stats?.topMovies?.length ? stats.topMovies.map((movie, index) => <View key={movie.id} style={styles.topRow}><Text style={styles.rank}>{index + 1}</Text><View style={styles.topCopy}><Text style={styles.topTitle} numberOfLines={1}>{movie.title}</Text><Text style={styles.topCategory}>{movie.category}</Text></View><Text style={styles.playCount}>{movie.playCount || 0} plays</Text></View>) : <EmptyPanel icon="play-circle-outline" text="Play insights will appear as members watch movies." />}</View>
        </ScrollView>
    );
}

function Movies({ movies, query, setQuery, filter, setFilter, onAdd, onCategories, onEdit, onDelete, refreshing, onRefresh }) {
    return <FlatList style={styles.flex} data={movies} keyExtractor={(item) => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#ff3b47" onRefresh={onRefresh} />} contentContainerStyle={[styles.list, !movies.length && styles.grow]} ListHeaderComponent={<><View style={styles.catalogTools}><View><Text style={styles.catalogToolsTitle}>Catalog structure</Text><Text style={styles.catalogToolsText}>Organize movies your way</Text></View><View style={styles.catalogButtons}><Pressable style={styles.categoriesButton} onPress={onCategories}><Ionicons name="grid-outline" size={17} color="#ddd" /><Text style={styles.categoriesButtonText}>Categories</Text></Pressable><Pressable style={styles.newMovie} onPress={onAdd}><Ionicons name="add" size={17} color="#fff" /><Text style={styles.newMovieText}>New</Text></Pressable></View></View><View style={styles.searchBox}><Ionicons name="search" size={19} color="#777" /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Find a movie" placeholderTextColor="#666" />{query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color="#777" /></Pressable> : null}</View><View style={styles.filterRow}>{['all', 'published', 'drafts'].map((item) => <Pressable key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View></>} renderItem={({ item }) => <View style={styles.movieRow}><Pressable style={styles.movieMain} onPress={() => onEdit(item)}><View style={styles.posterWrap}>{item.posterUrl ? <Image source={item.posterUrl} style={styles.poster} contentFit="cover" /> : <Ionicons name="film-outline" size={27} color="#ff4e58" />}</View><View style={styles.movieInfo}><View style={styles.badges}><Text style={[styles.badge, item.published ? styles.liveBadge : styles.draftBadge]}>{item.published ? 'LIVE' : 'DRAFT'}</Text>{item.featured ? <Text style={[styles.badge, styles.featuredBadge]}>FEATURED</Text> : null}</View><Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.movieMeta}>{item.category || 'No category'} · {item.playCount || 0} plays</Text></View></Pressable><View style={styles.movieActions}><Pressable hitSlop={10} onPress={() => onEdit(item)}><Ionicons name="create-outline" size={22} color="#c8c9cf" /></Pressable><Pressable hitSlop={10} onPress={() => onDelete(item)}><Ionicons name="trash-outline" size={21} color="#ff6d75" /></Pressable></View></View>} ListEmptyComponent={<EmptyState icon="film-outline" title="No movies found" text="Try another search or add a new movie to your catalog." action="Add Movie" onPress={onAdd} />} />;
}

function Members({ members, currentUserId, query, setQuery, onSelect, refreshing, onRefresh }) {
    return <FlatList style={styles.flex} data={members} keyExtractor={(item) => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#ff3b47" onRefresh={onRefresh} />} contentContainerStyle={[styles.list, !members.length && styles.grow]} ListHeaderComponent={<View style={styles.searchBox}><Ionicons name="search" size={19} color="#777" /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search members" placeholderTextColor="#666" />{query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color="#777" /></Pressable> : null}</View>} renderItem={({ item }) => { const isSelf = item.id === currentUserId; return <Pressable style={styles.memberRow} onPress={() => onSelect(item)}><View style={[styles.memberAvatar, item.role === 'admin' && styles.adminAvatar]}><Text style={styles.memberInitial}>{item.name?.[0]?.toUpperCase() || '?'}</Text></View><View style={styles.memberInfo}><View style={styles.memberNameRow}><Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>{isSelf ? <Text style={styles.youBadge}>YOU</Text> : null}</View><Text style={styles.memberEmail} numberOfLines={1}>{item.email}</Text><Text style={styles.memberSince}>{item.lastLoginAt ? `Last active ${formatDate(item.lastLoginAt)}` : `Joined ${formatDate(item.createdAt)}`}</Text></View><View style={styles.memberRight}><Text style={[styles.roleBadge, item.role === 'admin' && styles.adminRole]}>{item.role === 'admin' ? 'Admin' : 'Member'}</Text>{item.suspended ? <Text style={styles.suspended}>Paused</Text> : <Text style={styles.active}>Active</Text>}</View><Ionicons name="chevron-forward" size={18} color="#555" /></Pressable>; }} ListEmptyComponent={<EmptyState icon="people-outline" title="No members found" text="Try another name or email address." />} />;
}

function MemberSheet({ member, isSelf, onClose, onSuspend, onRole, onDelete }) {
    return <Modal visible={Boolean(member)} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.modalShade} onPress={onClose}><Pressable style={styles.sheet} onPress={() => {}}><View style={styles.sheetHandle} /><View style={styles.sheetIdentity}><View style={styles.sheetAvatar}><Text style={styles.sheetInitial}>{member?.name?.[0]?.toUpperCase()}</Text></View><View style={styles.sheetCopy}><Text style={styles.sheetName}>{member?.name}</Text><Text style={styles.sheetEmail}>{member?.email}</Text></View></View>{isSelf ? <View style={styles.selfNotice}><Ionicons name="shield-checkmark" size={20} color="#8f83ff" /><Text style={styles.selfText}>This is your account. Personal administrator access can’t be changed here.</Text></View> : <><SheetAction icon={member?.suspended ? 'play-circle-outline' : 'pause-circle-outline'} title={member?.suspended ? 'Restore account' : 'Pause account'} caption={member?.suspended ? 'Allow this member to sign in again' : 'Temporarily block sign-in on every device'} onPress={onSuspend} /><SheetAction icon={member?.role === 'admin' ? 'person-outline' : 'shield-checkmark-outline'} title={member?.role === 'admin' ? 'Change to member' : 'Make administrator'} caption={member?.role === 'admin' ? 'Remove catalog management access' : 'Allow access to Screenly Console'} onPress={onRole} /><SheetAction icon="trash-outline" title="Remove member" caption="Permanently delete this Screenly account" danger onPress={onDelete} /></>}<Pressable style={styles.sheetClose} onPress={onClose}><Text style={styles.sheetCloseText}>Done</Text></Pressable></Pressable></Pressable></Modal>;
}

function StatCard({ icon, label, value, tint }) { return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: `${tint}22` }]}><Ionicons name={icon} size={21} color={tint} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function QuickAction({ icon, title, caption, onPress }) { return <Pressable style={styles.quickAction} onPress={onPress}><View style={styles.quickIcon}><Ionicons name={icon} size={23} color="#fff" /></View><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickCaption}>{caption}</Text></Pressable>; }
function ProgressRow({ label, value, total, color }) { const width = total ? Math.max(3, value / total * 100) : 0; return <View style={styles.progressRow}><View style={styles.progressHeader}><Text style={styles.progressLabel}>{label}</Text><Text style={styles.progressValue}>{value}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${width}%`, backgroundColor: color }]} /></View></View>; }
function SectionTitle({ title }) { return <Text style={styles.sectionTitle}>{title}</Text>; }
function EmptyPanel({ icon, text }) { return <View style={styles.emptyPanel}><Ionicons name={icon} size={28} color="#565966" /><Text style={styles.emptyPanelText}>{text}</Text></View>; }
function EmptyState({ icon, title, text, action, onPress }) { return <View style={styles.emptyState}><View style={styles.emptyStateIcon}><Ionicons name={icon} size={34} color="#888" /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text>{action ? <Pressable style={styles.emptyAction} onPress={onPress}><Text style={styles.emptyActionText}>{action}</Text></Pressable> : null}</View>; }
function SheetAction({ icon, title, caption, danger, onPress }) { return <Pressable style={styles.sheetAction} onPress={onPress}><View style={[styles.sheetActionIcon, danger && styles.dangerIcon]}><Ionicons name={icon} size={22} color={danger ? '#ff6d75' : '#c9c9d0'} /></View><View style={styles.sheetActionCopy}><Text style={[styles.sheetActionTitle, danger && styles.dangerText]}>{title}</Text><Text style={styles.sheetActionCaption}>{caption}</Text></View><Ionicons name="chevron-forward" size={18} color="#555" /></Pressable>; }
function formatDate(value) { if (!value) return 'recently'; return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }); }

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08090c' }, flex: { flex: 1 }, grow: { flexGrow: 1 }, center: { flex: 1, backgroundColor: '#08090c', alignItems: 'center', justifyContent: 'center', padding: 30 }, loadingText: { color: '#858792', marginTop: 14, fontSize: 13 },
    header: { minHeight: 82, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, product: { color: '#ff4e58', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 }, heading: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 4 }, addButton: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#ff3b47', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff3b47', shadowOpacity: 0.25, shadowRadius: 12 },
    tabs: { height: 49, marginHorizontal: 16, padding: 4, borderRadius: 12, backgroundColor: '#121318', flexDirection: 'row', gap: 3 }, tab: { flex: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, tabActive: { backgroundColor: '#292b34' }, tabText: { color: '#747783', fontSize: 11, fontWeight: '800' }, tabTextActive: { color: '#fff' },
    overview: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }, heroCard: { minHeight: 128, padding: 20, borderRadius: 16, backgroundColor: '#482cf5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }, heroLabel: { color: '#cfc9ff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, heroValue: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4 }, heroCaption: { color: '#d7d3ff', fontSize: 12, marginTop: 5 }, heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 11 }, statCard: { width: '48.5%', minHeight: 128, borderRadius: 14, backgroundColor: '#14151a', borderWidth: 1, borderColor: '#24262e', padding: 15 }, statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, statValue: { color: '#fff', fontSize: 25, fontWeight: '900', marginTop: 10 }, statLabel: { color: '#7f818c', fontSize: 11, marginTop: 2 }, sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 25, marginBottom: 11 },
    quickGrid: { flexDirection: 'row', gap: 9 }, quickAction: { flex: 1, minHeight: 132, backgroundColor: '#14151a', borderRadius: 13, borderWidth: 1, borderColor: '#24262e', padding: 12 }, quickIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#292b34', alignItems: 'center', justifyContent: 'center' }, quickTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 11 }, quickCaption: { color: '#70727c', fontSize: 9, lineHeight: 13, marginTop: 3 },
    panel: { backgroundColor: '#14151a', borderRadius: 14, borderWidth: 1, borderColor: '#24262e', padding: 15 }, progressRow: { marginBottom: 14 }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, progressLabel: { color: '#c7c8cd', fontSize: 12, fontWeight: '700' }, progressValue: { color: '#fff', fontSize: 12, fontWeight: '900' }, progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#292b31', overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 3 }, categoryRow: { marginBottom: 15 }, categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, categoryName: { color: '#c7c8cd', fontSize: 12 }, categoryCount: { color: '#7e818c', fontSize: 11 }, barTrack: { height: 7, borderRadius: 4, backgroundColor: '#292b31', overflow: 'hidden' }, barFill: { height: '100%', borderRadius: 4, backgroundColor: '#7565ff' },
    topRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#24262e' }, rank: { width: 30, color: '#686b76', fontSize: 17, fontWeight: '900' }, topCopy: { flex: 1 }, topTitle: { color: '#fff', fontSize: 13, fontWeight: '800' }, topCategory: { color: '#686b76', fontSize: 10, marginTop: 3 }, playCount: { color: '#35c58a', fontSize: 11, fontWeight: '800' }, emptyPanel: { minHeight: 100, alignItems: 'center', justifyContent: 'center', padding: 12 }, emptyPanelText: { color: '#696c77', textAlign: 'center', fontSize: 11, marginTop: 8, lineHeight: 16 },
    list: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 100 }, catalogTools: { minHeight: 72, borderRadius: 13, backgroundColor: '#17181d', borderWidth: 1, borderColor: '#292b33', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, catalogToolsTitle: { color: '#fff', fontSize: 13, fontWeight: '900' }, catalogToolsText: { color: '#6f727c', fontSize: 9, marginTop: 3 }, catalogButtons: { flexDirection: 'row', gap: 7 }, categoriesButton: { height: 35, borderRadius: 8, backgroundColor: '#292b33', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, categoriesButtonText: { color: '#ddd', fontSize: 9, fontWeight: '900' }, searchBox: { height: 48, borderRadius: 12, backgroundColor: '#15161b', borderWidth: 1, borderColor: '#292b33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9, marginBottom: 12 }, searchInput: { flex: 1, color: '#fff', fontSize: 13 }, filterRow: { flexDirection: 'row', gap: 7, marginBottom: 13 }, filterChip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#30323b', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, filterChipActive: { backgroundColor: '#32343e', borderColor: '#454853' }, filterText: { color: '#777a85', fontSize: 10, fontWeight: '800' }, filterTextActive: { color: '#fff' }, newMovie: { height: 35, borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#ff3b47', flexDirection: 'row', alignItems: 'center', gap: 3 }, newMovieText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    movieRow: { minHeight: 128, flexDirection: 'row', alignItems: 'center', backgroundColor: '#121318', borderRadius: 13, borderWidth: 1, borderColor: '#22242b', padding: 11, marginBottom: 9 }, movieMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, posterWrap: { width: 65, height: 98, borderRadius: 7, overflow: 'hidden', backgroundColor: '#202127', alignItems: 'center', justifyContent: 'center' }, poster: { width: '100%', height: '100%' }, movieInfo: { flex: 1 }, badges: { flexDirection: 'row', gap: 5 }, badge: { fontSize: 7, fontWeight: '900', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3 }, liveBadge: { color: '#55dca5', backgroundColor: '#153328' }, draftBadge: { color: '#f7c567', backgroundColor: '#382d17' }, featuredBadge: { color: '#ff9da2', backgroundColor: '#3a1b20' }, movieTitle: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 7 }, movieMeta: { color: '#71737e', fontSize: 10, marginTop: 6 }, movieActions: { width: 32, height: 86, alignItems: 'center', justifyContent: 'space-around' },
    memberRow: { minHeight: 91, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#22242b' }, memberAvatar: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' }, adminAvatar: { backgroundColor: '#5a48e8' }, memberInitial: { color: '#fff', fontSize: 18, fontWeight: '900' }, memberInfo: { flex: 1 }, memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, memberName: { color: '#fff', fontSize: 13, fontWeight: '900', maxWidth: '80%' }, youBadge: { color: '#a69dff', fontSize: 7, fontWeight: '900', backgroundColor: '#282340', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }, memberEmail: { color: '#777984', fontSize: 10, marginTop: 3 }, memberSince: { color: '#555863', fontSize: 9, marginTop: 5 }, memberRight: { alignItems: 'flex-end', gap: 5 }, roleBadge: { color: '#aaa', fontSize: 8, fontWeight: '900', backgroundColor: '#22242b', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }, adminRole: { color: '#b1a9ff', backgroundColor: '#292443' }, active: { color: '#49d79f', fontSize: 8, fontWeight: '800' }, suspended: { color: '#ff7078', fontSize: 8, fontWeight: '800' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 430, paddingHorizontal: 30 }, emptyStateIcon: { width: 76, height: 76, borderRadius: 23, backgroundColor: '#18191f', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 17 }, emptyText: { color: '#777984', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 }, emptyAction: { backgroundColor: '#ff3b47', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 }, emptyActionText: { color: '#fff', fontWeight: '900' },
    modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#15161b', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28 }, sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#3b3d46', alignSelf: 'center' }, sheetIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: '#282a32' }, sheetAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#5a48e8', alignItems: 'center', justifyContent: 'center' }, sheetInitial: { color: '#fff', fontSize: 21, fontWeight: '900' }, sheetCopy: { flex: 1 }, sheetName: { color: '#fff', fontSize: 17, fontWeight: '900' }, sheetEmail: { color: '#7a7d88', fontSize: 11, marginTop: 4 }, selfNotice: { flexDirection: 'row', gap: 10, borderRadius: 10, backgroundColor: '#211f35', padding: 14, marginTop: 15 }, selfText: { color: '#b7b2dc', fontSize: 11, lineHeight: 16, flex: 1 }, sheetAction: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#282a32' }, sheetActionIcon: { width: 41, height: 41, borderRadius: 12, backgroundColor: '#24262d', alignItems: 'center', justifyContent: 'center' }, dangerIcon: { backgroundColor: '#321b1f' }, sheetActionCopy: { flex: 1, paddingHorizontal: 12 }, sheetActionTitle: { color: '#eee', fontSize: 13, fontWeight: '900' }, sheetActionCaption: { color: '#6f727c', fontSize: 10, marginTop: 4 }, dangerText: { color: '#ff777f' }, sheetClose: { height: 47, borderRadius: 10, backgroundColor: '#292b33', alignItems: 'center', justifyContent: 'center', marginTop: 17 }, sheetCloseText: { color: '#fff', fontWeight: '900' },
    deniedIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#ff3b47', alignItems: 'center', justifyContent: 'center' }, deniedTitle: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 17 }, deniedText: { color: '#777984', fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 7 },
});
