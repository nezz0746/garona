import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  palier: number;
} | null;

export type AuthContextType = {
  user: AuthUser;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

// API base URL
// Use local IP for physical device, localhost for simulator
import { Platform } from "react-native";
export const API_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://192.168.1.58:3001"
  : process.env.EXPO_PUBLIC_API_URL;
