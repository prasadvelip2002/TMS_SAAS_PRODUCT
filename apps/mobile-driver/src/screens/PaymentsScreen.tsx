import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function PaymentsScreen({ authState, onBack, onNavigate }: { authState: any, onBack?: () => void, onNavigate: (screen: string) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/Payments`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Filter payments for this specific driver
        const myPayments = authState.user.id === 999 
          ? data 
          : data.filter((p: any) => p.driverId === authState.user.id || (p.trip && p.trip.driverId === authState.user.id));
        
        let total = 0;
        const mapped = myPayments.map((p: any) => {
          total += p.amount;
          return {
            id: p.id.toString(),
            type: p.type,
            tripId: p.tripId.toString(),
            amount: p.amount.toLocaleString(),
            status: p.utrNumber ? 'Paid' : 'Processing',
            icon: '💳',
            color: p.utrNumber ? '#22c55e' : '#3b82f6'
          };
        });
        
        setTotalEarned(total);
        setPayments(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Massive Blue Header */}
      <View style={styles.blueHeader}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>Total earned (this month)</Text>
          <Text style={styles.earningsAmount}>₹{totalEarned.toLocaleString()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : payments.length === 0 ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <Text style={{color: '#64748b', fontSize: 16}}>No payments yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {payments.map((payment) => (
            <View key={payment.id} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: payment.color + '15' }]}>
                <Text style={styles.icon}>{payment.icon}</Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.paymentType}>{payment.type}</Text>
                <Text style={styles.tripId}>TRIP-{payment.tripId}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>₹{payment.amount}</Text>
                <Text style={[styles.status, { color: payment.color }]}>{payment.status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navText, styles.navActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  blueHeader: {
    backgroundColor: '#1e40af', // Navy blue
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 40,
    textAlign: 'left',
    marginLeft: 32, // make room for back button
  },
  earningsContainer: {
    marginTop: 10,
  },
  earningsLabel: {
    color: '#93c5fd', // Light blue
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  earningsAmount: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
    marginTop: -20, // pull list up slightly
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  tripId: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
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
