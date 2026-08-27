import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { addToSyncQueue, updateCachedTripStatus } from '../lib/database';
import NetInfo from '@react-native-community/netinfo';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function TripDetailsScreen({ trip, authState, onBack, onNavigate }: { trip: any, authState: any, onBack: () => void, onNavigate: (screen: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(trip.status);

  // Sync internal state if trip prop changes
  useEffect(() => {
    setCurrentStatus(trip.status);
  }, [trip.status]);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;

      if (isOnline) {
        const response = await fetch(`${API_URL}/Trips/${trip.id}/status`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}` 
          },
          body: JSON.stringify({ status: newStatus }),
        });
        if (response.ok) {
          await updateCachedTripStatus(trip.id, newStatus);
          setCurrentStatus(newStatus);
          Alert.alert('Success', `Trip status updated to ${newStatus}`);
        } else {
          throw new Error('API failed');
        }
      } else {
        throw new Error('Offline');
      }
    } catch (error) {
      console.log('Falling back to offline sync queue', error);
      await addToSyncQueue(`/Trips/${trip.id}/status`, 'POST', { status: newStatus });
      await updateCachedTripStatus(trip.id, newStatus);
      setCurrentStatus(newStatus);
      Alert.alert('Saved Offline', `Your status update to "${newStatus}" has been saved locally and will sync when you are online.`);
    } finally {
      setLoading(false);
    }
  };

  const source = trip.indent?.source || 'Delhi';
  const dest = trip.indent?.destination || 'Jaipur';
  const material = trip.indent?.material || 'Textiles';
  // const freight = `₹${(trip.supplierRate || trip.freightCharges || 0).toLocaleString()}`;
  const advance = `₹${(trip.advanceAmount || trip.fuelAdvance || 0).toLocaleString()}`;
  const vehicle = trip.vehicle?.vehicleNumber || 'Unassigned';

  // Format status for header
  const displayStatus = currentStatus === 'InTransit' ? 'In Transit' : currentStatus;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Blue Header Area */}
        <View style={styles.blueHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.headerSubtitle}>TRIP-{trip.id || '2287'} - {displayStatus}</Text>
            <View style={styles.headerRouteRow}>
              <Text style={styles.headerCity}>{source}</Text>
              <Text style={styles.headerArrow}>→</Text>
              <Text style={styles.headerCity}>{dest}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
          
          {/* Route Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressIcon}>📍</Text>
              <Text style={styles.progressTitle}>Route progress</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>182 / 268 km · ETA 3:40 PM</Text>
          </View>

          {/* 2x2 Grid */}
          <View style={styles.grid}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>TRIP ID</Text>
              <Text style={styles.gridValue}>TRIP-{trip.id || '---'}</Text>
            </View>
            {/* 
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>FREIGHT</Text>
              <Text style={styles.gridValue}>{freight}</Text>
            </View>
            */}
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>ADVANCE</Text>
              <Text style={styles.gridValue}>{advance}</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>VEHICLE</Text>
              <Text style={styles.gridValue}>{vehicle}</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>MATERIAL</Text>
              <Text style={styles.gridValue}>{material}</Text>
            </View>
          </View>

          {/* Action Buttons based on status */}
          <View style={styles.actionsContainer}>
            
            {currentStatus === 'Assigned' || currentStatus === 'Draft' ? (
              <TouchableOpacity style={styles.mainActionBtnBlue} onPress={() => updateStatus('Started')} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainActionBtnTextWhite}>Start Trip</Text>}
              </TouchableOpacity>
            ) : currentStatus === 'Started' || currentStatus === 'InTransit' ? (
              <TouchableOpacity style={styles.mainActionBtnOrange} onPress={() => updateStatus('Delivered')} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainActionBtnTextWhite}>Reached Destination</Text>}
              </TouchableOpacity>
            ) : currentStatus === 'Delivered' || currentStatus === 'Reached' ? (
              <TouchableOpacity style={styles.mainActionBtnOrange} onPress={() => onNavigate('POD')}>
                <Text style={styles.btnIcon}>📷</Text>
                <Text style={styles.mainActionBtnTextWhite}>Upload POD</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.mainActionBtnGrey} disabled>
                <Text style={styles.mainActionBtnTextWhite}>Completed</Text>
              </TouchableOpacity>
            )}

            {/* Request Advance (Always available as secondary unless completed) */}
            {(currentStatus !== 'Completed') && (
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => onNavigate('Advance')}>
                <Text style={styles.btnIconGrey}>💳</Text>
                <Text style={styles.secondaryActionBtnText}>Request Advance</Text>
              </TouchableOpacity>
            )}

            {(currentStatus === 'Started' || currentStatus === 'InTransit' || currentStatus === 'Delivered' || currentStatus === 'Reached') && (
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => onNavigate('Charge')}>
                <Text style={styles.btnIconGrey}>➕</Text>
                <Text style={styles.secondaryActionBtnText}>Add Charge</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Pure white background
  },
  scrollContent: {
    flexGrow: 1,
  },
  blueHeader: {
    backgroundColor: '#1e40af', // Deeper navy blue
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 10,
    marginLeft: -10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#cbd5e1', // Greyish text matching the mockup
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCity: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  headerArrow: {
    color: '#cbd5e1', // Greyish arrow
    fontSize: 24,
    marginHorizontal: 12,
  },
  contentArea: {
    padding: 16,
    marginTop: -20,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#3b82f6',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 12,
    flexDirection: 'row',
  },
  progressBarFill: {
    width: '70%',
    backgroundColor: '#f97316', // Bright orange
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  mainActionBtnOrange: {
    backgroundColor: '#f97316', // Bright orange
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionBtnBlue: {
    backgroundColor: '#1e40af', // Deeper navy blue
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionBtnGrey: {
    backgroundColor: '#94a3b8',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 8,
  },
  mainActionBtnTextWhite: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIconGrey: {
    fontSize: 20,
    color: '#475569',
    marginRight: 8,
  },
  secondaryActionBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#1d4ed8',
  },
});
