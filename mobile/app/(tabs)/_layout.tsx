import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
    const { user } = useAuth() as { user: { role?: string } | null };
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#090909',
                    borderTopColor: '#242424',
                    borderTopWidth: 1,
                    paddingTop: 5,
                    height: 64,
                    elevation: 0,
                },
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#777',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: 'My List',
                    href: user?.role === 'admin' ? null : undefined,
                    tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="admin"
                options={{
                    title: 'Admin',
                    href: user?.role === 'admin' ? undefined : null,
                    tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
