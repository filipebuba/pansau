
import React, { useState } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  FileText, 
  Ruler, 
  RefreshCw,
  DollarSign,
  Bot,
  Sparkles,
  Loader2,
  PlusCircle,
  Trash2,
  PenTool,
  HelpCircle
} from 'lucide-react';
import { ServiceType, Dimensions, CalculationSettings, CalculationResult, ProjectContext, MaterialItem } from '../types';
import { calculateMaterials } from '../services/calculatorService';
import { getConstructionInsights } from '../services/aiService';
import { useExport } from '../hooks/useExport';

const CalculatorForm: React.FC = () => {
  // Estado do Projeto
  const [project, setProject] = useState<ProjectContext>({
    contractorName: '',
    clientName: '',
    projectName: ''
  });

  // Estado do Orçamento Global (Lista Acumulada)
  const [budgetItems, setBudgetItems] = useState<MaterialItem[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Estado dos Inputs do Formulário
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.MASONRY);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0, length: 0, linearMeters: 0 });
  const [settings, setSettings] = useState<CalculationSettings>({
    wasteMargin: 10,
    paintLayers: 2,
    tileSize: { width: 60, length: 60 },
    roofType: 'ceramic',
    drywallType: 'wall',
    electricalPoints: 1,
    plumbingPoints: 1,
    plumbingType: 'pvc_soldavel',
    waterproofingSystem: 'rigid',
    finishingType: 'baseboard',
    finishingMaterial: 'polystyrene',
    demolitionType: 'wall_brick',
    demolitionThickness: 15,
    customDescription: '',
    customUnit: 'vb',
    customQuantity: 1,
    customUnitPrice: 0
  });

  // Estado da Prévia (Cálculo atual antes de adicionar ao orçamento)
  const [previewResult, setPreviewResult] = useState<CalculationResult | null>(null);

  // Hook de Exportação
  const { exportPDF, exportExcel } = useExport();

  // --- Handlers ---

  const handleCalculatePreview = (e: React.FormEvent) => {
    e.preventDefault();
    const res = calculateMaterials(serviceType, dimensions, settings);
    setPreviewResult(res);
  };

  const handleAddToBudget = () => {
    if (!previewResult) return;
    setBudgetItems([...budgetItems, ...previewResult.materials]);
    setPreviewResult(null); 
    
    // Se for manual, limpar os campos para facilitar o próximo
    if (serviceType === ServiceType.CUSTOM) {
      setSettings(prev => ({
        ...prev,
        customDescription: '',
        customQuantity: 1,
        customUnitPrice: 0
      }));
    }
  };

  const handleRemoveItem = (id: string) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id));
  };

  const handleClearBudget = () => {
    if(window.confirm("Tem certeza que deseja limpar todo o orçamento?")) {
      setBudgetItems([]);
      setAiAnalysis('');
    }
  };

  const handleConsultAI = async () => {
    if (budgetItems.length === 0) return;
    setIsAiLoading(true);
    const advice = await getConstructionInsights(project, budgetItems);
    setAiAnalysis(advice);
    setIsAiLoading(false);
  };

  const handlePriceChange = (id: string, newPrice: string) => {
    const priceValue = parseFloat(newPrice) || 0;
    
    setBudgetItems(prev => prev.map(mat => {
      if (mat.id === id) {
        return {
          ...mat,
          unitPrice: priceValue,
          totalCost: priceValue * mat.quantity
        };
      }
      return mat;
    }));
  };

  const grandTotal = budgetItems.reduce((acc, curr) => acc + curr.totalCost, 0);

  // --- Render Helpers ---

  const renderServiceInputs = () => {
    switch(serviceType) {
      case ServiceType.MASONRY:
      case ServiceType.PAINTING:
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Altura (m)
                <Ruler size={12} className="text-slate-400" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.height || ''} onChange={e => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Comprimento (m)
                <Ruler size={12} className="text-slate-400 rotate-90" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.length || ''} onChange={e => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
          </>
        );
      case ServiceType.FLOORING:
      case ServiceType.ROOFING:
      case ServiceType.WATERPROOFING:
        return (
          <>
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Largura (m)
                <Ruler size={12} className="text-slate-400" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.width || ''} onChange={e => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Comprimento (m)
                <Ruler size={12} className="text-slate-400 rotate-90" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.length || ''} onChange={e => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
          </>
        );
      case ServiceType.DEMOLITION:
        return (
          <>
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Dimensão 1 (Altura/Largura)
                <Ruler size={12} className="text-slate-400" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.width || ''} onChange={e => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                Dimensão 2 (Comprimento)
                <Ruler size={12} className="text-slate-400 rotate-90" />
              </label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.length || ''} onChange={e => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
          </>
        );
      case ServiceType.DRYWALL:
        return (
          <>
            {settings.drywallType === 'wall' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Altura (m)</label>
                <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                  value={dimensions.height || ''} onChange={e => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})} placeholder="0.00" />
              </div>
            )}
             {(settings.drywallType === 'ceiling') && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Largura (m)</label>
                <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                  value={dimensions.width || ''} onChange={e => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})} placeholder="0.00" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Comprimento (m)</label>
              <input type="number" step="0.01" className="w-full p-2 border border-slate-300 rounded"
                value={dimensions.length || ''} onChange={e => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})} placeholder="0.00" />
            </div>
          </>
        );
      case ServiceType.ELECTRICAL:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade de Pontos</label>
            <input type="number" step="1" className="w-full p-2 border border-slate-300 rounded"
              value={settings.electricalPoints || ''} onChange={e => setSettings({...settings, electricalPoints: parseFloat(e.target.value) || 1})} placeholder="Ex: 10" />
          </div>
        );
      case ServiceType.PLUMBING:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade de Pontos (Água)</label>
            <input type="number" step="1" className="w-full p-2 border border-slate-300 rounded"
              value={settings.plumbingPoints || ''} onChange={e => setSettings({...settings, plumbingPoints: parseFloat(e.target.value) || 1})} placeholder="Ex: 5 (Torneiras/Chuveiros)" />
          </div>
        );
      case ServiceType.FINISHING:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Metragem Linear Total (m)</label>
            <input type="number" step="0.1" className="w-full p-2 border border-slate-300 rounded"
              value={dimensions.linearMeters || ''} onChange={e => setDimensions({...dimensions, linearMeters: parseFloat(e.target.value) || 0})} placeholder="Ex: 25.5" />
          </div>
        );
      case ServiceType.CUSTOM:
        const estimatedTotal = (settings.customQuantity || 0) * (settings.customUnitPrice || 0);
        return (
          <div className="col-span-2 space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
             <div>
               <label className="block text-xs font-bold text-blue-800 mb-1">Descrição do Serviço (Ex: Demolição)</label>
               <input type="text" className="w-full p-2 border border-blue-200 rounded focus:ring-blue-500" placeholder="Ex: Retirada de piso sala"
                 value={settings.customDescription} onChange={e => setSettings({...settings, customDescription: e.target.value})} />
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Qtd</label>
                  <input type="number" className="w-full p-2 border border-blue-200 rounded"
                    value={settings.customQuantity || ''} onChange={e => setSettings({...settings, customQuantity: parseFloat(e.target.value)})} placeholder="1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Unidade</label>
                  <select className="w-full p-2 border border-blue-200 rounded bg-white"
                     value={settings.customUnit} onChange={e => setSettings({...settings, customUnit: e.target.value})}>
                     <option value="vb">vb (Verba)</option>
                     <option value="m2">m²</option>
                     <option value="m">m</option>
                     <option value="un">un (Unidade)</option>
                     <option value="dia">dia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Preço Unit. (R$)</label>
                  <input type="number" className="w-full p-2 border border-blue-200 rounded"
                    value={settings.customUnitPrice || ''} onChange={e => setSettings({...settings, customUnitPrice: parseFloat(e.target.value)})} placeholder="0.00" />
                </div>
             </div>
             {estimatedTotal > 0 && (
                <div className="text-right border-t border-blue-200 pt-2 mt-2">
                  <span className="text-xs font-bold text-blue-800 mr-2">Total Estimado:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {estimatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
             )}
          </div>
        );
      default: return null;
    }
  };

  const renderSpecificSettings = () => {
    switch(serviceType) {
      case ServiceType.PAINTING:
        return (
           <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Nº de Demãos</label>
             <input type="number" className="w-full p-2 border border-slate-300 rounded"
               value={settings.paintLayers || ''} onChange={e => setSettings({...settings, paintLayers: parseFloat(e.target.value) || 1})} placeholder="2" />
           </div>
        );
      case ServiceType.FLOORING:
        return (
           <div className="grid grid-cols-2 gap-2 col-span-2">
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Larg. Peça (cm)</label>
               <input type="number" className="w-full p-2 border border-slate-300 rounded"
                 value={settings.tileSize?.width || ''} onChange={e => setSettings({...settings, tileSize: { ...settings.tileSize!, width: parseFloat(e.target.value) || 0 }})} placeholder="60" />
             </div>
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Comp. Peça (cm)</label>
               <input type="number" className="w-full p-2 border border-slate-300 rounded"
                 value={settings.tileSize?.length || ''} onChange={e => setSettings({...settings, tileSize: { ...settings.tileSize!, length: parseFloat(e.target.value) || 0 }})} placeholder="60" />
             </div>
           </div>
        );
      case ServiceType.ROOFING:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Telha</label>
            <select className="w-full p-2 border border-slate-300 rounded"
              value={settings.roofType} onChange={e => setSettings({...settings, roofType: e.target.value as any})}>
              <option value="ceramic">Cerâmica Colonial</option>
              <option value="concrete">Concreto</option>
              <option value="fiber_cement">Fibrocimento (Ondulada)</option>
            </select>
          </div>
        );
      case ServiceType.DRYWALL:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Aplicação</label>
            <select className="w-full p-2 border border-slate-300 rounded"
              value={settings.drywallType} onChange={e => setSettings({...settings, drywallType: e.target.value as any})}>
              <option value="wall">Parede / Divisória</option>
              <option value="ceiling">Forro / Teto</option>
            </select>
          </div>
        );
      case ServiceType.PLUMBING:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Tubulação</label>
            <select className="w-full p-2 border border-slate-300 rounded"
              value={settings.plumbingType} onChange={e => setSettings({...settings, plumbingType: e.target.value as any})}>
              <option value="pvc_soldavel">PVC Marrom (Soldável)</option>
              <option value="pex">PEX (Multicamada)</option>
            </select>
          </div>
        );
      case ServiceType.WATERPROOFING:
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Sistema</label>
            <select className="w-full p-2 border border-slate-300 rounded"
              value={settings.waterproofingSystem} onChange={e => setSettings({...settings, waterproofingSystem: e.target.value as any})}>
              <option value="rigid">Argamassa Polimérica (Rígida)</option>
              <option value="flexible">Manta Líquida (Flexível)</option>
            </select>
          </div>
        );
      case ServiceType.FINISHING:
        return (
          <div className="grid grid-cols-2 gap-2 col-span-2">
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select className="w-full p-2 border border-slate-300 rounded"
                value={settings.finishingType} onChange={e => setSettings({...settings, finishingType: e.target.value as any})}>
                <option value="baseboard">Rodapé</option>
                <option value="crown_molding">Roda-teto / Moldura</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
              <select className="w-full p-2 border border-slate-300 rounded"
                value={settings.finishingMaterial} onChange={e => setSettings({...settings, finishingMaterial: e.target.value as any})}>
                <option value="polystyrene">Poliestireno (Isopor)</option>
                <option value="wood">Madeira</option>
                <option value="ceramic">Cerâmica</option>
              </select>
            </div>
          </div>
        );
      case ServiceType.DEMOLITION:
        return (
          <div className="grid grid-cols-2 gap-2 col-span-2">
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">O que será demolido?</label>
              <select className="w-full p-2 border border-slate-300 rounded"
                value={settings.demolitionType} onChange={e => setSettings({...settings, demolitionType: e.target.value as any})}>
                <option value="wall_brick">Parede de Alvenaria</option>
                <option value="concrete_floor">Piso de Concreto / Contrapiso</option>
                <option value="tile_removal">Apenas Revestimento (Azulejo)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Espessura Média (cm)</label>
              <input type="number" className="w-full p-2 border border-slate-300 rounded"
                value={settings.demolitionThickness || ''} onChange={e => setSettings({...settings, demolitionThickness: parseFloat(e.target.value) || 0})} placeholder="Ex: 15" />
               <span className="text-[10px] text-slate-400">Usado para calcular caçambas</span>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          SmartBuild Calc <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase tracking-wide">PRO</span>
        </h1>
        <p className="text-slate-500 mt-2">Sistema Integrado de Orçamentos para Construção Civil</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ESQUERDA: Formulário de Cálculo */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleCalculatePreview} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            
            {/* Dados do Projeto */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">1. Dados do Orçamento</h2>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Seu Nome / Empresa (Cabeçalho)</label>
                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={project.contractorName} onChange={e => setProject({...project, contractorName: e.target.value})} placeholder="Ex: Construtora Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Cliente</label>
                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={project.clientName} onChange={e => setProject({...project, clientName: e.target.value})} required placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Descrição da Obra</label>
                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={project.projectName} onChange={e => setProject({...project, projectName: e.target.value})} required placeholder="Ex: Reforma Cozinha" />
              </div>
            </div>

            {/* Serviço e Inputs */}
            <div className="space-y-3 pt-4">
              <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">2. Adicionar Item</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Serviço</label>
                <select className="w-full p-2 border border-slate-300 rounded bg-white font-medium text-slate-700"
                  value={serviceType} onChange={(e) => { setServiceType(e.target.value as ServiceType); setPreviewResult(null); }}>
                  <option value={ServiceType.CUSTOM} className="font-bold text-blue-700">★ Mão de Obra / Personalizado</option>
                  <option disabled>--- Calculadoras de Material ---</option>
                  <option value={ServiceType.MASONRY}>Alvenaria (Paredes)</option>
                  <option value={ServiceType.PAINTING}>Pintura</option>
                  <option value={ServiceType.FLOORING}>Piso / Revestimento</option>
                  <option value={ServiceType.ROOFING}>Telhado / Cobertura</option>
                  <option value={ServiceType.DRYWALL}>Gesso / Drywall</option>
                  <option value={ServiceType.WATERPROOFING}>Impermeabilização</option>
                  <option value={ServiceType.ELECTRICAL}>Instalação Elétrica</option>
                  <option value={ServiceType.PLUMBING}>Instalação Hidráulica</option>
                  <option value={ServiceType.FINISHING}>Acabamento Interno (Rodapés)</option>
                  <option value={ServiceType.DEMOLITION}>Demolição e Retirada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {renderServiceInputs()}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 {renderSpecificSettings()}
              </div>
              
              {serviceType !== ServiceType.CUSTOM && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <label className="block text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                    Margem de Segurança (%)
                    <HelpCircle size={14} className="text-orange-400 cursor-help" title="Material extra para cobrir quebras e recortes." />
                  </label>
                  <input type="number" className="w-full p-2 border border-orange-200 rounded"
                    value={settings.wasteMargin || ''} onChange={e => setSettings({...settings, wasteMargin: parseFloat(e.target.value) || 0})} placeholder="10" />
                  <p className="text-[10px] text-orange-600 mt-1 leading-tight">
                    Recomendado: 10% (Padrão) a 15% (Pisos diagonais). Cobre quebras e recortes.
                  </p>
                </div>
              )}

            </div>

            <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded shadow transition-colors flex items-center justify-center gap-2">
              {serviceType === ServiceType.CUSTOM ? <PenTool size={18} /> : <RefreshCw size={18} />} 
              {serviceType === ServiceType.CUSTOM ? 'Lançar Item' : 'Calcular Materiais'}
            </button>
          </form>

          {/* Área de Prévia */}
          {previewResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles size={16} /> Prévia: {previewResult.materials.length} itens
              </h3>
              <ul className="text-sm text-blue-800 mb-4 list-disc pl-4 space-y-1">
                {previewResult.materials.map(m => (
                  <li key={m.id}>
                    {m.quantity} {m.unit} - {m.name} 
                    {m.totalCost > 0 && <span className="font-bold ml-1">({m.totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</span>}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleAddToBudget}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle size={18} /> Adicionar ao Orçamento Global
              </button>
            </div>
          )}
        </div>

        {/* DIREITA: Orçamento Global (Tabela) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Header da Tabela */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Orçamento Global</h3>
                <p className="text-sm text-slate-500">{project.projectName || 'Nova Obra'} - {budgetItems.length} itens</p>
              </div>
              <div className="flex gap-2">
                {budgetItems.length > 0 && (
                  <button onClick={handleClearBudget} className="p-2 text-slate-400 hover:text-red-600 transition-colors mr-2" title="Limpar Tudo">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={() => exportPDF(project, budgetItems, aiAnalysis)} disabled={budgetItems.length === 0}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm font-medium">
                  <FileText size={18} /> Gerar PDF
                </button>
                <button onClick={() => exportExcel(project, budgetItems)} disabled={budgetItems.length === 0}
                  className="px-3 py-2 text-green-600 hover:bg-green-50 rounded border border-green-200 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm font-medium">
                  <FileSpreadsheet size={18} /> Excel
                </button>
              </div>
            </div>

            {/* Tabela de Itens */}
            <div className="flex-grow overflow-x-auto">
              {budgetItems.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-4 font-medium w-10">#</th>
                      <th className="p-4 font-medium">Descrição</th>
                      <th className="p-4 font-medium text-right">Qtd</th>
                      <th className="p-4 font-medium">Unid</th>
                      <th className="p-4 font-medium w-32">Preço Unit.</th>
                      <th className="p-4 font-medium text-right">Total</th>
                      <th className="p-4 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgetItems.map((mat, idx) => (
                      <tr key={mat.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="p-4">
                           <div className="font-medium text-slate-800">{mat.name}</div>
                           <div className="text-xs text-slate-400 inline-block bg-slate-100 px-1 rounded mt-1">{mat.category}</div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-blue-600">{mat.quantity}</td>
                        <td className="p-4 text-slate-500 text-sm">{mat.unit}</td>
                        <td className="p-4">
                          <div className="flex items-center border rounded bg-white px-2 py-1 focus-within:ring-1 focus-within:ring-blue-500">
                            <span className="text-slate-400 text-xs mr-1">R$</span>
                            <input type="number" min="0" step="0.01" className="w-full text-sm outline-none"
                              value={mat.unitPrice || ''} onChange={(e) => handlePriceChange(mat.id, e.target.value)} placeholder="0.00" />
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-700">
                          {mat.totalCost > 0 ? mat.totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleRemoveItem(mat.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
                  <Calculator size={48} className="mb-4 opacity-20" />
                  <p>O orçamento está vazio.</p>
                  <p className="text-sm">Use o formulário "Mão de Obra" para lançar itens como no seu caderno.</p>
                </div>
              )}
            </div>

            {/* Footer com Totais */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end items-center gap-4">
              <span className="font-bold text-slate-600 uppercase text-xs">Total do Investimento</span>
              <span className="font-bold text-2xl text-emerald-600 flex items-center gap-1">
                <DollarSign size={20} />
                {grandTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>

          {/* Seção de IA Global */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                 <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-indigo-600" />
                  Análise de Engenharia (IA)
                </h3>
                <p className="text-xs text-indigo-700/70 mt-1">O assistente analisa a compatibilidade de todos os materiais da lista.</p>
              </div>
              
              <button onClick={handleConsultAI} disabled={isAiLoading || budgetItems.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                {isAiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {isAiLoading ? 'Analisando...' : 'Analisar Orçamento Completo'}
              </button>
            </div>

            {aiAnalysis && (
                <div className="prose prose-sm prose-indigo max-w-none bg-white p-4 rounded-lg border border-indigo-100 animate-in fade-in">
                  <div className="whitespace-pre-wrap font-medium text-slate-700">{aiAnalysis}</div>
                </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CalculatorForm;