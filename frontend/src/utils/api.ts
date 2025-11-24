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

export const fetchUserBio = async (token: string) => {
  const res = await fetch(`${API_URL}/users/me/bio`, {
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

// -------- CHAT (placeholders if backend not ready) --------
export const fetchChatHistory = async (token: string, userId: number, page = 1) => {
  const res = await fetch(`${API_URL}/chats/${userId}?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const sendMessageAPI = async (token: string, userId: number, content: string) => {
  const res = await fetch(`${API_URL}/chats/${userId}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ content }),
  });
  return res.json();
};

export const markChatRead = async (token: string, userId: number) => {
  await fetch(`${API_URL}/chats/${userId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
