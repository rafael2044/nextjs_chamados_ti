"use client"; // PDF Renderer só funciona no cliente

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- 1. SUA LOGO EM BASE64 ---
// Cole a string Base64 que você gerou aqui:
const logoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA... (string longa)...";

// --- 2. TIPAGEM (TypeScript) ---
interface DadosProps {
  nome: string;
  total: number;
}

interface PdfProps {
  dataInicio: string;
  dataFim: string;
  dados: DadosProps[];
}

// --- ESTILOS (Idênticos ao outro relatório) ---
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  logo: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  headerSection: {
    marginBottom: 20,
    marginTop: 70, 
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  // Estilos da Tabela... (copiados do outro arquivo)
  table: { 
    Display: "table",
    width: "100%", 
    BorderStyle: "none", 
  },
  tableRow: { 
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', 
    minHeight: 24, 
    alignItems: 'center', 
  },
  tableRowEven: {
    backgroundColor: '#f9f9f9',
  },
  tableHeaderRow: {
    flexDirection: "row",
    minHeight: 30,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: '#aaaaaa',
  },
  tableColHeaderName: { width: "70%" },
  tableColHeaderQty: { width: "30%" },
  tableCellHeader: {
    padding: 8,
    fontSize: 12, 
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left', 
  },
  tableCellHeaderQty: {
    padding: 8,
    fontSize: 12, 
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right', 
  },
  tableColName: { width: "70%" },
  tableColQty: { width: "30%" },
  tableCell: { 
    padding: 8, 
    fontSize: 10,
    textAlign: 'left', 
  },
  tableCellQty: { 
    padding: 8, 
    fontSize: 10,
    textAlign: 'right', 
  },
  tableRowTotal: {
    flexDirection: "row",
    minHeight: 30,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 2,
    borderTopColor: '#aaaaaa',
    marginTop: 5, 
  },
  tableCellTotalLabel: {
    padding: 8, 
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right', 
    width: "70%",
  },
  tableCellTotalValue: {
    padding: 8, 
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right', 
    width: "30%",
  },
  // --- Rodapé ---
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#888888',
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  footerTextLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    textAlign: 'left',
  },
  footerTextRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    textAlign: 'right',
  }
});

const RelatorioModuloPDF = ({ dataInicio, dataFim, dados }: PdfProps) => {
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalGeral = dados?.reduce((sum, modulo) => sum + modulo.total, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        
        {/* --- 3. CORREÇÃO DA IMAGEM --- */}
        <Image style={styles.logo} src={logoDataUri} />

        <View style={styles.headerSection}>
          <Text style={styles.title}>Relatório de Chamados por Módulo</Text>
          {(dataInicio && dataFim) && (
            <Text style={styles.subtitle}>Período: {dataInicio} até {dataFim}</Text>
          )}
        </View>

        {/* --- TABELA --- */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed> 
            <View style={styles.tableColHeaderName}>
              <Text style={styles.tableCellHeader}>Módulo</Text>
            </View>
            <View style={styles.tableColHeaderQty}>
              <Text style={styles.tableCellHeaderQty}>Quant. Chamados</Text>
            </View>
          </View>

          {dados?.map((modulo, index) => (
            <View 
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowEven : {} 
              ]} 
              key={modulo.nome || index}
              wrap={false}
            >
              <View style={styles.tableColName}>
                <Text style={styles.tableCell}>{modulo.nome}</Text>
              </View>
              <View style={styles.tableColQty}>
                <Text style={styles.tableCellQty}>{modulo.total}</Text>
              </View>
            </View>
          ))}
         
          <View style={styles.tableRowTotal} wrap={false}>
            <View style={styles.tableColName}>
              <Text style={styles.tableCellTotalLabel}>TOTAL</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={styles.tableCellTotalValue}>
                {totalGeral}
              </Text>
            </View>
          </View>
        </View>
        
        {/* --- RODAPÉ --- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTextLeft}>
            Gerado em: {dataGeracao}
          </Text>
          <Text 
            style={styles.footerTextRight} 
            render={({ pageNumber, totalPages }) => (
              `Página ${pageNumber} de ${totalPages}`
            )} 
          />
        </View>
        
      </Page>
    </Document>
  );
};

export {RelatorioModuloPDF};