"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React from "react";

interface DynamicPDFButtonProps {
  document: React.ReactElement;
  fileName: string;
  className?: string;
  data: any[]; // Usado para verificar se há dados
  isLoading: boolean; // Usado para desabilitar enquanto os dados carregam
  label: string;
}

export const DynamicPDFButton = ({
  document,
  fileName,
  className,
  data,
  isLoading,
  label,
}: DynamicPDFButtonProps) => {

  // O botão fica desabilitado se estiver carregando OU se não houver dados
  const isDisabled = isLoading || data.length === 0;

  return (
    <Button asChild className={className} disabled={isDisabled}>
      <PDFDownloadLink document={document} fileName={fileName}>
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

// Precisamos exportar como default para o next/dynamic funcionar
export default DynamicPDFButton;