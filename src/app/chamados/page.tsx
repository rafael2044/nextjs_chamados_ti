"use client";

import { useEffect, useState, useCallback, FormEvent, ChangeEvent } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getTotalPages, getPaginationItems } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext"; // 1. Importando o useAuth

// Layout e Ícones
import Navbar from "@/components/layout/Navbar";
import {
  Loader2, Trash2, Plus, Search, Filter, Send, Pencil, CheckCheck,
  Building, Grip, Hourglass, User, Calendar, Paperclip, MessageSquare,
  History, Info, PackageOpen, X
} from "lucide-react";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"; // 2. Novo componente
import { Badge } from "@/components/ui/badge"; // 3. Novo componente

// --- Constantes e Tipos ---
const ITEMS_PER_PAGE = 5;
const URGENCIAS_OPTIONS = ["Baixa", "Média", "Alta"];

// (Supondo os tipos da sua API)
interface Atendimento {
  id: number;
  descricao: string;
  data_atendimento: string;
  suporte?: string; // Ajuste se o nome for diferente
  url_anexo?: string;
}
interface Chamado {
  id: number;
  titulo: string;
  unidade: string;
  setor: string;
  modulo: string;
  solicitante: string;
  status: string; // Ajustado para objeto
  urgencia: "Baixa" | "Média" | "Alta";
  descricao: string;
  data_abertura: string;
  data_fechamento?: string;
  url_anexo?: string;
  atendimentos: Atendimento[];
}
interface ChamadosData {
  chamados: Chamado[];
  total: number;
  total_pages: number;
}
interface Unidade { id: number; nome: string; }
interface Modulo { id: number; nome: string; }
interface Status { id: number; nome: string; }

// 4. Tipo para o novo estado de modal unificado
type ModalState =
  | { type: 'atender'; chamado: Chamado }
  | { type: 'editar'; chamado: Chamado }
  | { type: 'excluir'; chamado: Chamado }
  | { type: 'finalizar'; chamado: Chamado }
  | null;


