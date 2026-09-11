import http from 'http';
import fs from 'fs';

const BASE = 'http://localhost:3005';
const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8'));
const actionId = Object.keys(manifest.node)[0];

const payload = JSON.stringify(['shipping']);
const req = http.request(
  `${BASE}/checkout`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Next-Action': actionId,
      'Accept': 'text/x-component',
    },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('Action status:', res.statusCode);
      console.log('Action response body:', data);
    });
  }
);
req.write(payload);
req.end();
