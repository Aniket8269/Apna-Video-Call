import axios from "axios";
import { createContext, useState } from "react";
import server from "../environment.js";
const AuthContext = createContext(null);

const client = axios.create({
  baseURL: server + "/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const storage = localStorage.getItem("token")
      ? localStorage
      : sessionStorage;
    const token = storage.getItem("token");
    const username = storage.getItem("username");
    if (!token || !username) return null;

    return {
      name: storage.getItem("name") || username,
      username,
      token,
    };
  });

  const saveSession = (name, username, token, remember = true) => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("username", username);
    storage.setItem("name", name);
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

  const handleLogin = async (username, password, remember = true) => {
    const response = await client.post("/login", {
      username,
      password,
    });
    saveSession(response.data.name || username, username, response.data.token, remember);
    return response.data.message;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
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
