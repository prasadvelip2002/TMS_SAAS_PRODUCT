export interface DemoVehicle {
  id: string;
  tripId: number;
  num: string;
  driver: string;
  driverPhone?: string;
  srcLat: number;
  srcLng: number;
  source: string;
  destLat: number;
  destLng: number;
  dest: string;
  currentLat: number;
  currentLng: number;
  accuracy: number;
  status: string;
  speed: number;
  heading: number;
  eta: string;
  trackingType: 'MOBILE_GPS' | 'SIM_TRACKING';
  trackingProvider: string;
  trackingBadge: string;
  trackingStatus: 'LIVE' | 'STALE' | 'OFFLINE';
  sourceType: string;
  lastPingAgo: string;
  currentAddress?: string;
}

export const initialFleet: DemoVehicle[] = [
  { 
    id: "V1",
    tripId: 201,
    num: "TN-01-AB-1234", 
    driver: "Murugan V",
    driverPhone: "+91 94440 12345",
    srcLat: 13.0827, 
    srcLng: 80.2707, 
    source: "Chennai", 
    destLat: 28.7041, 
    destLng: 77.1025, 
    dest: "Delhi", 
    currentLat: 21.1458, 
    currentLng: 79.0882,
    accuracy: 8,
    status: "Moving", 
    speed: 65, 
    heading: 350,
    eta: "4h 30m",
    trackingType: "MOBILE_GPS",
    trackingProvider: "MOBILE",
    trackingBadge: "🔵 Mobile GPS (App)",
    trackingStatus: "LIVE",
    sourceType: "MOBILE_GPS",
    lastPingAgo: "20 sec ago",
    currentAddress: "Nagpur Outer Ring Road, NH-44"
  }, 
  { 
    id: "V2", 
    tripId: 202,
    num: "KA-05-MN-4567", 
    driver: "Arjun K",
    driverPhone: "+91 98450 67890",
    srcLat: 12.9716, 
    srcLng: 77.5946, 
    source: "Bangalore", 
    destLat: 19.0760, 
    destLng: 72.8777, 
    dest: "Mumbai", 
    currentLat: 15.3173, 
    currentLng: 75.7139,
    accuracy: 520,
    status: "Delayed", 
    speed: 30, 
    heading: 320,
    eta: "15h 45m",
    trackingType: "SIM_TRACKING",
    trackingProvider: "DOTMOVE",
    trackingBadge: "🟢 SIM (Dotmove)",
    trackingStatus: "STALE",
    sourceType: "SIM_TRACKING",
    lastPingAgo: "4 min ago (Cell Tower)",
    currentAddress: "Hubli-Dharwad Corridor (Cell Tower triangulation)"
  },
  { 
    id: "V3", 
    tripId: 203,
    num: "MH-04-XY-9876", 
    driver: "Rajesh S",
    driverPhone: "+91 98200 11223",
    srcLat: 19.0760, 
    srcLng: 72.8777, 
    source: "Mumbai", 
    destLat: 23.0225, 
    destLng: 72.5714, 
    dest: "Ahmedabad", 
    currentLat: 21.1702, 
    currentLng: 72.8311,
    accuracy: 650,
    status: "Halted", 
    speed: 0, 
    heading: 0,
    eta: "N/A",
    trackingType: "SIM_TRACKING",
    trackingProvider: "DOTMOVE",
    trackingBadge: "🟢 SIM (Dotmove)",
    trackingStatus: "OFFLINE",
    sourceType: "SIM_TRACKING",
    lastPingAgo: "22 min ago",
    currentAddress: "Surat Industrial Logistic Park"
  },
  { 
    id: "V4", 
    tripId: 204,
    num: "DL-1C-AA-1111", 
    driver: "Gurpreet",
    driverPhone: "+91 98111 99887",
    srcLat: 28.7041, 
    srcLng: 77.1025, 
    source: "Delhi", 
    destLat: 22.5726, 
    destLng: 88.3639, 
    dest: "Kolkata", 
    currentLat: 26.8467, 
    currentLng: 80.9462,
    accuracy: 10,
    status: "Moving", 
    speed: 72, 
    heading: 110,
    eta: "22h 10m",
    trackingType: "MOBILE_GPS",
    trackingProvider: "MOBILE",
    trackingBadge: "🔵 Mobile GPS (App)",
    trackingStatus: "LIVE",
    sourceType: "MOBILE_GPS",
    lastPingAgo: "45 sec ago",
    currentAddress: "Lucknow Expressway (GPS)"
  },
];
