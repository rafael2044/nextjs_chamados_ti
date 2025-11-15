// Importa o Navbar que acabamos de criar
import Navbar from "@/components/layout/Navbar"; 

// Componentes UI para a página
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FilePlus, List } from "lucide-react"; // Ícones de exemplo

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. Navbar no topo */}
      <Navbar />

      {/* 2. Conteúdo Principal da Página */}
      <main className="flex-grow">
        {/* Seção Hero */}
        <section className="container mx-auto max-w-4xl text-center p-10 md:p-20">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Bem-vindo ao Sistema de Chamados
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Sua solução centralizada para gerenciar solicitações, 
            rastrear problemas e otimizar o suporte de T.I.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/chamados/novo" passHref>
              <Button size="lg">
                <FilePlus className="mr-2 h-4 w-4" /> Abrir um Chamado
              </Button>
            </Link>
            <Link href="/chamados" passHref>
              <Button size="lg" variant="outline">
                <List className="mr-2 h-4 w-4" /> Ver meus Chamados
              </Button>
            </Link>
          </div>
        </section>

        {/* Seção de Features (Exemplo) */}
        <section className="bg-muted py-12">
          <div className="container mx-auto grid max-w-5xl gap-6 sm:grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Rápido e Fácil</CardTitle>
                <CardDescription>Abra um novo chamado em segundos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Nossa interface simplificada permite que você relate um problema sem burocracia.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Acompanhe Tudo</CardTitle>
                <CardDescription>Veja o status de todos os seus chamados.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Saiba exatamente quem está cuidando da sua solicitação e qual o progresso.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Base de Conhecimento</CardTitle>
                <CardDescription>Encontre soluções rápidas.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Acesse nossos artigos e tutoriais para resolver problemas comuns.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* 3. Rodapé (Footer) */}
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Castelo Branco Informática. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}