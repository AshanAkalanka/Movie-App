import api from './api';
import { Platform } from 'react-native';

function friendlyError(error, fallback) {
    return new Error(error?.response?.data?.message || fallback);
}

export async function getAdminStats() {
    try { return (await api.get('/admin/stats')).data; }
    catch (error) { throw friendlyError(error, 'We could not load the latest insights. Please try again.'); }
}

export async function getAdminUsers(search = '') {
    try { return (await api.get('/admin/users', { params: { search: search.trim() || undefined } })).data.users || []; }
    catch (error) { throw friendlyError(error, 'We could not load members right now.'); }
}

export async function updateAdminUser(id, updates) {
    try { return (await api.put(`/admin/users/${encodeURIComponent(id)}`, updates)).data.user; }
    catch (error) { throw friendlyError(error, 'We could not update this member.'); }
}

export async function deleteAdminUser(id) {
    try { await api.delete(`/admin/users/${encodeURIComponent(id)}`); }
    catch (error) { throw friendlyError(error, 'We could not remove this member.'); }
}

export async function uploadAdminImage(asset) {
    try {
        const form = new FormData();
        const file = Platform.OS === 'web' && asset.file ? asset.file : {
            uri: asset.uri,
            name: asset.fileName || `screenly-${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
        };
        form.append('image', file);
        const response = await api.post('/admin/uploads/image', form, { timeout: 30000 });
        return response.data.path;
    } catch (error) {
        throw friendlyError(error, 'That photo wasn’t uploaded. Please choose another image.');
    }
}

export async function deleteAdminImage(path) {
    if (!String(path || '').startsWith('/uploads/')) return;
    try { await api.delete('/admin/uploads/image', { data: { path } }); }
    catch { /* A later server cleanup can remove abandoned upload files. */ }
}

export async function getAdminCategories() {
    try { return (await api.get('/admin/categories')).data.categories || []; }
    catch (error) { throw friendlyError(error, 'We couldn’t load categories right now.'); }
}

export async function createAdminCategory(payload) {
    try { return (await api.post('/admin/categories', payload)).data.category; }
    catch (error) { throw friendlyError(error, 'That category wasn’t created.'); }
}

export async function updateAdminCategory(id, payload) {
    try { return (await api.put(`/admin/categories/${encodeURIComponent(id)}`, payload)).data.category; }
    catch (error) { throw friendlyError(error, 'That category wasn’t updated.'); }
}

export async function deleteAdminCategory(id) {
    try { await api.delete(`/admin/categories/${encodeURIComponent(id)}`); }
    catch (error) { throw friendlyError(error, 'That category couldn’t be removed.'); }
}
