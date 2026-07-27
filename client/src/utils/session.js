const SESSION_KEY = "levgo.session";

export function readSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function token() {
  return readSession()?.token ?? null;
}

