
import { GoogleGenAI } from "@google/genai";
import { MaterialItem, ProjectContext } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getConstructionInsights = async (
  project: ProjectContext, 
  materials: MaterialItem[]
): Promise<string> => {
  
  if (materials.length === 0) return "Adicione materiais ao orçamento para receber análise.";

  const materialList = materials.map(m => 
    `- [${m.category}] ${m.name}: ${m.quantity} ${m.unit} (Nota: ${m.note || ''})`
  ).join('\n');

  const prompt = `
    Atue como um Engenheiro Civil Brasileiro Sênior e Especialista em Orçamentos.
    Analise o seguinte Orçamento Global acumulado para a obra:
    
    Projeto: ${project.projectName} (Cliente: ${project.clientName}).
    
    Lista Completa de Materiais:
    ${materialList}
    
    Por favor, forneça uma análise técnica concisa (máximo 4 parágrafos) em Português do Brasil:
    1. Validação Geral: Há incompatibilidade entre os itens de diferentes etapas? Falta algo óbvio?
    2. Dica de Gestão: Uma dica para organizar a compra desses materiais (ex: o que comprar primeiro).
    3. Alerta Técnico: Algum cuidado específico na execução destes serviços combinados.
    
    Use formatação Markdown simples. Seja direto.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Erro ao conectar com o assistente inteligente. Tente novamente mais tarde.";
  }
};
