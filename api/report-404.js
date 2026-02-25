export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, timestamp, referer, userAgent } = req.body;

    if (!url || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields: url, timestamp' });
    }

    const data = {
      url,
      timestamp,
      referer,
      userAgent,
    };

    const kvNamespaceId = process.env.KV_NAME;
    const cfToken = process.env.TOKEN;
    const account = process.env.ACCOUNT

    if (!kvNamespaceId || !cfToken) {
      console.error('Missing Cloudflare KV credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 使用当前时间戳 + 随机数作为 KV key，确保每条记录唯一
    const key = `404:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    // 调用 Cloudflare API 写入 KV
    const cfApiUrl = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${kvNamespaceId}/values/${encodeURIComponent(key)}`;

    const response = await fetch(cfApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudflare API error:', error);
      return res.status(500).json({ error: 'Failed to store log in Cloudflare KV' });
    }

    res.status(200).json({ success: true, key });
  } catch (error) {
    console.error('Error reporting 404:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
