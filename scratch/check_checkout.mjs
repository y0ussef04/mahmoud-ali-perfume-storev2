import http from 'http';

http.get('http://localhost:3005/checkout', (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => {
    console.log('Checkout status:', res.statusCode);
    console.log('Includes القاهرة:', d.includes('القاهرة'));
    const idx = d.indexOf('القاهرة');
    if (idx !== -1) {
      console.log('Context around القاهرة:', d.slice(Math.max(0, idx - 40), idx + 100));
    }
  });
});
