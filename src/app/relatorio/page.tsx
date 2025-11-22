"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Bar, BarChart, Pie, PieChart, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Mantemos o 'recharts'
import { toast } from 'sonner';
import api from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { format, parse, parseISO } from 'date-fns';
import dynamic from 'next/dynamic'; 
// --- Componentes Shadcn/ui ---
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Filter, Download, PieChartIcon, BarChart3 } from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from "@/components/ui/chart"; // Wrapper do Shadcn para o Recharts

interface ChartData {
  nome: string;
  total?: number; // Usado por Módulo, Unidade, Status
  tempo_medio?: number; // Usado por TMR
}

// Tipo específico para os dados do PDF (que só precisam de nome e total)
interface PdfData {
  nome: string;
  total: number;
}

const DynamicPDFButton = dynamic(
  () => import('@/components/pdf/DynamicPDFButton'),
  {
    ssr: false, // <-- A CORREÇÃO MÁGICA
    loading: () => (
      // Placeholder enquanto o componente do botão carrega
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    ),
  }
);
// --- PLACEHOLDERS (Substitua pelos seus) ---
// Você precisa criar/mover seus componentes de PDF para o projeto
// Ex: 'components/pdf/RelatorioUnidadePDF.tsx'


// --- UTILS (Adicione em 'lib/utils.ts' se não existir) ---
const formatarIsoParaBr = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = parseISO(isoString);
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.warn("Erro ao formatar data ISO:", isoString, error);
    return ''; // Retorna vazio se a data for inválida
  }
};

// --- Cores e Helpers (do seu código original) ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FA8072'];

