const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5063/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    cache: 'no-store',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'isLoggedIn=; path=/; max-age=0'; // Clear the cookie
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// -- INDENTS --
export const getIndents = () => fetchApi('/Indents');
export const getIndent = (id: number) => fetchApi(`/Indents/${id}`);
export const createIndent = (data: any) => fetchApi('/Indents', {
  method: 'POST',
  body: JSON.stringify(data),
});

// -- TRIPS --
export const getTrips = () => fetchApi('/Trips');
export const getTrip = (id: number) => fetchApi(`/Trips/${id}`);
export const assignTrip = (data: any) => fetchApi('/Trips/Assign', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateTripStatus = (id: number, status: string) => fetchApi(`/Trips/${id}/Status`, {
  method: 'POST',
  body: JSON.stringify({ status }),
});

// -- PAYMENTS --
export const getPayments = () => fetchApi('/Payments');
export const postPayment = (data: any) => fetchApi('/Payments', {
  method: 'POST',
  body: JSON.stringify(data),
});

// -- APPROVALS --
export const getPendingCharges = () => fetchApi('/ManagerApprovals/PendingCharges');
export const approveCharge = (id: number) => fetchApi(`/ManagerApprovals/ApproveCharge/${id}`, { method: 'POST' });
export const rejectCharge = (id: number) => fetchApi(`/ManagerApprovals/RejectCharge/${id}`, { method: 'POST' });

// -- MASTER DATA --
export const getCustomers = () => fetchApi('/Customers');
export const getVendors = () => fetchApi('/Vendors');
export const getVehicles = () => fetchApi('/Vehicles');
export const getDrivers = () => fetchApi('/Drivers');
