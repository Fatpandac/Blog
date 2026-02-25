/**
 * 向服务器上报 404 访问日志
 */
export async function report404(url: string) {
  try {
    const timestamp = new Date().toISOString();
    const referer = document.referrer;
    const userAgent = navigator.userAgent;

    const response = await fetch('/api/report-404', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        timestamp,
        referer,
        userAgent,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to report 404:', await response.text());
      return false;
    }

    const result = await response.json();
    console.log('404 logged successfully:', result.key);
    return true;
  } catch (error) {
    console.error('Error reporting 404:', error);
    return false;
  }
}
