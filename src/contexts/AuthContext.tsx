"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // 1. Importamos o decoder

// --- 2. Definimos os tipos do seu token e do usuário ---

// O que esperamos que exista DENTRO do token JWT
// ATENÇÃO: Ajuste estes campos se os nomes no seu token forem diferentes
interface DecodedToken {
  sub: string;         // "Subject", geralmente o username ou ID
  privilegio: string;  // O campo que você mencionou
  exp: number;         // Data de expiração (obrigatório)
}

// O objeto de usuário que vamos armazenar no estado
interface User {
  username: string;
  privilegio: string;
}

// --- 3. Atualizamos o tipo do Contexto ---
interface AuthContextType {
  user: User | null; // Trocamos 'token' por 'user'
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;    // Adicionado
  isSuporte: boolean;  // Adicionado
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // 4. O estado principal agora é o 'user'
  const [user, setUser] = useState<User | null>(null)

  // Função helper para carregar o usuário a partir de um token
  const loadUserFromToken = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);

      // 5. Verificação de expiração
      if (decoded.exp * 1000 < Date.now()) {
        console.warn("Token expirado.");
        setUser(null);
        return false;
      }

      // 6. Define o usuário no estado
      setUser({
        username: decoded.sub, // Ajuste se o campo for 'username'
        privilegio: decoded.privilegio,
      });
      return true;

    } catch (error) {
      console.error("Falha ao decodificar token:", error);
      setUser(null);
      return false;
    }
  };

  // Efeito para carregar o usuário dos cookies ao iniciar a app
  useEffect(() => {
    const storedToken = Cookies.get('jwt_token');
    if (storedToken) {
      const success = loadUserFromToken(storedToken);
      if (!success) {
        // Limpa o cookie se o token for inválido ou expirado
        Cookies.remove('jwt_token');
      }
    }
  }, []); // Roda apenas uma vez

  // Função de login
  const login = (accessToken: string, refreshToken: string) => {
    // 7. Salva o token bruto no cookie
    Cookies.set('jwt_token', accessToken, { expires: 7, secure: true, sameSite: 'strict' });
    Cookies.set('refresh_token', refreshToken, { expires: 30, secure: true, sameSite: 'strict' });
    // 8. Decodifica o token e salva o usuário no estado
    loadUserFromToken(accessToken);
  }

  // Função de logout
  const logout = () => {
    setUser(null);
    Cookies.remove('jwt_token');
    // Adicionamos o redirecionamento para garantir que o usuário saia
    window.location.href = '/login'; 
  }

  // --- 9. Derivamos os booleanos do estado 'user' ---
  const isAuthenticated = !!user;
  const isAdmin = user?.privilegio === 'Administrador';
  // Assumindo que Admin também tem permissão de Suporte
  const isSuporte = user?.privilegio === 'Suporte' || isAdmin; 

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, isSuporte }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Criar o Hook customizado (não muda)
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}