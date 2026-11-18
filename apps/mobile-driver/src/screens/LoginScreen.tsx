import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5063/api';

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    if (otp.join('').length < 4) {
      Alert.alert('Error', 'Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Fake OTP verification by using a seeded driver account
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, password: 'otp' }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data);
      } else {
        Alert.alert('Error', 'Invalid OTP or Driver not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>LogiPulse Driver</Text>
        <Text style={styles.subtitle}>Sign in to manage your trips</Text>

        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={step === 1}
        />

        {step === 2 && (
          <>
            <Text style={styles.label}>OTP</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => updateOtp(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>
          </>
        )}

        {step === 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
          </TouchableOpacity>
        )}

        {step === 2 && (
          <Text style={styles.resendText}>Resend OTP in 0:24</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark slate background matching blueprint
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#1d4ed8', // Deep blue
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  }
});
