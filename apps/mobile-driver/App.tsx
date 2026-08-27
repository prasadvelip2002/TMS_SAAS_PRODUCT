import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import TripDetailsScreen from './src/screens/TripDetailsScreen';
import AdvanceRequestScreen from './src/screens/AdvanceRequestScreen';
import AddChargeScreen from './src/screens/AddChargeScreen';
import PODUploadScreen from './src/screens/PODUploadScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import NewTripOfferScreen from './src/screens/NewTripOfferScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';

export default function App() {
  const [authState, setAuthState] = useState<{ token: string; user: any } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'Home' | 'TripDetails' | 'Advance' | 'Charge' | 'POD' | 'DocumentUpload' | 'Notifications' | 'Profile' | 'Payments' | 'NewTripOffer'>('Home');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const handleLogin = (data: any) => {
    setAuthState({ token: data.token, user: data.user });
    setCurrentScreen('Home');
  };

  const handleSelectTrip = (trip: any) => {
    setSelectedTrip(trip);
    if (trip.status === 'Assigned' || trip.status === 'Draft') {
      setCurrentScreen('NewTripOffer');
    } else {
      setCurrentScreen('TripDetails');
    }
  };

  const handleBackToHome = () => {
    setSelectedTrip(null);
    setCurrentScreen('Home');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        {!authState ? (
          <LoginScreen onLogin={handleLogin} />
        ) : currentScreen === 'Home' ? (
          <DriverHomeScreen authState={authState} onSelectTrip={handleSelectTrip} onNavigate={(s: any) => setCurrentScreen(s)} />
        ) : currentScreen === 'TripDetails' && selectedTrip ? (
          <TripDetailsScreen trip={selectedTrip} authState={authState} onBack={handleBackToHome} onNavigate={setCurrentScreen} />
        ) : currentScreen === 'Advance' && selectedTrip ? (
          <AdvanceRequestScreen trip={selectedTrip} onBack={() => setCurrentScreen('TripDetails')} />
        ) : currentScreen === 'Charge' && selectedTrip ? (
          <AddChargeScreen trip={selectedTrip} authState={authState} onBack={() => setCurrentScreen('TripDetails')} />
        ) : currentScreen === 'POD' && selectedTrip ? (
          <PODUploadScreen trip={selectedTrip} authState={authState} onBack={() => setCurrentScreen('TripDetails')} onComplete={() => setCurrentScreen('DocumentUpload')} />
        ) : currentScreen === 'DocumentUpload' && selectedTrip ? (
          <DocumentUploadScreen trip={selectedTrip} onBack={() => setCurrentScreen('POD')} onComplete={() => setCurrentScreen('TripDetails')} />
        ) : currentScreen === 'Notifications' ? (
          <NotificationsScreen authState={authState} onNavigate={(s: any) => setCurrentScreen(s)} />
        ) : currentScreen === 'Profile' ? (
          <ProfileScreen authState={authState} onNavigate={(s: any) => setCurrentScreen(s)} />
        ) : currentScreen === 'Payments' ? (
          <PaymentsScreen authState={authState} onBack={() => setCurrentScreen('Profile')} onNavigate={(s: any) => setCurrentScreen(s)} />
        ) : currentScreen === 'NewTripOffer' && selectedTrip ? (
          <NewTripOfferScreen 
            trip={selectedTrip} 
            onAccept={() => setCurrentScreen('TripDetails')} 
            onReject={() => { setSelectedTrip(null); setCurrentScreen('Home'); }} 
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
