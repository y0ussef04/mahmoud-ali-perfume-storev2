import http from 'http';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const dur = performance.now() - t0;
        resolve({
          status: res.statusCode,
          dur,
          cache: res.headers['x-nextjs-cache'] || 'N/A',
          size: (data.length / 1024).toFixed(1) + ' KB',
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== MEASURING PRODUCT PAGES (/products/[slug]) ===\n');

  const slugs = ['khamrah', 'asad', 'raghba'];
  const results = [];

  for (const slug of slugs) {
    const url = `http://localhost:3005/products/${slug}`;

    const r1 = await fetchUrl(url);
    await new Promise((r) => setTimeout(r, 50));
    const r2 = await fetchUrl(url);
    await new Promise((r) => setTimeout(r, 50));
    const r3 = await fetchUrl(url);

    results.push({
      product: `/products/${slug}`,
      '1st Request (Cold)': r1.dur.toFixed(1) + ' ms',
      '2nd Request (Warm)': r2.dur.toFixed(1) + ' ms',
      '3rd Request (Cached)': r3.dur.toFixed(1) + ' ms',
      CacheHeader: r3.cache,
      Size: r3.size,
    });
  }

  console.table(results);
}

run().catch(console.error);
