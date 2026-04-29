import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('versiculus_user');
    const storedToken = localStorage.getItem('versiculus_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('versiculus_user');
        localStorage.removeItem('versiculus_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, newToken: string) => {
    localStorage.setItem('versiculus_user', JSON.stringify(newUser));
    localStorage.setItem('versiculus_token', newToken);
    setUser(newUser);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('versiculus_user');
    localStorage.removeItem('versiculus_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
