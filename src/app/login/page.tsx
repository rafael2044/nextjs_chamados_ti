"use client"; // Obrigatório para componentes com interatividade e hooks

import { useState } from "react";
import Image from "next/image"; // Melhor para otimização de imagens no Next.js
import { useRouter } from "next/navigation"; // Hook de navegação do App Router

// Hooks e Serviços
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Componentes UI (shadcn)
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import logo from "@/assets/Logo.png";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/login", form);
      const { access_token, refresh_token } = res.data;

      login(access_token, refresh_token); 
      
      toast.success("Login realizado com sucesso!", {
        description: "Redirecionando para a página de chamados.",
      });

    } catch (err: any) {
      console.error(err);

      toast.error("Erro ao autenticar", {
        description: err.response?.data?.detail || "Usuário ou senha inválidos.",
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Image
            src={logo} 
            alt="Logo da Empresa" 
            height={128} 
            width={128}
            priority
            className="mx-auto"
          />
          <CardTitle className="text-2xl font-bold pt-4">Bem-Vindo(a)</CardTitle>
          <CardDescription>Insira suas credenciais para acessar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="seu.usuario"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {/* Mostra o spinner DENTRO do botão */}
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "Validando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}