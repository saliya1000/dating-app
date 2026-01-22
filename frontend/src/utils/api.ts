const API_URL = import.meta.env.VITE_API_URL || "/api";

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:logout"));
  }
  return res;
};

const buildHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const registerUser = async (email: string, username: string, password: string) => {
  try {
    const res = await customFetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email, username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
      throw new Error(errorData.error || `Registration failed: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network error: Unable to reach the server");
  }
};

export const dismissUser = async (token: string, userId: number) => {
  const response = await customFetch(`${API_URL}/connections/${userId}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to dismiss user");
};

export const deleteConnection = async (token: string, connectionId: number) => {
  const response = await customFetch(`${API_URL}/connections/${connectionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to disconnect");
};

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await customFetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
      throw new Error(errorData.error || `Login failed: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network error: Unable to reach the server");
  }
};

export const fetchMe = async (token: string) => {
  const res = await customFetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUserProfile = async (token: string, data: { username?: string; bio?: string; profilePic?: string | null; latitude?: number; longitude?: number }) => {
  const res = await customFetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const fetchUser = async (token: string, id: string) => {
  const res = await customFetch(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const fetchUserProfile = async (token: string, id: string) => {
  const res = await customFetch(`${API_URL}/users/${id}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const fetchUserBio = async (token: string, id?: string) => {
  const url = id ? `${API_URL}/users/${id}/bio` : `${API_URL}/users/me/bio`;
  const res = await customFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUserBio = async (
  token: string,
  data: { interest1: string; interest2: string; interest3: string; music: string; hobby: string }
) => {
  const res = await customFetch(`${API_URL}/users/me/bio`, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};


export const fetchRecommendations = async (token: string) => {
  const res = await customFetch(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};


export const sendConnectionRequest = async (token: string, recipientId: number) => {
  const res = await customFetch(`${API_URL}/connections`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ recipientId }),
  });
  return res.json();
};

export const fetchConnections = async (token: string) => {
  const res = await customFetch(`${API_URL}/connections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const fetchConnection = async (token: string, connectionId: number) => {
  const res = await customFetch(`${API_URL}/connections/${connectionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const respondToConnection = async (token: string, connectionId: number, action: "accept" | "reject") => {
  const res = await customFetch(`${API_URL}/connections/${connectionId}/${action}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};



export const fetchAdminUsers = async (token: string, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  const res = await customFetch(`${API_URL}/admin/users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const toggleUserBan = async (token: string, userId: number) => {
  const res = await customFetch(`${API_URL}/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const toggleUserActive = async (token: string, userId: number) => {
  const res = await customFetch(`${API_URL}/admin/users/${userId}/disable`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const deleteUser = async (token: string, userId: number) => {
  const res = await customFetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const fetchAdminReports = async (token: string, params?: { status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  const res = await customFetch(`${API_URL}/admin/reports?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateReport = async (token: string, reportId: number, data: { status: string; action?: string }) => {
  const res = await customFetch(`${API_URL}/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const fetchAdminStats = async (token: string) => {
  const res = await customFetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const submitReport = async (token: string, data: { reportedId: number; reason: string; details?: string }) => {
  const res = await customFetch(`${API_URL}/reports`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
};


export const fetchChatHistory = async (token: string, connectionId: number, cursor?: number) => {
  const url = cursor ? `${API_URL}/chat/${connectionId}?cursor=${cursor}` : `${API_URL}/chat/${connectionId}`;
  const res = await customFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const markMessagesRead = async (token: string, connectionId: number) => {
  const res = await customFetch(`${API_URL}/chat/${connectionId}/read`, {
    method: "POST",
    headers: buildHeaders(token),
  });
  return res.json();
};

export const fetchNotifications = async (token: string) => {
  const res = await customFetch(`${API_URL}/notifications`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) return [];
  return res.json();
};


export const fetchStats = async () => {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) return null;
  return res.json();
};
