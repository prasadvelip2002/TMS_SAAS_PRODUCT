import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { cacheTrips, getCachedTrips } from '../lib/database';
import { useSync } from '../hooks/useSync';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function DriverHomeScreen({ authState, onSelectTrip, onNavigate }: { authState: any, onSelectTrip: (trip: any) => void, onNavigate: (screen: string) => void }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOnline, isSyncing } = useSync(authState);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch(`${API_URL}/Trips`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // If it's the demo driver (999), show all trips. Otherwise filter by driverId.
        const myTrips = authState.user.id === 999 
          ? data 
          : data.filter((t: any) => t.driverId === authState.user.id);
        
        setTrips(myTrips);
        await cacheTrips(myTrips);
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      console.error('Fetch failed, loading from cache:', error);
      try {
        const cached = await getCachedTrips();
        if (cached && cached.length > 0) {
          setTrips(cached);
        } else {
          // Fallback fake data removed for production readiness
          setTrips([]);
        }
      } catch (e) {
        console.error('Cache read failed:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrips();
  }, [authState]);

  const renderTrip = useCallback(({ item }: { item: any }) => {
    const isNew = item.status === 'Assigned' || item.status === 'Draft';
    
    // Safely extract source/destination from trip -> indent, or fallback
    const source = item.indent?.source || 'City A';
    const dest = item.indent?.destination || 'City B';
    const material = item.indent?.material || 'General Goods';

    if (isNew) {
      return (
        <TouchableOpacity style={[styles.card, styles.cardNew]} onPress={() => onSelectTrip(item)}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeNew}>
              <Text style={styles.badgeNewText}>New Trip</Text>
            </View>
            <Text style={styles.tripId}>TRIP-{item.id}</Text>
          </View>
          <View style={styles.routeContainerNew}>
            <View style={styles.dot} />
            <Text style={styles.routeText}>{source}  →  {dest}</Text>
          </View>
          <Text style={styles.detailsText}>148 km · {material} · 07 Jul 09:00</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.rejectBtnPill}>
              <Text style={styles.rejectBtnTextPill}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtnPill} onPress={() => onSelectTrip(item)}>
              <Text style={styles.acceptBtnTextPill}>Accept</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelectTrip(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.tripId}>TRIP-{item.id}</Text>
          <View style={styles.badgeNormal}>
            <Text style={styles.badgeNormalText}>{item.status === 'InTransit' ? 'In Transit' : item.status}</Text>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{source}  →  {dest}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }, [onSelectTrip]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.headerGreeting}>Good morning</Text>
            <Text style={styles.headerName}>{authState?.user?.name || "Rajesh Kumar"}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isSyncing && <ActivityIndicator size="small" color="#fff" />}
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4ade80' : '#f87171' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trips.filter(t => t.status === 'Started' || t.status === 'InTransit').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trips.filter(t => t.status === 'Assigned').length}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{trips.reduce((sum, t) => sum + (t.advanceAmount || 0), 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Advance</Text>
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          style={styles.flatList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1d4ed8']}
            />
          }
        />
      )}

      {/* Fake Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <Text style={styles.navIcon}>🚚</Text>
          <Text style={styles.navText}>Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Notifications')}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#1d4ed8',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerGreeting: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    marginTop: -20, // Overlap the header slightly
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardNew: {
    borderColor: '#f97316',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripId: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  badgeNew: {
    backgroundColor: '#ea580c', // Darker orange pill
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeNewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeNormal: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeNormalText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginRight: 10,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  chevron: {
    fontSize: 24,
    color: '#94a3b8',
  },
  detailsText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rejectBtnPill: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 30, // fully rounded pill
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  rejectBtnTextPill: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
  acceptBtnPill: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#1d4ed8', // dark blue
    borderRadius: 30, // fully rounded pill
    alignItems: 'center',
  },
  acceptBtnTextPill: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
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
    color: '#1d4ed8',
  },
});
