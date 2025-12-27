/**
 * Authentication Service
 * Handles all authentication-related API calls and token management
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

class AuthService {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await this.handleResponse(response);

      const token = data.access_token || data.token;
      if (token) {
        this.setToken(token);
      }

      const normalizedUser = data.user ? this.normalizeUser(data.user) : null;
      if (normalizedUser) {
        this.setUser(normalizedUser);
      }

      return {
        ...data,
        access_token: token,
        user: normalizedUser,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  getToken() {
    return localStorage.getItem("token");
  }

  setToken(token) {
    localStorage.setItem("token", token);
  }

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await this.handleResponse(response);
      const storedUser = this.getUser();
      // Handle both direct user object and wrapped user object
      const userData = data.user || data;
      const normalizedUser = this.normalizeUser({
        ...storedUser,
        ...userData,
        id: userData.user_id ?? userData.id ?? storedUser?.id,
        email: userData.email ?? storedUser?.email,
        roles: userData.roles ?? storedUser?.roles,
      });

      if (normalizedUser) {
        this.setUser(normalizedUser);
      }

      return { user: normalizedUser };
    } catch (error) {
      console.error("Token verification error:", error);
      this.logout();
      return null;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await this.handleResponse(response);
      // Handle both direct user object and wrapped user object
      const userData = data.user || data;
      const normalizedUser = this.normalizeUser(userData);
      return { user: normalizedUser };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await this.handleResponse(response);
      const storedUser = this.getUser();
      // Handle both direct user object and wrapped user object
      const userData = data.user || data;
      const normalizedUser = this.normalizeUser({
        ...storedUser,
        ...userData,
        id: userData.user_id ?? userData.id ?? storedUser?.id,
        email: userData.email ?? storedUser?.email,
        roles: userData.roles ?? storedUser?.roles,
      });

      if (normalizedUser) {
        this.setUser(normalizedUser);
      }

      return { user: normalizedUser };
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  normalizeUser(user) {
    if (!user) {
      return null;
    }

    return {
      id: user.id ?? user.user_id ?? null,
      email: user.email ?? "",
      fullName: user.full_name ?? user.fullName ?? "",
      roles: Array.isArray(user.roles) ? user.roles : [],
      avatarUrl: user.avatar_url ?? user.avatarUrl ?? "",
      createdAt: user.created_at ?? user.createdAt ?? null,
      updatedAt: user.updated_at ?? user.updatedAt ?? null,
    };
  }

  async getUsersForAssignment() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/users/for-assignment`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await this.handleResponse(response);
      // Handle both array format and wrapped array format
      const usersArray = Array.isArray(data) ? data : (data?.users || []);
      return usersArray.map((user) => this.normalizeUser(user));
    } catch (error) {
      console.error("Get users for assignment error:", error);
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson ? payload?.message : payload) ||
        response.statusText ||
        "Request failed";
      throw new Error(message);
    }

    // Backend wraps responses in ApiResponseDto format: { success, message, data }
    // Extract the data field if it exists, otherwise return the payload as-is
    if (isJson && payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data;
    }

    return payload;
  }
}

const authService = new AuthService();
export default authService;
