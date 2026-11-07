import axios from "axios";
import { createContext, useState } from "react";

const AuthContext = createContext(null);

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (!token || !username) return null;

    return {
      name: localStorage.getItem("name") || username,
      username,
      token,
    };
  });

  const saveSession = (name, username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("name", name);
    setUserData({ name, username, token });
  };

  const handleRegister = async (name, username, password) => {
    const response = await client.post("/register", {
      name,
      username,
      password,
    });

    const loginResponse = await client.post("/login", {
      username,
      password,
    });
    saveSession(name, username, loginResponse.data.token);

    return response.data.message;
  };

  const handleLogin = async (username, password) => {
    const response = await client.post("/login", {
      username,
      password,
    });
    saveSession(username, username, response.data.token);
    return response.data.message;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    setUserData(null);
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    logout,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export default AuthContext;
