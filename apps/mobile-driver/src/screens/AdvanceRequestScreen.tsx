import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

export default function AdvanceRequestScreen({ trip, onBack }: { trip: any, onBack: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  const source = trip?.indent?.source || 'Origin';
  const dest = trip?.indent?.destination || 'Destination';
  const tripId = trip?.id || '---';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Request Advance</Text>
          <Text style={styles.headerSubtitle}>TRIP-{tripId} · {source} → {dest}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Display Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount requested</Text>
          <Text style={styles.amountValue}>₹{parseInt(amount || '0').toLocaleString()}</Text>
          {trip?.supplierRate ? (
            <Text style={styles.limitText}>Within trip limit (₹{Math.floor((trip?.supplierRate || 0) * 0.8).toLocaleString()})</Text>
          ) : null}
        </View>

        {/* Quick Select Pills */}
        <View style={styles.pillsRow}>
          {['5000', '10000', '15000'].map((val) => (
            <TouchableOpacity 
              key={val} 
              style={[styles.pill, amount === val && styles.pillActive]}
              onPress={() => setAmount(val)}
            >
              <Text style={[styles.pillText, amount === val && styles.pillTextActive]}>
                ₹{parseInt(val).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reason Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reason</Text>
          <TextInput 
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason for advance"
          />
        </View>

        {/* Payment Mode */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payment mode</Text>
          <View style={styles.paymentPillsRow}>
            {['UPI', 'Bank'].map((mode) => (
              <TouchableOpacity 
                key={mode} 
                style={[styles.paymentPill, paymentMode === mode && styles.paymentPillActive]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text style={[styles.paymentPillText, paymentMode === mode && styles.paymentPillTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={onBack}>
          <Text style={styles.submitBtnText}>Submit Request</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  backIcon: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 13,
    color: '#22c55e', // Green
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  pillActive: {
    backgroundColor: '#1e40af', // Navy blue
    borderColor: '#1e40af',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  paymentPillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentPill: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  paymentPillActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  paymentPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  paymentPillTextActive: {
    color: '#ffffff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#f97316', // Orange
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
