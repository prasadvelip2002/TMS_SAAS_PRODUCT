import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function PODUploadScreen({ trip, authState, onBack, onComplete }: { trip: any, authState: any, onBack: () => void, onComplete: () => void }) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const source = trip?.indent?.source || 'Origin';
  const dest = trip?.indent?.destination || 'Destination';
  const tripId = trip?.id || '---';

  const handleUpload = async () => {
    if (!frontImage && !backImage) {
      Alert.alert('Error', 'Please select at least one image to upload.');
      return;
    }
    
    setLoading(true);
    try {
      const uploadSingleImage = async (uri: string, name: string) => {
        const formData = new FormData();
        const fileMatch = uri.match(/\/([^\/?#]+)[^\/]*$/);
        const fileName = name;
        const typeMatch = uri.match(/\.(\w+)$/);
        const mimeType = typeMatch ? `image/${typeMatch[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri: uri,
          name: fileName,
          type: mimeType
        } as any);
        formData.append('entityType', 'Trip');
        formData.append('entityId', trip.id.toString());
        formData.append('documentType', 'POD');
        
        const response = await fetch(`${API_URL}/Documents/Upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`
            // Content-Type is multipart/form-data, automatically set by fetch with FormData
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
      };

      if (frontImage) await uploadSingleImage(frontImage, 'POD_front.jpg');
      if (backImage) await uploadSingleImage(backImage, 'POD_back.jpg');
      
      Alert.alert('Success', 'POD uploaded successfully!');
      onComplete();
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Error', 'Failed to upload POD to the server.');
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
          <Text style={styles.headerTitle}>Upload POD</Text>
          <Text style={styles.headerSubtitle}>TRIP-{tripId} · {source} → {dest}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Front Side */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Front side</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, frontImage && styles.uploadBoxSuccess]}
            onPress={() => {
              Alert.alert('Upload Front POD', 'Choose an option', [
                { text: 'Camera', onPress: async () => {
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                    if (!result.canceled) setFrontImage(result.assets[0].uri);
                  }
                },
                { text: 'Gallery', onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
                    if (!result.canceled) setFrontImage(result.assets[0].uri);
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          >
            {frontImage ? (
              <> 
                <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
                <Text style={styles.uploadedText}>POD_front.jpg selected</Text>
              </>
            ) : (
              <>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.tapToCaptureText}>Tap to select</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back Side */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Back side</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, backImage && styles.uploadBoxSuccess]}
            onPress={() => {
              Alert.alert('Upload Back POD', 'Choose an option', [
                { text: 'Camera', onPress: async () => {
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                    if (!result.canceled) setBackImage(result.assets[0].uri);
                  }
                },
                { text: 'Gallery', onPress: async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
                    if (!result.canceled) setBackImage(result.assets[0].uri);
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          >
            {backImage ? (
              <> 
                <Image source={{ uri: backImage }} style={styles.uploadedImage} />
                <Text style={styles.uploadedText}>POD_back.jpg selected</Text>
              </>
            ) : (
              <>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.tapToCaptureText}>Tap to select</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>POD must be uploaded within 24 hours of delivery.</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleUpload} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit POD</Text>
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
    padding: 24,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
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
  },
  uploadBoxSuccess: {
    borderColor: '#22c55e', // Green
    backgroundColor: '#f0fdf4', // Light green
  },
  cameraIcon: {
    fontSize: 32,
    color: '#94a3b8',
    marginBottom: 8,
  },
  tapToCaptureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  iconCircleSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSuccess: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15803d', // Dark green
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
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
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
