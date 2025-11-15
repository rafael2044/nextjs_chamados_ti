"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getTotalPages, getPaginationItems } from "@/lib/utils";

// Layout e Ícones
import Navbar from "@/components/layout/Navbar";
import { Loader2, Trash2, Plus, Users, Search, UserCheck, KeySquare } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // 1. Novo componente importado

// --- Constantes e Tipos ---
const ITEMS_PER_PAGE = 5;

interface Privilegio {
  id: number | string;
  nome: string;
}

interface User {
  id: number | string;
  username: string;
  privilegio: Privilegio;
}

interface UsersData {
  users: User[];
  total: number;
  offset: number;
  limit: number;
  total_pages: number;
}

export default function UsuarioPage() {
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [privilegioId, setPrivilegioId] = useState<string>(""); // 2. Armazena o ID do <Select>

  // Estados dos Dados
  const [data, setData] = useState<UsersData>({
    users: [],
    total: 0,
    offset: 0,
    limit: ITEMS_PER_PAGE,
    total_pages: 0,
  });
  const [privilegios, setPrivilegios] = useState<Privilegio[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // Estados de Loading (Granulares)
  const [isLoadingPrivilegios, setIsLoadingPrivilegios] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do Modal
  const [userParaDeletar, setUserParaDeletar] = useState<User | null>(null);

  const paginationItems = getPaginationItems(currentPage, data.total_pages);

  // --- Funções de API ---

  // Carrega os privilégios (para o dropdown) uma vez no mount
  useEffect(() => {
    const fetchPrivilegios = async () => {
      setIsLoadingPrivilegios(true);
      try {
        const response = await api.get("/privilegio/");
        setPrivilegios(response.data);
        // 3. Define o primeiro privilégio como padrão no formulário
        if (response.data?.length > 0) {
          setPrivilegioId(String(response.data[0]?.id));
        }
      } catch (err) {
        console.error(err);
        toast.error("Aconteceu um erro ao carregar os privilégios");
      } finally {
        setIsLoadingPrivilegios(false);
      }
    };
    fetchPrivilegios();
  }, []); // Roda apenas uma vez

  // Carrega os usuários (com paginação e busca)
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await api.get("/user/", {
        params: { 
          offset: currentPage, 
          limit: ITEMS_PER_PAGE, 
          search: search || undefined // Envia 'search' apenas se não for vazio
        },
      });
      setData(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Aconteceu um erro ao carregar os usuários");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentPage, search]); // 4. Recarrega quando a página ou a busca mudam

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Roda quando 'fetchUsers' (ou suas dependências) mudam

  // Cadastrar novo usuário (Padrão "Refetch on Mute")
  const cadastrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    try {
      const newUser = await api.post("/user/", {
        username: nome,
        password,
        privilegio: Number(privilegioId), // 5. Envia o ID do estado
      });

      toast.success("Usuário cadastrado com sucesso");
      // 6. Reseta o formulário
      setNome("");
      setPassword("");
      if (privilegios.length > 0) {
        setPrivilegioId(String(privilegios[0].id));
      }
      
      // 7. Apenas recarrega os dados. Sem manipulação manual!
      await fetchUsers();

    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
        toast.warning("Este nome de usuário já está em uso.");
      } else {
        toast.error("Aconteceu um erro ao cadastrar o usuário");
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Excluir usuário (Padrão "Refetch on Mute")
  const handleExcluirUsuario = async () => {
    if (!userParaDeletar) return;
    setIsDeleting(true);
    try {
      await api.delete(`/user/${userParaDeletar.id}/`);
      toast.success(`O usuário ${userParaDeletar.username} foi excluido.`);

      // 8. Lógica de paginação pós-exclusão
      const eraUltimoItemDaPagina = data.users.length === 1 && currentPage > 1;
      if (eraUltimoItemDaPagina) {
        setCurrentPage(currentPage - 1); // Dispara o useEffect
      } else {
        await fetchUsers(); // Apenas recarrega a página atual
      }

    } catch (error) {
      console.error("Erro ao tentar excluir usuário:", error);
      toast.error("Erro ao tentar excluir usuário");
    } finally {
      setIsDeleting(false);
      setUserParaDeletar(null);
    }
  };

  // --- Handlers de UI ---
  const handlePageChange = (page: number) => {
    if (page < 1 || page > data.total_pages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // 9. Reseta para a página 1 a cada nova busca
  };

  // 10. Handler para o componente <Select>
  const handlePrivilegioChange = (value: string) => {
    setPrivilegioId(value);
  };
  
  // 11. Loading inicial da página (esperando privilégios)
  if (isLoadingPrivilegios) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // --- Renderização ---
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar />
      <main className="container mx-auto max-w-6xl p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Cadastre e administre os usuários do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 12. Formulário com <Select> */}
            <form onSubmit={cadastrarUsuario} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
              <div className="space-y-2">
                <label>Nome do usuário</label>
                <Input
                  required
                  disabled={isFormSubmitting}
                  placeholder="ex: joao.silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label>Senha</label>
                <Input
                  required
                  disabled={isFormSubmitting}
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-0">
                <label>Privilégio</label>
                {/* 13. Componente <Select> do shadcn */}
                <Select
                  value={privilegioId}
                  onValueChange={handlePrivilegioChange}
                  disabled={isFormSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um privilégio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {privilegios.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isFormSubmitting} className="md:w-full">
                {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </form>

            {/* 14. Barra de Busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar usuário..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Tabela de Usuários */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead><UserCheck className="h-4 w-4 inline mr-1" /> Nome</TableHead>
                    <TableHead><KeySquare className="h-4 w-4 inline mr-1" /> Privilégio</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : data.users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.users.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-mono">{usuario.id}</TableCell>
                        <TableCell className="font-medium">{usuario.username}</TableCell>
                        <TableCell>{usuario.privilegio.nome}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setUserParaDeletar(usuario)}
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
              Mostrando {data.users.length} de {data.total} Usuários
              {search && ` (filtrados por: "${search}")`}
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Modal de Confirmação */}
      <AlertDialog 
        open={userParaDeletar !== null} 
        onOpenChange={(open) => !open && setUserParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o usuário 
              <span className="font-bold"> "{userParaDeletar?.username}"</span>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setUserParaDeletar(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExcluirUsuario}
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