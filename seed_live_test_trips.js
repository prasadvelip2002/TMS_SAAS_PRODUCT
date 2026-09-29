const API_BASE_URL = 'http://localhost:5063/api';

async function seedTrackingTestScenario() {
    try {
        console.log("1. Authenticating as Admin...");
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });
        
        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Create / Ensure Vehicles
        console.log("2. Creating Vehicles...");
        const v1Res = await fetch(`${API_BASE_URL}/Vehicles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                vehicleNumber: 'KA-01-AB-1234',
                type: '32ft Container',
                capacity: 18,
                ownerName: 'Own Fleet'
            })
        });
        const v1 = await v1Res.json();

        const v2Res = await fetch(`${API_BASE_URL}/Vehicles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                vehicleNumber: 'MH-04-CD-5678',
                type: '20ft Closed Body',
                capacity: 12,
                ownerName: 'Own Fleet'
            })
        });
        const v2 = await v2Res.json();

        console.log(`Vehicles created: KA-01-AB-1234 (ID: ${v1.id}), MH-04-CD-5678 (ID: ${v2.id})`);

        // 3. Create Drivers with Tracking Types
        console.log("3. Creating Drivers...");
        const d1Res = await fetch(`${API_BASE_URL}/Drivers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Ramesh Singh (Smartphone)',
                phone: '+91 98765 43210',
                licenseNumber: 'KA-2022-87654',
                trackingType: 'MOBILE_GPS',
                trackingProvider: 'MOBILE',
                consentStatus: 'Active'
            })
        });
        const d1 = await d1Res.json();

        const d2Res = await fetch(`${API_BASE_URL}/Drivers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Suresh Patil (Keypad SIM)',
                phone: '+91 98123 45678',
                licenseNumber: 'MH-2021-12345',
                trackingType: 'SIM_TRACKING',
                trackingProvider: 'DOTMOVE',
                consentStatus: 'Active',
                simConsentRef: 'DOTMOVE-TEST-CONSENT'
            })
        });
        const d2 = await d2Res.json();

        console.log(`Drivers created: Ramesh (ID: ${d1.id}, Mobile GPS), Suresh (ID: ${d2.id}, SIM Tracking)`);

        // 4. Create Indents
        console.log("4. Creating Indents...");
        const i1Res = await fetch(`${API_BASE_URL}/Indents`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: 1,
                source: 'Bangalore',
                destination: 'Mumbai',
                vehicleType: '32ft Container',
                weight: 15,
                material: 'Consumer Electronics',
                status: 'In_Transit'
            })
        });
        const i1 = await i1Res.json();

        const i2Res = await fetch(`${API_BASE_URL}/Indents`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: 2,
                source: 'Mumbai',
                destination: 'Delhi',
                vehicleType: '20ft Closed Body',
                weight: 10,
                material: 'Auto Spare Parts',
                status: 'In_Transit'
            })
        });
        const i2 = await i2Res.json();

        // 5. Create Trips in In_Transit
        console.log("5. Creating Trips...");
        const trip1Res = await fetch(`${API_BASE_URL}/Trips`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                indentId: i1.id,
                vehicleId: v1.id,
                driverId: d1.id,
                status: 'In_Transit',
                bookingType: 'FTL',
                tripStartDate: new Date().toISOString()
            })
        });
        const trip1 = await trip1Res.json();

        const trip2Res = await fetch(`${API_BASE_URL}/Trips`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                indentId: i2.id,
                vehicleId: v2.id,
                driverId: d2.id,
                status: 'In_Transit',
                bookingType: 'FTL',
                tripStartDate: new Date().toISOString()
            })
        });
        const trip2 = await trip2Res.json();

        console.log(`\n======================================================`);
        console.log(`✅ TEST DATA CREATED SUCCESSFULLY IN YOUR DATABASE!`);
        console.log(`======================================================`);
        console.log(`TRIP #1 (Mobile GPS):`);
        console.log(`  - Trip ID: ${trip1.id}`);
        console.log(`  - Vehicle: KA-01-AB-1234`);
        console.log(`  - Driver: Ramesh Singh (Smartphone)`);
        console.log(`  - Route: Bangalore -> Mumbai`);
        console.log(`  - Status: In_Transit`);
        console.log(``);
        console.log(`TRIP #2 (SIM LBS):`);
        console.log(`  - Trip ID: ${trip2.id}`);
        console.log(`  - Vehicle: MH-04-CD-5678`);
        console.log(`  - Driver: Suresh Patil (Keypad SIM)`);
        console.log(`  - Route: Mumbai -> Delhi`);
        console.log(`  - Status: In_Transit`);
        console.log(`======================================================\n`);

        // 6. Send Initial Pings for Both Trips
        console.log("6. Sending initial GPS Ping for Trip 1...");
        await fetch(`${API_BASE_URL}/Locations/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tripId: trip1.id,
                latitude: 15.3647,
                longitude: 75.1240,
                accuracy: 7.5,
                speed: 62,
                heading: 335,
                source: 'MOBILE_GPS',
                provider: 'MOBILE',
                deviceId: 'TEST-DEVICE-KA01'
            })
        });

        console.log("7. Triggering SIM Network LBS Query for Trip 2...");
        await fetch(`${API_BASE_URL}/Locations/sim/ping/${trip2.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("8. Verifying Live Fleet endpoint...");
        const liveRes = await fetch(`${API_BASE_URL}/Locations/live`);
        const liveData = await liveRes.json();
        console.log("Live Fleet Output Count:", liveData.length);
        console.log("Live Vehicles:", liveData.map(l => ({
            tripId: l.tripId,
            vehicle: l.vehicleNumber,
            driver: l.driverName,
            type: l.trackingType,
            status: l.trackingStatus,
            accuracy: `±${l.accuracy}m`,
            speed: `${l.speed} km/h`
        })));

    } catch (e) {
        console.error("Error creating test scenario:", e);
    }
}

seedTrackingTestScenario();
