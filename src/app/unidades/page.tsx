"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getTotalPages, getPaginationItems } from "@/lib/utils";

// Layout e Ícones
import Navbar from "@/components/layout/Navbar";
import { Loader2, Trash2, Plus } from "lucide-react";

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

interface Unidade {
  id: number | string;
  nome: string;
}

interface UnidadesData {
  unidades: Unidade[];
  total: number;
  offset: number;
  limit: number;
  total_pages: number;
}

export default function UnidadePage() {
  const [nome, setNome] = useState("");
  const [data, setData] = useState<UnidadesData>({
    unidades: [],
    total: 0,
    offset: 0,
    limit: ITEMS_PER_PAGE,
    total_pages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUnidades, setLoadingUnidades] = useState(true);

  // 1. 'isLoading' foi dividido para controle mais fino
  const [isSubmitting, setIsSubmitting] = useState(false); // Para cadastro
  const [isDeleting, setIsDeleting] = useState(false); // Para exclusão

  const [unidadeParaDeletar, setUnidadeParaDeletar] = useState<Unidade | null>(null);

  const paginationItems = getPaginationItems(currentPage, data.total_pages);

  // --- Funções de API ---

  // O useCallback é perfeito aqui.
  const fetchUnidades = useCallback(async () => {
    setLoadingUnidades(true);
    try {
      const response = await api.get("/unidade", {
        params: { offset: currentPage, limit: ITEMS_PER_PAGE },
      });
      setData(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Aconteceu um erro ao carregar as unidades");
    } finally {
      setLoadingUnidades(false);
    }
  }, [currentPage]); // Depende apenas de 'currentPage'

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]); // 2. O useEffect chama a função "cacheada" pelo useCallback

  const cadastrarUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    
    setIsSubmitting(true);
    try {
      await api.post("/unidade", { nome });

      toast.success("Nova unidade cadastrada");
      setNome("");
      
      // 3. (Refatoração) Em vez de manipular o estado, apenas recarregamos.
      // Isso garante 100% de consistência com o banco de dados.
      await fetchUnidades(); 

    } catch (error) {
      console.error(error);
      toast.error("Aconteceu um erro ao cadastrar nova unidade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirUnidade = async () => {
    if (!unidadeParaDeletar) return;

    setIsDeleting(true);
    try {
      await api.delete(`/unidade/${unidadeParaDeletar.id}`);
      toast.success("Unidade deletada com sucesso");

      // 4. (Refatoração) Lógica de paginação simplificada.
      // Se foi o último item da página (e não é a página 1),
      // volte para a página anterior.
      const eraUltimoItemDaPagina = data.unidades.length === 1 && currentPage > 1;

      if (eraUltimoItemDaPagina) {
        setCurrentPage(currentPage - 1); // Isso vai disparar o useEffect
      } else {
        await fetchUnidades(); // Apenas recarrega a página atual
      }

    } catch (error) {
      console.error("Erro ao excluir unidade:", error);
      toast.error("Erro ao deletar unidade");
    } finally {
      setIsDeleting(false);
      setUnidadeParaDeletar(null);
    }
  };

  // --- Handlers de UI ---

  const handlePageChange = (page: number) => {
    if (page < 1 || page > data.total_pages || page === currentPage) return;
    setCurrentPage(page);
  };

  // --- Renderização (O JSX abaixo é idêntico, exceto pelos 'disabled') ---
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar />
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gerenciar Unidades</CardTitle>
            <CardDescription>
              Cadastre e administre as unidades da organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={cadastrarUnidade} className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                type="text"
                placeholder="Nome da nova unidade"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="flex-grow"
                disabled={isSubmitting} // 5. Desabilitado por 'isSubmitting'
              />
              <Button type="submit" disabled={isSubmitting} className="md:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </form>

            <h3 className="text-lg font-semibold mb-4">Unidades cadastradas</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Unidade</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUnidades ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : data.unidades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Nenhuma unidade cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.unidades.map((unidade) => (
                      <TableRow key={unidade.id}>
                        <TableCell className="font-medium">{unidade.nome}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            // 6. Desabilitado por 'isDeleting'
                            disabled={isDeleting} 
                            onClick={() => setUnidadeParaDeletar(unidade)}
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
            
            {/* ... (O JSX da Paginação e do Resumo não mudou) ... */}
             {data.total_pages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
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
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page as number);
                          }}
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
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      aria-disabled={currentPage === data.total_pages}
                      className={currentPage === data.total_pages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
                Mostrando {data.unidades.length} de {data.total} Unidades
            </div>

          </CardContent>
        </Card>
      </main>

      <AlertDialog 
        open={unidadeParaDeletar !== null} 
        onOpenChange={(open) => !open && setUnidadeParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir a unidade 
              <span className="font-bold"> "{unidadeParaDeletar?.nome}"</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setUnidadeParaDeletar(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExcluirUnidade}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting} // 7. Desabilitado por 'isDeleting'
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