import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

export default function NewTripOfferScreen({ trip, onAccept, onReject }: { trip: any, onAccept: () => void, onReject: () => void }) {
  const source = trip?.indent?.source || 'Origin';
  const dest = trip?.indent?.destination || 'Destination';
  const material = trip?.indent?.material || 'General Goods';
  const distance = 'TBD';
  const weight = trip?.indent?.capacityInTons ? `${trip.indent.capacityInTons} T` : 'TBD';
  // const earning = `₹${(trip?.supplierRate || trip?.freightCharges || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Orange Area */}
        <View style={styles.orangeHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onReject}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.pillContainer}>
            <Text style={styles.pillText}>New Trip Offer</Text>
          </View>
          <Text style={styles.tripId}>TRIP-{trip?.id || '---'}</Text>
          <Text style={styles.timer}>Expires in 04:58</Text>
        </View>

        <View style={styles.contentArea}>
          {/* Main Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.routeHeader}>
              <View style={styles.locationPin}>
                <Text style={styles.pinInner}></Text>
              </View>
              <Text style={styles.routeText}>{source}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.routeText}>{dest}</Text>
            </View>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridIcon}>📦</Text>
                <View>
                  <Text style={styles.gridLabel}>{material.toUpperCase()}</Text>
                  <Text style={styles.gridValue}>{weight}</Text>
                </View>
              </View>
              
              <View style={styles.gridItem}>
                <Text style={styles.gridIcon}>📍</Text>
                <View>
                  <Text style={styles.gridLabel}>DISTANCE</Text>
                  <Text style={styles.gridValue}>148 km</Text>
                </View>
              </View>
              
              <View style={styles.gridItem}>
                <Text style={styles.gridIcon}>🕒</Text>
                <View>
                  <Text style={styles.gridLabel}>LOADING</Text>
                  <Text style={styles.gridValue}>07 Jul</Text>
                  <Text style={styles.gridValue}>09:00</Text>
                </View>
              </View>
              
              <View style={styles.gridItem}>
                <Text style={styles.gridIcon}>💳</Text>
                <View>
                  <Text style={styles.gridLabel}>ADVANCE LIMIT</Text>
                  <Text style={styles.gridValue}>₹{Math.floor((trip?.supplierRate || 0) * 0.8).toLocaleString()}</Text>
                </View>
              </View>
              {/* 
              <View style={styles.gridItem}>
                <Text style={styles.gridIcon}>₹</Text>
                <View>
                  <Text style={styles.gridLabel}>EARNING</Text>
                  <Text style={styles.gridValue}>{earning}</Text>
                </View>
              </View>
              */}
            </View>
          </View>

          {/* Callout Box */}
          <View style={styles.calloutBox}>
            <Text style={styles.calloutText}>
              Advance up to ₹15,000 available on acceptance.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptBtnText}>Accept Trip</Text>
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
  scroll: {
    flexGrow: 1,
  },
  orangeHeader: {
    backgroundColor: '#ea580c', // Bright orange
    padding: 30,
    paddingTop: 40,
    paddingBottom: 60,
  },
  backButton: {
    marginBottom: 20,
    marginLeft: -10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pillContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  pillText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  tripId: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  timer: {
    color: '#ffedd5',
    fontSize: 15,
    fontWeight: '500',
  },
  contentArea: {
    padding: 20,
    marginTop: -40, // overlap the orange header
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  arrow: {
    fontSize: 18,
    color: '#94a3b8',
    marginHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 24,
  },
  gridItem: {
    width: '50%',
    flexDirection: 'row',
  },
  gridIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#64748b',
    marginTop: 2,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  calloutBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
  },
  calloutText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1.5,
    paddingVertical: 16,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
