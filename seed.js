const API_BASE_URL = 'http://localhost:5063/api';

async function seedData() {
    try {
        console.log("Setting up tenant and admin...");
        await fetch(`${API_BASE_URL}/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantName: 'Hitro Logistics', companyName: 'Hitro Logistics', adminEmail: 'admin@example.com', adminPassword: 'password123' })
        });

        console.log("Logging in to get token...");
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });
        
        if (!loginRes.ok) {
            console.error("Login failed", await loginRes.text());
            return;
        }
        
        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Create Platform Admin
        console.log("Creating Platform Admin...");
        await fetch(`${API_BASE_URL}/Users`, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify({ 
                name: 'Super Admin', 
                email: 'superadmin@transitflow.com', 
                passwordHash: 'password123', 
                role: 'Platform Admin',
                tenantId: 1,
                companyId: 1
            }) 
        });

        // Create Customers
        console.log("Creating Customers...");
        await fetch(`${API_BASE_URL}/Customers`, { method: 'POST', headers, body: JSON.stringify({ name: 'Acme Corp', gstin: '29ABCDE1234F1Z5', phone: '9876543210', email: 'contact@acme.com', address: 'Bangalore' }) });
        await fetch(`${API_BASE_URL}/Customers`, { method: 'POST', headers, body: JSON.stringify({ name: 'Tech Logistics', gstin: '27ZYXWV9876G1Z2', phone: '9123456789', email: 'hello@techlog.com', address: 'Mumbai' }) });

        // Create Vendors
        console.log("Creating Vendors...");
        await fetch(`${API_BASE_URL}/Vendors`, { method: 'POST', headers, body: JSON.stringify({ name: 'FastFleet Transports', phone: '9988776655', email: 'vendor@fastfleet.com', address: 'Delhi', panNumber: 'ABCDE1234F', routeRemarks: 'Prefers North India' }) });

        // Create Vehicles
        console.log("Creating Vehicles...");
        await fetch(`${API_BASE_URL}/Vehicles`, { method: 'POST', headers, body: JSON.stringify({ registrationNumber: 'KA-01-AB-1234', type: '10 Wheeler', capacity: 20 }) });
        await fetch(`${API_BASE_URL}/Vehicles`, { method: 'POST', headers, body: JSON.stringify({ registrationNumber: 'MH-12-CD-5678', type: '14 Wheeler', capacity: 30 }) });

        // Create Drivers
        console.log("Creating Drivers...");
        // First we need a user account for the driver
        console.log("Creating Driver User...");
        // Wait, drivers don't have a POST endpoint in Auth for driver. We just create a User directly or driver model.
        await fetch(`${API_BASE_URL}/Drivers`, { method: 'POST', headers, body: JSON.stringify({ name: 'Ramesh Singh', phoneNumber: '9876543211', licenseNumber: 'KA123456789' }) });

        console.log("Seeding Complete!");
    } catch (e) {
        console.error("Error during seeding:", e);
    }
}

seedData();
