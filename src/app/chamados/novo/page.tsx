"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

// Layout e Ícones
import Navbar from "@/components/layout/Navbar";
import { Loader2, Send, FilePlus, Building, Grip, Hourglass, CheckSquare } from "lucide-react";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Importando Label
import { Textarea } from "@/components/ui/textarea"; // 1. Novo componente
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// --- Tipos ---
interface Unidade {
  id: number | string;
  nome: string;
}

interface Modulo {
  id: number | string;
  nome: string;
}

export default function ChamadoFormPage() {
  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [setor, setSetor] = useState("");
  const [moduloId, setModuloId] = useState("");
  const [urgencia, setUrgencia] = useState("Média");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);

  // Estados de Dados
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  
  // Estados de UI
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ref para o input de arquivo
  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega Unidades e Módulos no mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      try {
        // 2. Carrega ambos em paralelo
        const [unidadesResp, modulosResp] = await Promise.all([
          api.get('/unidade'), // Assume que retorna { unidades: [...] }
          api.get('/modulo')  // Assume que retorna { modulos: [...] }
        ]);

        const unidadesData = unidadesResp.data.unidades || [];
        const modulosData = modulosResp.data.modulos || [];

        setUnidades(unidadesData);
        setModulos(modulosData);

        // 3. Define valores padrão
        if (unidadesData.length > 0) {
          setUnidadeId(String(unidadesData[0].id));
        }
        if (modulosData.length > 0) {
          setModuloId(String(modulosData[0].id));
        }
        setUrgencia("Média");

      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados do formulário.");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchInitialData();
  }, []); // Roda apenas uma vez

  // Função para resetar o formulário
  const resetForm = () => {
    setTitulo("");
    setSetor("");
    setDescricao("");
    setAnexo(null);
    if (inputRef.current) {
      inputRef.current.value = ""; // Limpa o input de arquivo
    }
    // Reseta para os padrões
    if (unidades.length > 0) setUnidadeId(String(unidades[0].id));
    if (modulos.length > 0) setModuloId(String(modulos[0].id));
    setUrgencia("Média");
  };

  // 4. Lida com o envio principal (após confirmação do modal)
  const handleConfirmarEnvio = async () => {
    setIsSubmitting(true);

    // 5. Como temos um arquivo, TUDO deve ser enviado como FormData
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('unidade', unidadeId); // Backend deve esperar 'unidade_id'
    formData.append('setor', setor);
    formData.append('modulo', moduloId); // Backend deve esperar 'modulo_id'
    formData.append('urgencia', urgencia);
    formData.append('descricao', descricao);

    try {

      const response = await api.post('/chamados', formData);

      if (anexo) {
        const formDataAnexo = new FormData();
        formDataAnexo.append("file", anexo);
        const resp = await api.post(`/chamados/${response?.data?.chamado_id}/anexo`, formDataAnexo, {
          headers: {"Content-Type": "multipart/form-data"}
        });
        toast.success(resp?.data.message);
    }

      toast.success(response.data.message || "Chamado aberto com sucesso!");
      resetForm();

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Erro ao enviar chamado");
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  // 7. O 'onSubmit' do formulário apenas abre o modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  // 8. Handler para o input de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAnexo(e.target.files[0]);
    } else {
      setAnexo(null);
    }
  };

  // 9. Tela de loading inicial
  if (isLoadingData) {
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
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <FilePlus className="mr-2" />
              Abrir Novo Chamado
            </CardTitle>
            <CardDescription>
              Preencha os campos abaixo para registrar sua solicitação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 10. Formulário principal */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Chamado</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Impressora não funciona"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Grid para Unidade e Setor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidade"><Building className="h-4 w-4 inline mr-1" /> Unidade</Label>
                  <Select
                    value={unidadeId}
                    onValueChange={setUnidadeId}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger id="unidade" className="w-full">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">Setor</Label>
                  <Input
                    id="setor"
                    placeholder="Ex: Financeiro"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Grid para Módulo e Urgência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modulo"><Grip className="h-4 w-4 inline mr-1" /> Módulo</Label>
                  <Select
                    value={moduloId}
                    onValueChange={setModuloId}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger id="modulo" className="w-50">
                      <SelectValue placeholder="Selecione o módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modulos.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgencia"><Hourglass className="h-4 w-4 inline mr-1" /> Urgência</Label>
                  <Select
                    value={urgencia}
                    onValueChange={setUrgencia}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger id="urgencia" className="w-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição Detalhada</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o problema em detalhes..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={isSubmitting}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anexo">Anexo (Opcional)</Label>
                <Input
                  id="anexo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  ref={inputRef}
                  disabled={isSubmitting}
                  className="file:text-sm file:font-medium"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Enviar Chamado
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* 11. Modal de Confirmação */}
      <AlertDialog
        open={isModalOpen}
        onOpenChange={(open) => !open && setIsModalOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Abertura</AlertDialogTitle>
            <AlertDialogDescription>
              Você deseja confirmar a abertura deste chamado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarEnvio}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckSquare className="mr-2 h-4 w-4" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}