const PK_CLIENT_ID = '995bd080-b0a7-44b3-b2ad-dcd8e577f733';
const PK_CLIENT_SECRET = 'vN2epGca9pTknlS4NTxStLXIckpZd6sNtL6KUSOe';

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.prokerala.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${PK_CLIENT_ID}&client_secret=${PK_CLIENT_SECRET}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error');
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  try {
    const { endpoint, params } = JSON.parse(event.body);
    const token = await getToken();
    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.prokerala.com/v2/astrology/${endpoint}?${queryString}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
