// HttpOnly cookies are intentionally unreadable by JavaScript. Ask the server.
export async function hasAdminSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/stats', { credentials: 'same-origin', cache: 'no-store' });
    return response.ok;
  } catch { return false; }
}
