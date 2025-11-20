const API_URL = "http://localhost:4000";

export const registerUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const fetchMe = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// -------- PROFILE --------
export const fetchProfile = async (token: string) => {
  const res = await fetch(`${API_URL}/me/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};
export const updateProfile = async (token: string, data: Record<string, any>) => {
  // Add multipart handling for profilePic if still needed
  const res = await fetch(`${API_URL}/me/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

// -------- RECOMMENDATIONS --------
export const fetchRecommendations = async (token: string) => {
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json(); // expects: [id, id, ...]
};
export const dismissRecommendation = async (token: string, userId: number) => {
  await fetch(`${API_URL}/recommendations/${userId}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const connectWithUser = async (token: string, userId: number) => {
  await fetch(`${API_URL}/connections/${userId}/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// -------- CONNECTIONS --------
export const fetchConnections = async (token: string) => {
  const res = await fetch(`${API_URL}/connections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json(); // expects: [ { id, status }, ... ]
};
export const acceptConnection = async (token: string, userId: number) => {
  await fetch(`${API_URL}/connections/${userId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const rejectConnection = async (token: string, userId: number) => {
  await fetch(`${API_URL}/connections/${userId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const disconnectConnection = async (token: string, userId: number) => {
  await fetch(`${API_URL}/connections/${userId}/disconnect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const cancelConnection = async (token: string, userId: number) => {
  await fetch(`${API_URL}/connections/${userId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// -------- USER PROFILES --------
export const fetchUserProfile = async (token: string, userId: number) => {
  const res = await fetch(`${API_URL}/users/${userId}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// -------- CHAT --------
export const fetchChatHistory = async (token: string, userId: number, page = 1) => {
  const res = await fetch(`${API_URL}/chats/${userId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};
export const sendMessageAPI = async (token: string, userId: number, content: string) => {
  const res = await fetch(`${API_URL}/chats/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  return res.json();
};
export const markChatRead = async (token: string, userId: number) => {
  await fetch(`${API_URL}/chats/${userId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
};

// -------- BADGE COUNTS (for nav) --------
export const fetchBadgeCounts = async (token: string) => {
  const res = await fetch(`${API_URL}/notifications/badge-counts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json(); // expects: { unreadChats: number, incomingRequests: number }
};
