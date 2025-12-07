import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MaterialItem, ProjectContext } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useExport = () => {
  
  // Helper para formatar moeda BRL
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const exportPDF = useCallback((project: ProjectContext, materials: MaterialItem[], aiAnalysis?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- CABEÇALHO PERSONALIZADO (Estilo Pansau Naghada) ---
    doc.setFont("helvetica", "bold");
    
    // 1. Nome do Profissional/Empresa Centralizado com Destaque
    doc.setFontSize(14);
    const headerTitle = `====== ${project.contractorName.toUpperCase() || 'ORÇAMENTO'} ======`;
    const headerWidth = doc.getTextWidth(headerTitle);
    doc.text(headerTitle, (pageWidth - headerWidth) / 2, 15);

    // 2. Local e Data
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    const dateText = `Gerado em: ${today}`;
    doc.text(dateText, 14, 25);

    // 3. Título do Orçamento
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const docTitle = `Orçamento para prestação de serviço: ${project.projectName}`;
    doc.text(docTitle, 14, 35);
    
    // 4. Cliente
    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${project.clientName}`, 14, 41);

    // --- TABELA DE ITENS ---
    const tableBody = materials.map((mat, index) => [
      index + 1,                       // item
      mat.name + (mat.note ? `\n(${mat.note})` : ''), // descrição + nota
      mat.unit,                        // unidade
      mat.quantity,                    // quantidade
      mat.unitPrice > 0 ? formatCurrency(mat.unitPrice) : 'R$ -', // p. unitário
      mat.totalCost > 0 ? formatCurrency(mat.totalCost) : 'R$ -'  // p.total
    ]);

    const grandTotal = materials.reduce((acc, curr) => acc + curr.totalCost, 0);

    autoTable(doc, {
      startY: 50,
      head: [['ITEM', 'DESCRIÇÃO', 'UNID', 'QTD', 'P. UNIT', 'TOTAL']],
      body: tableBody,
      foot: [['', 'VALOR TOTAL DO INVESTIMENTO', '', '', '', formatCurrency(grandTotal)]],
      theme: 'grid', // Estilo Planilha Clean
      styles: { 
        fontSize: 10, 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0], 
        lineWidth: 0.1,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      footStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        halign: 'right', 
        fontSize: 12,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, 
        1: { halign: 'left' },                  
        2: { halign: 'center', cellWidth: 15 }, 
        3: { halign: 'center', cellWidth: 15 }, 
        4: { halign: 'right', cellWidth: 30 },  
        5: { halign: 'right', cellWidth: 35 }   
      },
      didParseCell: function (data) {
        if (data.section === 'foot') {
           if (data.column.index === 0) {
             data.cell.styles.lineWidth = 0; 
           }
           if (data.column.index === 1) {
             data.cell.colSpan = 4;
             data.cell.styles.halign = 'right'; 
           }
        }
      }
    });

    // Rodapé de Contato (estilo imagem)
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.text("== Contato via SmartBuild Calc ==", (pageWidth / 2), pageHeight - 10, { align: 'center' });

    doc.save(`${project.projectName.replace(/\s+/g, '_')}_Orcamento.pdf`);
  }, []);

  const exportExcel = useCallback((project: ProjectContext, materials: MaterialItem[]) => {
    const excelData = materials.map((mat, index) => ({
      Item: index + 1,
      Descricao: mat.name,
      Unidade: mat.unit,
      Quantidade: mat.quantity,
      "Preço Unit. (R$)": mat.unitPrice,
      "Total (R$)": mat.totalCost,
      Categoria: mat.category,
      Observacoes: mat.note || ''
    }));

    const grandTotal = materials.reduce((acc, curr) => acc + curr.totalCost, 0);
    excelData.push({
      Item: 0,
      Descricao: 'VALOR TOTAL',
      Unidade: '',
      Quantidade: 0,
      "Preço Unit. (R$)": 0,
      "Total (R$)": grandTotal,
      Categoria: 'TOTAL', 
      Observacoes: ''
    } as any);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const wscols = [
      {wch: 5},  
      {wch: 40}, 
      {wch: 10}, 
      {wch: 10}, 
      {wch: 15}, 
      {wch: 15}, 
      {wch: 20}, 
      {wch: 30}  
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Orçamento");
    XLSX.writeFile(wb, `${project.projectName.replace(/\s+/g, '_')}_Orcamento.xlsx`);
  }, []);

  return { exportPDF, exportExcel };
};