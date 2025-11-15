"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api"; // Nossa instância do Axios
import { getTotalPages, getPaginationItems } from "@/lib/utils"; // Funções da paginação

// Layout e Ícones
import Navbar from "@/components/layout/Navbar";
import { Loader2, Trash2, Plus, Grip } from "lucide-react"; // Adicionei o ícone 'Grip' para Módulo

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Constantes e Tipos ---
const ITEMS_PER_PAGE = 5;

// 1. Tipos atualizados para "Modulo"
interface Modulo {
  id: number | string;
  nome: string;
}

interface ModulosData {
  modulos: Modulo[];
  total: number;
  offset: number;
  limit: number;
  total_pages: number;
}

export default function ModuloPage() {
  const [nome, setNome] = useState("");
  // 2. Estado atualizado para "modulos"
  const [data, setData] = useState<ModulosData>({
    modulos: [],
    total: 0,
    offset: 0,
    limit: ITEMS_PER_PAGE,
    total_pages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingModulos, setLoadingModulos] = useState(true);

  // Estados de loading granulares
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do modal
  const [moduloParaDeletar, setModuloParaDeletar] = useState<Modulo | null>(null);

  const paginationItems = getPaginationItems(currentPage, data.total_pages);

  // --- Funções de API ---

  const fetchModulos = useCallback(async () => {
    setLoadingModulos(true);
    try {
      // 3. Endpoint da API atualizado para "/modulo/s"
      const response = await api.get("/modulo/", {
        params: { offset: currentPage, limit: ITEMS_PER_PAGE },
      });
      setData(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Aconteceu um erro ao carregar os módulos");
    } finally {
      setLoadingModulos(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const cadastrarModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    
    setIsSubmitting(true);
    try {
      // 4. Endpoint da API atualizado para "/modulo/s"
      await api.post("/modulo/", { nome });

      toast.success("Novo módulo cadastrado");
      setNome("");
      
      // 5. Apenas recarrega os dados (padrão "Refetch on Mute")
      await fetchModulos(); 

    } catch (error) {
      console.error(error);
      toast.error("Aconteceu um erro ao cadastrar novo módulo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirModulo = async () => {
    if (!moduloParaDeletar) return;

    setIsDeleting(true);
    try {
      // 6. Endpoint da API atualizado para "/modulo/s/:id"
      await api.delete(`/modulo/${moduloParaDeletar.id}/`);
      toast.success("Módulo deletado com sucesso");

      // 7. Lógica de paginação pós-exclusão
      const eraUltimoItemDaPagina = data.modulos.length === 1 && currentPage > 1;

      if (eraUltimoItemDaPagina) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchModulos(); // Recarrega a página atual
      }

    } catch (error) {
      console.error("Erro ao excluir módulo:", error);
      toast.error("Erro ao deletar módulo");
    } finally {
      setIsDeleting(false);
      setModuloParaDeletar(null);
    }
  };

  // --- Handlers de UI ---

  const handlePageChange = (page: number) => {
    if (page < 1 || page > data.total_pages || page === currentPage) return;
    setCurrentPage(page);
  };

  // --- Renderização ---
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar />
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Módulos</CardTitle>
            <CardDescription>
              Cadastre e administre os módulos do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={cadastrarModulo} className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                type="text"
                placeholder="Nome do novo módulo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="flex-grow"
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting} className="md:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </form>

            {/* Tabela de Módulos */}
            <h3 className="text-lg font-semibold mb-4">Módulos cadastrados</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Módulo</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingModulos ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : data.modulos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Nenhum módulo cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.modulos.map((modulo) => (
                      <TableRow key={modulo.id}>
                        <TableCell className="font-medium flex items-center">
                          <Grip className="mr-2 h-4 w-4 text-muted-foreground" />
                          {modulo.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setModuloParaDeletar(modulo)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {data.total_pages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {paginationItems.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(page as number); }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      aria-disabled={currentPage === data.total_pages}
                      className={currentPage === data.total_pages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
                Mostrando {data.modulos.length} de {data.total} Módulos
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Modal de Confirmação */}
      <AlertDialog 
        open={moduloParaDeletar !== null} 
        onOpenChange={(open) => !open && setModuloParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Módulo</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o módulo
              <span className="font-bold"> "{moduloParaDeletar?.nome}"</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setModuloParaDeletar(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExcluirModulo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}