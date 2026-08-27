import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function AddChargeScreen({ trip, authState, onBack }: { trip: any, authState: any, onBack: () => void }) {
  const [chargeType, setChargeType] = useState('Unloading');

  const source = trip?.indent?.source || 'Origin';
  const dest = trip?.indent?.destination || 'Destination';
  const tripId = trip?.id || '---';
  const [amount, setAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create Additional Charge record
      const chargeResponse = await fetch(`${API_URL}/AdditionalCharges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          tripId: trip.id,
          chargeType: chargeType,
          amount: parseFloat(amount),
          tenantId: trip.tenantId,
          companyId: trip.companyId
        })
      });

      if (!chargeResponse.ok) {
        throw new Error('Failed to create additional charge record');
      }

      const chargeData = await chargeResponse.json();

      // 2. Upload Receipt Image if provided
      if (receiptImage) {
        const formData = new FormData();
        const typeMatch = receiptImage.match(/\.(\w+)$/);
        const mimeType = typeMatch ? `image/${typeMatch[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri: receiptImage,
          name: `receipt_${chargeData.id}.jpg`,
          type: mimeType
        } as any);
        formData.append('entityType', 'AdditionalCharge');
        formData.append('entityId', chargeData.id.toString());
        formData.append('documentType', 'Receipt');

        const uploadResponse = await fetch(`${API_URL}/Documents/Upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          console.warn('Failed to upload receipt image.');
          // Still proceed since charge was created
        }
      }

      Alert.alert('Success', 'Additional charge raised successfully!');
      onBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit the additional charge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Raise Additional Charge</Text>
          <Text style={styles.headerSubtitle}>TRIP-{tripId} · {source} → {dest}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Charge Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Charge type</Text>
          <View style={styles.pillsRow}>
            {['Unloading', 'Detention', 'Toll extra', 'Loading wait'].map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.pill, chargeType === type && styles.pillActive]}
                onPress={() => setChargeType(type)}
              >
                <Text style={[styles.pillText, chargeType === type && styles.pillTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Display Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <TextInput 
            style={[styles.amountValue, { minWidth: 150, textAlign: 'center' }]} 
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="number-pad"
          />
        </View>

        {/* Attach proof */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attach proof</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, receiptImage && styles.uploadBoxSuccess]}
            onPress={() => {
              Alert.alert('Attach Receipt', 'Choose an option', [
                { text: 'Camera', onPress: async () => {
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                    if (!result.canceled) setReceiptImage(result.assets[0].uri);
                  }
                },
                { text: 'Gallery', onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
                    if (!result.canceled) setReceiptImage(result.assets[0].uri);
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          >
            {receiptImage ? (
              <> 
                <Image source={{ uri: receiptImage }} style={styles.uploadedImage} />
                <Text style={styles.uploadedText}>receipt.jpg selected</Text>
              </>
            ) : (
              <>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.tapToCaptureText}>Tap to select</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>+ Submit Charge</Text>
          )}
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    minWidth: '45%',
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
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
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
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
  },
  uploadBox: {
    height: 140,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 16,
  },
  uploadBoxSuccess: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tapToCaptureText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  uploadedImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 8,
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
