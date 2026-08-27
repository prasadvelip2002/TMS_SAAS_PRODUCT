import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function DocumentUploadScreen({ trip, onBack, onComplete }: { trip: any, onBack: () => void, onComplete: () => void }) {
  const source = trip?.indent?.source || 'Delhi';
  const dest = trip?.indent?.destination || 'Jaipur';
  const tripId = trip?.id || '---';

  const documents = [
    { id: 1, title: 'LR / Consignment note', status: 'Verified', icon: '📄', type: 'success' },
    { id: 2, title: 'Weighment slip', status: 'Uploaded', icon: '⚖️', type: 'info' },
    { id: 3, title: 'Toll receipts', status: 'Pending', icon: '🎫', type: 'pending' },
    { id: 4, title: 'Fuel bill', status: 'Pending', icon: '⛽', type: 'pending' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <Text style={styles.headerSubtitle}>TRIP-{tripId} · {source} → {dest}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {documents.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docIconContainer}>
              <Text style={styles.docIcon}>{doc.icon}</Text>
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              
              {doc.type === 'success' && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusIconSuccess}>✓</Text>
                  <Text style={styles.statusTextSuccess}>{doc.status}</Text>
                </View>
              )}
              
              {doc.type === 'info' && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusIconInfo}>✓</Text>
                  <Text style={styles.statusTextInfo}>{doc.status}</Text>
                </View>
              )}

              {doc.type === 'pending' && (
                <Text style={styles.statusTextPending}>{doc.status}</Text>
              )}
            </View>

            {doc.type === 'pending' && (
              <TouchableOpacity style={styles.uploadBtnOutline}>
                <Text style={styles.uploadBtnOutlineText}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={onComplete}>
          <Text style={styles.btnIcon}>↑</Text>
          <Text style={styles.submitBtnText}>Submit All</Text>
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
    padding: 16,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  docIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  docIcon: {
    fontSize: 24,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconSuccess: {
    color: '#22c55e',
    fontSize: 12,
    marginRight: 4,
    fontWeight: 'bold',
  },
  statusTextSuccess: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
  },
  statusIconInfo: {
    color: '#64748b',
    fontSize: 12,
    marginRight: 4,
    fontWeight: 'bold',
  },
  statusTextInfo: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  uploadBtnOutline: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#f97316', // Orange
    borderRadius: 8,
    backgroundColor: '#fff7ed', // Very light orange background
  },
  uploadBtnOutlineText: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#1e40af', // Navy blue
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
