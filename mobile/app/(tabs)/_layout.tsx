import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
    const { user } = useAuth() as { user: { role?: string } | null };
    const insets = useSafeAreaInsets();
    const bottomSpace = Math.max(insets.bottom, 10);
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: '#0b0b0d',
                    borderTopColor: '#242429',
                    borderTopWidth: 1,
                    paddingTop: 7,
                    paddingBottom: bottomSpace,
                    height: 61 + bottomSpace,
                    elevation: 0,
                },
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#73737b',
                tabBarActiveBackgroundColor: '#18181c',
                tabBarItemStyle: { height: 50, marginHorizontal: 3, borderRadius: 12 },
                tabBarIconStyle: { marginTop: 2 },
                tabBarLabelStyle: { fontSize: 9, lineHeight: 12, fontWeight: '800', marginTop: -1, marginBottom: 3 },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: 'My List',
                    href: user?.role === 'admin' ? null : undefined,
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="admin"
                options={{
                    title: 'Admin',
                    href: user?.role === 'admin' ? undefined : null,
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}
