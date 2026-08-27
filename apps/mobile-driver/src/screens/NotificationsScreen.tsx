import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function NotificationsScreen({ authState, onNavigate }: { authState: any, onNavigate: (screen: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/Notifications`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Transform data slightly for the UI if needed
        const mapped = data.map((n: any) => ({
          id: n.id.toString(),
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleDateString(), // simplified
          icon: '🔔',
          iconColor: '#1e40af'
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.iconContainer, { borderColor: item.iconColor }]}>
        <Text style={[styles.icon, { color: item.iconColor }]}>{item.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <Text style={{color: '#64748b', fontSize: 16}}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <Text style={styles.navIcon}>🚚</Text>
          <Text style={styles.navText}>Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Notifications')}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={[styles.navText, styles.navActive]}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  list: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomNav: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  navActive: {
    color: '#1e40af', // Navy blue
  },
});
