const API_URL = "http://localhost:3000/api";

const buildHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const registerUser = async (email: string, username: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, username, password }),
  });
  return res.json();
};

export const dismissUser = async (token: string, userId: number) => {
  const res = await fetch(`${API_URL}/connections/${userId}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const fetchMe = async (token: string) => {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUserProfile = async (token: string, data: { username?: string; bio?: string; profilePic?: string | null }) => {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const fetchUser = async (token: string, id: string) => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const fetchUserBio = async (token: string, id?: string) => {
  const url = id ? `${API_URL}/users/${id}/bio` : `${API_URL}/users/me/bio`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUserBio = async (
  token: string,
  data: { interest1: string; interest2: string; interest3: string; music: string; hobby: string }
) => {
  const res = await fetch(`${API_URL}/users/me/bio`, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};

// -------- RECOMMENDATIONS --------
export const fetchRecommendations = async (token: string) => {
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// -------- CONNECTIONS --------
export const sendConnectionRequest = async (token: string, recipientId: number) => {
  const res = await fetch(`${API_URL}/connections`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ recipientId }),
  });
  return res.json();
};

export const fetchConnections = async (token: string) => {
  const res = await fetch(`${API_URL}/connections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const respondToConnection = async (token: string, connectionId: number, action: "accept" | "reject") => {
  const res = await fetch(`${API_URL}/connections/${connectionId}/${action}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// -------- CHAT --------
export const fetchChatHistory = async (token: string, connectionId: number, cursor?: number) => {
  const url = cursor ? `${API_URL}/chat/${connectionId}?cursor=${cursor}` : `${API_URL}/chat/${connectionId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};
