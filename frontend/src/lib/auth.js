import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('feedbackvault_token');
    const storedUser = localStorage.getItem('feedbackvault_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      authAPI.getMe()
        .then((response) => {
          setUser(response.data);
          localStorage.setItem('feedbackvault_user', JSON.stringify(response.data));
        })
        .catch(() => {
          // Token invalid, clear storage
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('feedbackvault_token', newToken);
    localStorage.setItem('feedbackvault_user', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const register = async (name, email, password, userType = 'customer') => {
    const response = await authAPI.register({ name, email, password, user_type: userType });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('feedbackvault_token', newToken);
    localStorage.setItem('feedbackvault_user', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('feedbackvault_token');
    localStorage.removeItem('feedbackvault_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isBusinessOwner = user?.user_type === 'business_owner';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      isBusinessOwner,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
