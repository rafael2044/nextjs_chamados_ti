"use client"; // Necessário para hooks como useAuth, useState e useRouter

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Hooks e Contexto
import { useAuth } from "@/contexts/AuthContext";

// Logo
import logo from "@/assets/Logo.png"; // Ajuste o caminho para sua logo

// Componentes UI (shadcn)
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Ícones
import { Menu } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, isSuporte, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Redireciona para o login após sair
    closeMobileMenu(); // Fecha o menu mobile se estiver aberto
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Define os links com base na autenticação
  const navLinks = isAuthenticated ? (
    <>

      <Button variant="link" asChild onClick={closeMobileMenu}>
        <Link href="/chamados/novo">Abrir Chamado</Link>
      </Button>
      <Button variant="link" asChild onClick={closeMobileMenu}>
        <Link href="/chamados">Listar Chamados</Link>
      </Button>
      {isAdmin && (
        <>
          <Button variant="link" asChild onClick={closeMobileMenu}>
            <Link href="/unidades">Unidades</Link>
          </Button>
          <Button variant="link" asChild onClick={closeMobileMenu}>
            <Link href="/modulos">Módulos</Link>
          </Button>
          <Button variant="link" asChild onClick={closeMobileMenu}>
            <Link href="/usuarios">Usuários</Link>
          </Button>
        </>
      )}
      <Button variant="outline" onClick={handleLogout}>
        Sair
      </Button>
    </>
  ) : (
    <>
      <Link href="/login" passHref>
        <Button variant="ghost" onClick={closeMobileMenu}>Entrar</Button>
      </Link>
      <Link href="/registrar" passHref>
        <Button variant="default" onClick={closeMobileMenu}>Registrar</Button>
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src={logo} alt="Logo" height={128} width={128} />
          <span className="font-bold hidden sm:inline-block">Sistema de Chamados</span>
        </Link>

        {/* Links do Desktop (escondidos no mobile) */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks}
        </div>

        {/* Botão do Menu Mobile (apenas visível no mobile) */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <Separator className="my-4" />
              {/* Links do Menu Mobile (empilhados verticalmente) */}
              <div className="flex flex-col items-start gap-2">
                {navLinks}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}