export default function ChamadosPage() {
  // 5. Hook de Autenticação
  // (Assumindo que seu useAuth() retorna 'isAdmin' e 'isSuporte')
  const { isAdmin, isSuporte } = useAuth(); 

  // Estados de Dados
  const [data, setData] = useState<ChamadosData>({
    chamados: [], total: 0, total_pages: 0,
  });
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);

  // Estados de Filtro e Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroUrgencia, setFiltroUrgencia] = useState('');

  // Estados de UI
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingChamados, setIsLoadingChamados] = useState(true);
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false); // Para todos modais
  const [modalState, setModalState] = useState<ModalState>(null); // 6. Estado de modal unificado
  
  const paginationItems = getPaginationItems(currentPage, data.total_pages);
  const isFiltered = search || filtroUnidade || filtroModulo || filtroStatus || filtroUrgencia;

  // --- 1. DATA FETCHING ---

  // Carrega os dados dos filtros (Unidades, Módulos, Status)
  const fetchFilterData = useCallback(async () => {
    setIsLoadingFilters(true);
    try {
      const [unidadesResp, modulosResp, statusResp] = await Promise.all([
        api.get('/unidade/'), // Assume que retorna { unidades: [...] }
        api.get('/modulo/'),  // Assume que retorna { modulos: [...] }
        api.get('/status/')    // Assume que retorna [...]
      ]);
      
      setUnidades(unidadesResp.data.unidades || []);
      setModulos(modulosResp.data.modulos || []);
      setStatusList(statusResp.data || []);

    } catch (err) {
      console.error("Erro ao carregar dados dos filtros", err);
      toast.error("Erro ao carregar opções de filtro");
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  // Carrega os chamados (com filtros)
  const fetchChamados = useCallback(async () => {
    setIsLoadingChamados(true);
    try {
      const params = new URLSearchParams({
        offset: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });
      // Adiciona filtros apenas se estiverem definidos
      if (search) params.append('search', search);
      if (filtroUnidade) params.append('unidade_id', filtroUnidade);
      if (filtroModulo) params.append('modulo_id', filtroModulo);
      if (filtroStatus) params.append('status_id', filtroStatus);
      if (filtroUrgencia) params.append('urgencia', filtroUrgencia);

      const dataResp = await api.get('/chamados/', { params });
      setData(dataResp.data);

    } catch (err) {
      console.error(err);
      toast.error("Aconteceu um erro ao carregar os chamados");
    } finally {
      setIsLoadingChamados(false);
    }
  }, [currentPage, search, filtroModulo, filtroUnidade, filtroStatus, filtroUrgencia]);
  
  // Efeitos para carregar dados
  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    fetchChamados();
  }, [fetchChamados]);

  // --- 2. MUTAÇÕES (CRUD) ---
  // 7. Todos os métodos de mutação agora usam "Refetch on Mute"

  const onInsertAtendimento = async (chamadoId: number, formData: FormData) => {
    setIsSubmittingMutation(true);
    try {
      await api.post(`/atendimento/${chamadoId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Atendimento registrado com sucesso");
      setModalState(null); // Fecha o modal
      await fetchChamados(); // Recarrega os dados
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar atendimento");
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const onFinalizarChamado = async (chamadoId: number) => {
    setIsSubmittingMutation(true);
    try {
      await api.patch(`/chamados/${chamadoId}/finalizar/`); // Usando PATCH
      toast.success(`Chamado #${chamadoId} finalizado.`);
      setModalState(null);
      await fetchChamados();
    } catch (error) {
      console.error(error);
      toast.error("Aconteceu um erro ao tentar finalizar o chamado.");
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const onUpdateChamado = async (chamadoId: number, chamadoUpdate: any) => {
    setIsSubmittingMutation(true);
    try {
      await api.patch(`/chamados/${chamadoId}/`, chamadoUpdate);
      toast.success(`Chamado #${chamadoId} atualizado`);
      setModalState(null);
      await fetchChamados();
    } catch (error) {
      console.error(error);
      toast.error("Aconteceu um erro ao tentar atualizar o chamado.");
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const onExcluirChamado = async (chamadoId: number) => {
    setIsSubmittingMutation(true);
    try {
      await api.delete(`/chamados/${chamadoId}/`);
      toast.success(`Chamado #${chamadoId} excluido.`);
      setModalState(null);

      // Lógica de paginação (mantida do seu código)
      const eraUltimoItemDaPagina = data.chamados.length === 1 && currentPage > 1;
      if (eraUltimoItemDaPagina) {
        setCurrentPage(currentPage - 1); // Dispara o useEffect
      } else {
        await fetchChamados(); // Apenas recarrega
      }
    } catch (error) {
      console.error(error);
      toast.error("Aconteceu um erro ao tentar excluir o chamado.");
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  // --- 3. HANDLERS DE UI ---

  const handlePageChange = (page: number) => {
    if (page < 1 || page > data.total_pages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Funções "High-Order" para os filtros <Select>
  const handleFilterChange = (setter: (value: string) => void) => {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  };

  // Loading inicial da página (esperando filtros)
  if (isLoadingFilters) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar />
      <main className="container mx-auto max-w-7xl p-4 md:p-8">
        
        {/* --- Card de Filtros --- */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Filter className="mr-2" /> Filtros de Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Filtro Search (ocupa 2 colunas no desktop) */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="search">Título ou ID do Chamado</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por título, ID, setor..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros Select */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="filtroUnidade">Unidade</Label>
                <Select value={filtroUnidade} onValueChange={handleFilterChange(setFiltroUnidade)}>
                  <SelectTrigger id="filtroUnidade" className="w-full">
                    <SelectValue placeholder="Todas as Unidades"/>
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="filtroModulo">Módulo</Label>
                <Select value={filtroModulo} onValueChange={handleFilterChange(setFiltroModulo)}>
                  <SelectTrigger id="filtroModulo">
                    <SelectValue placeholder="Todos os Módulos" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulos.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="filtroStatus">Status</Label>
                <Select value={filtroStatus} onValueChange={handleFilterChange(setFiltroStatus)}>
                  <SelectTrigger id="filtroStatus">
                    <SelectValue placeholder="Todos os Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Lista de Chamados (Accordion) --- */}
        <h2 className="text-2xl font-semibold mb-4">Lista de Chamados</h2>
        {isLoadingChamados && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoadingChamados && data.chamados.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-10">
            <PackageOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum chamado encontrado</h3>
            <p className="text-muted-foreground">
              {isFiltered ? 'Tente ajustar seus filtros.' : 'Parece que não há chamados abertos.'}
            </p>
          </Card>
        )}
        {!isLoadingChamados && data.chamados.length > 0 && (
          <Accordion type="single" collapsible className="w-full space-y-2">
            
            {/* 8. Mapeamento do ChamadoItem (agora como AccordionItem) */}
            {data.chamados.map((chamado) => (
              <AccordionItem value={`item-${chamado.id}`} key={chamado.id} className="border bg-background rounded-lg shadow-sm">
                
                {/* Cabeçalho (Trigger) */}
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <h4 className="font-semibold text-lg text-primary">{chamado.titulo}</h4>
                      <div className="text-sm text-muted-foreground space-x-2">
                        <span><Info className="h-4 w-4 inline" /> ID: {chamado.id}</span>
                        <span><Building className="h-4 w-4 inline" /> {chamado.unidade || 'N/A'}</span>
                        <span><User className="h-4 w-4 inline" /> {chamado.solicitante || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-4">
                      <Badge variant={
                        chamado.urgencia === 'Alta' ? 'destructive' : 
                        chamado.urgencia === 'Média' ? 'secondary' : 'default'
                      }>
                        <Hourglass className="h-3 w-3 mr-1" /> {chamado.urgencia}
                      </Badge>
                      <Badge className={
                        chamado.status === 'Concluído' ? 'bg-green-600' :
                        chamado.status === 'Em andamento' ? 'bg-blue-600' : 'bg-yellow-500'
                      }>
                        {chamado.status}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Conteúdo (Content) */}
                <AccordionContent className="p-4 border-t">
                  <div className="mb-4 space-y-2">
                    <p><strong>Descrição:</strong> {chamado.descricao}</p>
                    <p><strong>Setor:</strong> {chamado.setor}</p>
                    <p><strong>Módulo:</strong> {chamado.modulo || 'N/A'}</p>
                    <p><strong>Abertura:</strong> {new Date(chamado.data_abertura).toLocaleString()}</p>
                    {chamado.data_fechamento && (
                      <p><strong>Fechamento:</strong> {new Date(chamado.data_fechamento).toLocaleString()}</p>
                    )}
                    {chamado.url_anexo && (
                      <Button variant="link" asChild>
                        <a href={chamado.url_anexo} target="_blank" rel="noopener noreferrer">
                          <Paperclip className="h-4 w-4 mr-1" /> Ver anexo do chamado
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Botões de Ação (Condicionais) */}
                  {(isAdmin || isSuporte) && (
                    <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => setModalState({ type: 'editar', chamado })} disabled={isSubmittingMutation}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      {chamado.status !== "Concluído" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setModalState({ type: 'atender', chamado })} disabled={isSubmittingMutation}>
                            <MessageSquare className="h-4 w-4 mr-1" /> Atender
                          </Button>
                          <Button variant="default" size="sm" onClick={() => setModalState({ type: 'finalizar', chamado })} disabled={isSubmittingMutation}>
                            <CheckCheck className="h-4 w-4 mr-1" /> Finalizar
                          </Button>
                        </>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => setModalState({ type: 'excluir', chamado })} disabled={isSubmittingMutation}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  )}

                  {/* Histórico de Atendimentos */}
                  {chamado.atendimentos.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center"><History className="h-4 w-4 mr-1" /> Histórico de atendimentos</h5>
                      <div className="space-y-2">
                        {chamado.atendimentos.map((a) => (
                          <div key={a.id} className="border rounded-md p-3 bg-muted/50">
                            <p>{a.descricao}</p>
                            <small className="text-muted-foreground">
                              Por: {a.suporte || 'N/A'} em {new Date(a.data_atendimento).toLocaleString()}
                            </small>
                            {a.url_anexo && (
                              <Button variant="link" size="sm" asChild className="p-0 h-auto">
                                <a href={a.url_anexo} target="_blank" rel="noopener noreferrer">
                                  <Paperclip className="h-3 w-3 mr-1" /> Ver anexo
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Paginação */}
        {data.total_pages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
              </PaginationItem>
              {paginationItems.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? <PaginationEllipsis /> : <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page as number); }} isActive={currentPage === page}>{page}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === data.total_pages} className={currentPage === data.total_pages ? "pointer-events-none opacity-50" : ""} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Mostrando {data.chamados.length} de {data.total} chamados
          {isFiltered && ` (filtrados)`}
        </div>
      </main>

      {/* --- 5. MODAIS (agora co-localizados) --- */}

      {/* --- Modal: Editar Chamado --- */}
      {/* 9. Renderiza o Modal de Edição (antigo ModalChamado) */}
      <EditarChamadoDialog
        key={modalState?.chamado?.id} // Força o reset do estado interno do modal
        open={modalState?.type === 'editar'}
        onClose={() => setModalState(null)}
        chamado={modalState?.type === 'editar' ? modalState.chamado : null}
        unidades={unidades} // Passa os dados já carregados
        modulos={modulos} // Passa os dados já carregados
        onSubmit={onUpdateChamado}
        isLoading={isSubmittingMutation}
      />
      
      {/* --- Modal: Inserir Atendimento --- */}
      {/* 10. Renderiza o Modal de Atendimento (antigo ModalAtendimento) */}
      <AtendimentoDialog
        open={modalState?.type === 'atender'}
        onClose={() => setModalState(null)}
        chamado={modalState?.type === 'atender' ? modalState.chamado : null}
        onSubmit={onInsertAtendimento}
        isLoading={isSubmittingMutation}
      />

      {/* --- Modal: Confirmação (Excluir / Finalizar) --- */}
      {/* 11. Renderiza o AlertDialog (antigo ModalConfimation) */}
      <AlertDialog
        open={modalState?.type === 'excluir' || modalState?.type === 'finalizar'}
        onOpenChange={() => setModalState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {modalState?.type === 'excluir' ? 'Excluir Chamado' : 'Finalizar Chamado'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja {modalState?.type === 'excluir' ? 'EXCLUIR' : 'FINALIZAR'} o chamado
              <span className="font-bold"> #{modalState?.chamado?.id}</span>?
              {modalState?.type === 'excluir' && " Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingMutation}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingMutation}
              onClick={() => {
                if (modalState?.type === 'excluir') {
                  onExcluirChamado(modalState.chamado.id);
                } else if (modalState?.type === 'finalizar') {
                  onFinalizarChamado(modalState.chamado.id);
                }
              }}
              className={modalState?.type === 'excluir' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            >
              {isSubmittingMutation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modalState?.type === 'excluir' ? 'Excluir' : 'Finalizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}


// --- 6. COMPONENTES DE MODAL (agora no mesmo ficheiro) ---

// --- Componente: AtendimentoDialog (antigo ModalAtendimento) ---
interface AtendimentoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (chamadoId: number, formData: FormData) => void;
  chamado: Chamado | null;
  isLoading: boolean;
}

function AtendimentoDialog({ open, onClose, onSubmit, chamado, isLoading }: AtendimentoDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chamado) return;
    
    const formData = new FormData();
    formData.append("descricao", descricao);
    if (anexo) {
      formData.append("anexo", anexo);
    }
    onSubmit(chamado.id, formData);
  };

  if (!open || !chamado) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Realizar Atendimento - Chamado #{chamado.id}</DialogTitle>
          <DialogDescription>{chamado.titulo}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atendimento-desc">Descrição do Atendimento</Label>
            <Textarea
              id="atendimento-desc"
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atendimento-anexo">Anexo (opcional)</Label>
            <Input
              id="atendimento-anexo"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setAnexo(e.target.files ? e.target.files[0] : null)}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Enviar Atendimento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// --- Componente: EditarChamadoDialog (antigo ModalChamado) ---
interface EditarChamadoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (chamadoId: number, data: any) => void;
  chamado: Chamado | null;
  unidades: Unidade[];
  modulos: Modulo[];
  isLoading: boolean;
}

function EditarChamadoDialog({ open, onClose, onSubmit, chamado, unidades, modulos, isLoading }: EditarChamadoDialogProps) {
  
  const initialUnidadeId = String(
    unidades.find(u => u.nome === chamado?.unidade)?.id || "" 
  );
  const initialModuloId = String(
    modulos.find(m => m.nome === chamado?.modulo)?.id || ""
  );

  const [titulo, setTitulo] = useState(chamado?.titulo || "");
  const [unidadeId, setUnidadeId] = useState(initialUnidadeId);
  const [setor, setSetor] = useState(chamado?.setor || "");
  const [moduloId, setModuloId] = useState(initialModuloId);
  const [urgencia, setUrgencia] = useState(chamado?.urgencia || "Média");
  const [descricao, setDescricao] = useState(chamado?.descricao || "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!chamado) return;
    
    onSubmit(chamado.id, {
      titulo,
      unidade_id: Number(unidadeId),
      setor,
      modulo_id: Number(moduloId),
      urgencia,
      descricao
    });
  };

  if (!open || !chamado) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Mantive a largura 'max-w-3xl' para dar espaço */}
      <DialogContent className="max-w-3xl"> 
        <DialogHeader>
          <DialogTitle>Editar - Chamado #{chamado.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="edit-titulo">Título</Label>
            <Input id="edit-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={isLoading} required />
          </div>

          {/* --- CORREÇÃO AQUI --- */}
          {/* Removi o 'grid'. Cada campo agora ocupa sua própria linha. */}
          
          <div className="space-y-2">
            <Label htmlFor="edit-unidade">Unidade</Label>
            <Select value={unidadeId} onValueChange={setUnidadeId} disabled={isLoading} required>
              <SelectTrigger id="edit-unidade"><SelectValue /></SelectTrigger>
              <SelectContent>
                {unidades.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-setor">Setor</Label>
            <Input id="edit-setor" value={setor} onChange={(e) => setSetor(e.target.value)} disabled={isLoading} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-modulo">Módulo</Label>
            <Select value={moduloId} onValueChange={setModuloId} disabled={isLoading} required>
              <SelectTrigger id="edit-modulo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {modulos.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-urgencia">Urgência</Label>
            <Select value={urgencia} onValueChange={(v) => setUrgencia(v as any)} disabled={isLoading} required>
              <SelectTrigger id="edit-urgencia"><SelectValue /></SelectTrigger>
              <SelectContent>
                {URGENCIAS_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* --- FIM DA CORREÇÃO --- */}

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Descrição</Label>
            <Textarea id="edit-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={isLoading} required rows={5} />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}