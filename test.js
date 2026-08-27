const API_BASE_URL = 'http://localhost:5063/api';

async function testFetch() {
    try {
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const res = await fetch(`${API_BASE_URL}/Trips`, { headers });
        const text = await res.text();
        console.log("Trips Response:", res.status, text);
    } catch (e) {
        console.error(e);
    }
}
testFetch();
