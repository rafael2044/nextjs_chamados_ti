"use client";

// 1. O PRÓPRIO BOTÃO importa todos os componentes de PDF
import { PDFDownloadLink } from "@react-pdf/renderer";
import {RelatorioUnidadePDF} from "./RelatorioUnidadePDF"; // Localizado no mesmo diretório
import {RelatorioModuloPDF} from "./RelatorioModuloPDF";   // Localizado no mesmo diretório
import type {DadosProps} from "./RelatorioUnidadePDF"; 
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React from "react";

// 2. A interface define como a página vai "chamar" o botão
interface DynamicPDFButtonProps {
  // Os dados que o PDF precisa
  documentProps: {
    dataInicio: string;
    dataFim: string;
    dados: DadosProps[];
  };
  // A string que "localiza" qual PDF usar
  documentType: 'unidade' | 'modulo'; 
  fileName: string;
  className?: string;
  isLoading: boolean;
  label: string;
}

export const DynamicPDFButton = ({
  documentProps,
  documentType,
  fileName,
  className,
  isLoading,
  label,
}: DynamicPDFButtonProps) => {

  const { dataInicio, dataFim, dados } = documentProps;

  const isDisabled = isLoading || dados.length === 0;

  // 3. É AQUI QUE O PDF É "LOCALIZADO"
  // Usamos a string 'documentType' para decidir qual componente renderizar
  let documentToRender;

  if (documentType === 'unidade') {
    documentToRender = (
      <RelatorioUnidadePDF
        dataInicio={dataInicio}
        dataFim={dataFim}
        dados={dados} 
      />
    );
  } else if (documentType === 'modulo') {
    documentToRender = (
      <RelatorioModuloPDF
        dataInicio={dataInicio}
        dataFim={dataFim}
        dados={dados} 
      />
    );
  } else {
    // Caso o tipo seja inválido
    return <Button disabled>Tipo de Relatório Inválido</Button>;
  }

  // 4. O componente 'documentToRender' (que é um PDF válido) é passado
  // para o 'PDFDownloadLink' para ser processado e baixado.
  return (
    <Button asChild className={className} disabled={isDisabled}>
      <PDFDownloadLink document={documentToRender} fileName={fileName}>
        {({ blob, url, loading, error }) =>
          loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {label}
            </>
          )
        }
      </PDFDownloadLink>
    </Button>
  );
};

export default DynamicPDFButton;