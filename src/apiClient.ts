// Use local backend during development, production URL otherwise.
// Backend server.js listens on PORT env or 3000 by default.
export const BASE_URL = 'https://freedom-tech.onrender.com';

async function handleResponse(response: Response) {
  const text = await response.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  console.log('[API] Response', {
    url: response.url,
    status: response.status,
    ok: response.ok,
    bodyPreview: text.slice(0, 200),
  });

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) ||
      (text && !text.startsWith('<') ? text : 'Something went wrong. Please try again.');
    console.error('[API] Error response', { url: response.url, status: response.status, bodyPreview: text.slice(0, 200) });
    throw new Error(message);
  }

  // If body was not JSON or empty, just return raw text
  return data ?? text;
}

export async function familySignup(payload: {
  name: string;
  email: string;
  password: string;
  relation: string;
  inmateId: string;
}) {
  const res = await fetch(`${BASE_URL}/family/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// Family wallet APIs

export interface FamilyWalletState {
  balance: number;
  currentPlan: 'bronze' | 'silver' | 'gold' | null;
  currentPlanPurchasedAt: string | null;
  planExpiry: {
    purchasedAt: string;
    expiresAt: string;
    daysRemaining: number;
  } | null;
}

export async function getFamilyWallet(token: string): Promise<FamilyWalletState> {
  const res = await fetch(`${BASE_URL}/family/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function addFamilyWalletBalance(token: string, amount: number): Promise<{ balance: number }> {
  const res = await fetch(`${BASE_URL}/family/wallet/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  return handleResponse(res);
}

export async function selectFamilyPlan(
  token: string,
  plan: 'bronze' | 'silver' | 'gold',
): Promise<FamilyWalletState> {
  const res = await fetch(`${BASE_URL}/family/wallet/select-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });
  return handleResponse(res);
}

export interface PublicPricing {
  tabletAndroidMonthly: number;
  tabletIosMonthly: number;
  bronzeMonthly: number;
  silverMonthly: number;
  goldMonthly: number;
  moviePrice: number;
  gamePrice: number;
  songPrice: number;
  creditsNote: string;
  loadFee: number;
}

export async function getPublicPricing(): Promise<PublicPricing> {
  const res = await fetch(`${BASE_URL}/pricing`);
  return handleResponse(res);
}

export async function getFamilyCalls(token: string) {
  const res = await fetch(`${BASE_URL}/family/calls`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function createFamilyCall(
  token: string,
  payload: { scheduledAt: string; notes?: string },
) {
  const res = await fetch(`${BASE_URL}/family/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function familyLogin(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${BASE_URL}/family/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function lookupInmate(inmateId: string) {
  const trimmed = inmateId.trim();
  if (!trimmed) {
    throw new Error('Inmate ID is required');
  }

  const res = await fetch(`${BASE_URL}/inmates/lookup/${encodeURIComponent(trimmed)}`);
  return handleResponse(res);
}

export async function getFamilyThreads(token: string) {
  const res = await fetch(`${BASE_URL}/family/messages/threads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function getFamilyThreadMessages(token: string, inmateId: string) {
  const res = await fetch(`${BASE_URL}/family/messages/threads/${encodeURIComponent(inmateId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function sendFamilyMessage(token: string, inmateId: string, body: string) {
  const res = await fetch(`${BASE_URL}/family/messages/threads/${encodeURIComponent(inmateId)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });

  return handleResponse(res);
}

export async function getFamilyScheduleEvents(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/schedule/events`, {
    headers,
  });

  return handleResponse(res);
}

export async function getFamilyRequests(token: string) {
  const res = await fetch(`${BASE_URL}/family/requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function createFamilyRequest(
  token: string,
  payload: { type: string; title: string; description: string; priority?: 'low' | 'normal' | 'high' },
) {
  const res = await fetch(`${BASE_URL}/family/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}