// Label customizado para o gráfico de pizza (Preservado)
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// --- Componente da Página ---
export default function RelatorioPage() {
  // --- Estados para os Filtros (Preservado) ---
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // --- Estados para os Gráficos (Preservado) ---
  const [moduloData, setModuloData] = useState<ChartData[]>([]);
  const [suporteData, setSuporteData] = useState<ChartData[]>([]);
  const [isModuloLoading, setIsModuloLoading] = useState(true);
  const [tmrData, setTmrData] = useState<ChartData[]>([]);
  const [isTmrLoading, setIsTmrLoading] = useState(true);
  const [tmrUnidadeData, setTmrUnidadeData] = useState<ChartData[]>([]);
  const [isTmrUnidadeLoading, setIsTmrUnidadeLoading] = useState(true);
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [unidadeData, setUnidadeData] = useState<ChartData[]>([]);
  const [isUnidadeLoading, setIsUnidadeLoading] = useState(true);
  const [isSuporteLoading, setIsSuporteLoading] = useState(true);

  // --- Funções de Fetch de Dados (Preservado e Melhorado com Toast) ---

  const buildUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    return params.toString();
  }, [dataInicio, dataFim]);

  // Fetch Gráfico 1
  const fetchModuloData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsModuloLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/chamados-por-modulo?${params}`);
      setModuloData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de Módulo:", error);
      toast.error("Erro ao buscar dados de Módulo.");
    } finally {
      if (!isFilterRequest) setIsModuloLoading(false);
    }
  }, [buildUrlParams]);

  const fetchSuporteData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsSuporteLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/chamados-por-suporte?${params}`);
      setSuporteData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de Suporte:", error);
      toast.error("Erro ao buscar dados de Suporte.");
    } finally {
      if (!isFilterRequest) setIsSuporteLoading(false);
    }
  }, [buildUrlParams]);

  // Fetch Gráfico 2
  const fetchTmrData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsTmrLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/tmr-por-modulo?${params}`);
      setTmrData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de TMR:", error);
      toast.error("Erro ao buscar dados de TMR por Módulo.");
    } finally {
      if (!isFilterRequest) setIsTmrLoading(false);
    }
  }, [buildUrlParams]);

  // Fetch Gráfico 3
  const fetchTmrUnidadeData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsTmrUnidadeLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/tmr-por-unidade?${params}`);
      setTmrUnidadeData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de TMR:", error);
      toast.error("Erro ao buscar dados de TMR por Unidade.");
    } finally {
      if (!isFilterRequest) setIsTmrUnidadeLoading(false);
    }
  }, [buildUrlParams]);

  // Fetch Gráfico 4
  const fetchStatusData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsStatusLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/chamados-por-status?${params}`);
      setStatusData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de Status:", error);
      toast.error("Erro ao buscar dados de Status.");
    } finally {
      if (!isFilterRequest) setIsStatusLoading(false);
    }
  }, [buildUrlParams]);

  // Fetch Gráfico 5
  const fetchUnidadeData = useCallback(async (isFilterRequest = false) => {
    if (!isFilterRequest) setIsUnidadeLoading(true);
    try {
      const params = buildUrlParams();
      const response = await api.get(`/relatorio/chamados-por-unidade?${params}`);
      setUnidadeData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de Unidade:", error);
      toast.error("Erro ao buscar dados de Unidade.");
    } finally {
      if (!isFilterRequest) setIsUnidadeLoading(false);
    }
  }, [buildUrlParams]);

  // --- Handlers e Effects (Preservados) ---

  // Carga inicial (busca dados de todos os gráficos)
  useEffect(() => {
    fetchModuloData(false);
    fetchTmrData(false);
    fetchStatusData(false);
    fetchUnidadeData(false);
    fetchTmrUnidadeData(false);
    fetchSuporteData(false);
  }, [fetchModuloData, fetchTmrData, fetchStatusData, fetchUnidadeData, fetchTmrUnidadeData]);

  // Handler do botão "Filtrar"
  const handleFilterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsFiltering(true);
    await Promise.all([
      fetchModuloData(true),
      fetchTmrData(true),
      fetchStatusData(true),
      fetchUnidadeData(true),
      fetchTmrUnidadeData(true),
      fetchSuporteData(true)
    ]);
    setIsFiltering(false);
  };

  // --- Componente de Loading (Refatorado) ---
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  // --- Renderização do JSX (Refatorado com Shadcn) ---
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar />
      <main className="container mx-auto max-w-7xl p-4 md:p-8">
        <h2 className="text-3xl font-bold mb-4">Dashboard de Relatórios</h2>

        {/* --- Card de Filtros --- */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Filter className="mr-2" /> Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end" onSubmit={handleFilterSubmit}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dataInicio">Data Início:</Label>
                <Input type="date" id="dataInicio" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dataFim">Data Fim:</Label>
                <Input type="date" id="dataFim" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
              <Button type="submit" className="md:col-span-1 w-full" disabled={isFiltering}>
                {isFiltering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="mr-2 h-4 w-4" />
                )}
                Filtrar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Grid para os gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* --- Gráfico 1 (Chamados por Módulo) --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="mr-2" /> Chamados por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              {isModuloLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={moduloData}>
                      <XAxis dataKey="nome" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="total" fill="var(--color-primary)" name="Total de Chamados" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <DynamicPDFButton
                documentType="modulo"
                documentProps={{
                  dataInicio: formatarIsoParaBr(dataInicio),
                  dataFim: formatarIsoParaBr(dataFim),
                  dados: moduloData.map(d => ({ 
                    nome: d.nome, 
                    total: d.total || 0 
                  })) as PdfData[]
                }}
                fileName="relatorio-chamados-por-modulo.pdf"
                className="w-full"
                isLoading={isModuloLoading}
                label="Baixar Relatório de Módulos"
              />
            </CardFooter>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="mr-2" /> Chamados por Suporte</CardTitle>
            </CardHeader>
            <CardContent>
              {isSuporteLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={suporteData}>
                      <XAxis dataKey="nome" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="total" fill="var(--color-primary)" name="Total de Chamados" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <DynamicPDFButton
                documentType="modulo"
                documentProps={{
                  dataInicio: formatarIsoParaBr(dataInicio),
                  dataFim: formatarIsoParaBr(dataFim),
                  dados: suporteData.map(d => ({ 
                    nome: d.nome, 
                    total: d.total || 0 
                  })) as PdfData[]
                }}
                fileName="relatorio-chamados-por-suporte.pdf"
                className="w-full"
                isLoading={isSuporteLoading}
                label="Baixar Relatório de Suporte"
              />
            </CardFooter>
          </Card>

          {/* --- Gráfico 2 (Chamados por Unidade) --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="mr-2" /> Chamados por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              {isUnidadeLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={unidadeData}>
                      <XAxis dataKey="nome" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="total" fill="var(--color-primary)" name="Total de Chamados" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <DynamicPDFButton
                documentType="unidade"
                documentProps={{
                  dataInicio: formatarIsoParaBr(dataInicio),
                  dataFim: formatarIsoParaBr(dataFim),
                  dados: unidadeData.map(u=>({
                    nome: u?.nome,
                    total: u?.total
                  })) as PdfData[]
                }}
                fileName="relatorio-chamados-por-unidade.pdf"
                className="w-full"
                isLoading={isUnidadeLoading}
                label="Baixar Relatório de Unidades"
              />
            </CardFooter>
          </Card>

          {/* --- Gráfico 3 (TMR por Módulo) --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>TMR por Módulo (em Horas)</CardTitle>
            </CardHeader>
            <CardContent>
              {isTmrLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={tmrData}>
                      <XAxis dataKey="nome" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis unit="h" />
                      <ChartTooltip formatter={(value) => `${parseFloat(value as string).toFixed(2)} horas`} content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="tempo_medio" fill="var(--color-success)" name="Tempo Médio (Horas)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* --- Gráfico 4 (TMR por Unidade) --- */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>TMR por Unidade (em Horas)</CardTitle>
            </CardHeader>
            <CardContent>
              {isTmrUnidadeLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={tmrUnidadeData}>
                      <XAxis dataKey="nome" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis unit="h" />
                      <ChartTooltip formatter={(value) => `${parseFloat(value as string).toFixed(2)} horas`} content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="tempo_medio" fill="var(--color-success)" name="Tempo Médio (Horas)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* --- Gráfico 5 (Chamados por Status) --- */}
          <Card className="shadow-sm lg:col-span-2"> {/* Ocupa a largura total */}
            <CardHeader>
              <CardTitle className="flex items-center"><PieChartIcon className="mr-2" /> Distribuição de Chamados por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isStatusLoading ? (
                <LoadingSpinner />
              ) : (
                <ChartContainer config={{}} className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={statusData}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={150}
                        fill="#8884d8"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}