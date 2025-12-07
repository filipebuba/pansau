
import { ServiceType, Dimensions, CalculationSettings, CalculationResult, MaterialItem } from '../types';

/**
 * Função pura para calcular Área de Parede
 */
const calculateWallArea = (width: number, height: number): number => {
  return width * height;
};

/**
 * Função pura para calcular Área de Piso/Teto
 */
const calculateFloorArea = (width: number, length: number): number => {
  return width * length;
};

/**
 * Aplica margem de perda
 */
const applyMargin = (quantity: number, marginPercent: number): number => {
  return quantity * (1 + marginPercent / 100);
};

/**
 * Helper para gerar IDs únicos (evita colisão no orçamento global)
 */
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// --- Calculadoras Específicas ---

const calculateMasonry = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const area = calculateWallArea(dim.length, dim.height || 0);
  const margin = settings.wasteMargin;

  // Constantes Padrão (Brasil)
  const BLOCKS_PER_M2 = 25; 
  const MORTAR_PER_M2 = 18; 

  const rawBlocks = area * BLOCKS_PER_M2;
  const blocksTotal = Math.ceil(applyMargin(rawBlocks, margin));
  
  const rawMortar = area * MORTAR_PER_M2;
  const mortarTotal = Math.ceil(applyMargin(rawMortar, margin));

  return [
    {
      id: generateId('mat-brick'),
      name: 'Bloco Cerâmico (9x19x19)',
      quantity: blocksTotal,
      unit: 'unid',
      category: ServiceType.MASONRY,
      unitPrice: 0,
      totalCost: 0,
      note: `Área: ${area.toFixed(2)}m²`
    },
    {
      id: generateId('mat-cem'),
      name: 'Cimento (Saco 50kg)',
      quantity: Math.ceil(mortarTotal / 300 * 5), 
      unit: 'sacos',
      category: ServiceType.MASONRY,
      unitPrice: 0,
      totalCost: 0,
      note: 'Estimado p/ argamassa'
    },
    {
      id: generateId('mat-sand'),
      name: 'Areia Média',
      quantity: parseFloat((mortarTotal * 0.0018).toFixed(2)), 
      unit: 'm³',
      category: ServiceType.MASONRY,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculatePainting = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const area = calculateWallArea(dim.length, dim.height || 0);
  const layers = settings.paintLayers || 2;
  const margin = settings.wasteMargin;

  const COVERAGE_PER_LITER = 10;
  const totalCoverageNeeded = area * layers;
  const litersNeeded = totalCoverageNeeded / COVERAGE_PER_LITER;
  const totalLiters = parseFloat(applyMargin(litersNeeded, margin).toFixed(1));

  return [
    {
      id: generateId('mat-pnt'),
      name: 'Tinta Acrílica Premium',
      quantity: totalLiters,
      unit: 'litros',
      category: ServiceType.PAINTING,
      unitPrice: 0,
      totalCost: 0,
      note: `${layers} demãos`
    },
    {
      id: generateId('mat-slr'),
      name: 'Selador Acrílico',
      quantity: parseFloat(applyMargin(area / 12, margin).toFixed(1)),
      unit: 'litros',
      category: ServiceType.PAINTING,
      unitPrice: 0,
      totalCost: 0
    },
    {
      id: generateId('mat-lixa'),
      name: 'Lixa de Parede (P150)',
      quantity: Math.ceil(area / 5),
      unit: 'unid',
      category: ServiceType.PAINTING,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculateFlooring = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const area = calculateFloorArea(dim.width, dim.length);
  const margin = settings.wasteMargin;
  
  const tileW = (settings.tileSize?.width || 60) / 100;
  const tileL = (settings.tileSize?.length || 60) / 100;
  const tileArea = tileW * tileL;

  const rawTiles = area / tileArea;
  const tilesTotal = Math.ceil(applyMargin(rawTiles, margin));
  const groutTotal = Math.ceil(applyMargin(area * 0.3, margin));

  return [
    {
      id: generateId('mat-tile'),
      name: `Porcelanato/Cerâmica (${(tileW*100).toFixed(0)}x${(tileL*100).toFixed(0)}cm)`,
      quantity: tilesTotal,
      unit: 'peças',
      category: ServiceType.FLOORING,
      unitPrice: 0,
      totalCost: 0,
      note: `Cobertura: ${area.toFixed(2)}m²`
    },
    {
      id: generateId('mat-grout'),
      name: 'Rejunte',
      quantity: groutTotal,
      unit: 'kg',
      category: ServiceType.FLOORING,
      unitPrice: 0,
      totalCost: 0
    },
    {
      id: generateId('mat-mor-flr'),
      name: 'Argamassa AC-III (Colante)',
      quantity: Math.ceil(applyMargin(area * 6, margin)),
      unit: 'kg',
      category: ServiceType.FLOORING,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculateRoofing = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  // Área plana
  const flatArea = calculateFloorArea(dim.width, dim.length);
  // Fator de inclinação (estimado 30% para cerâmica) = 1.044 multiplier para área real
  // Vamos simplificar usando a margem de perda para cobrir inclinação e quebras no MVP
  const realArea = flatArea * 1.30; // 30% a mais considerando inclinação e beiral
  const margin = settings.wasteMargin;

  let tilesPerM2 = 16; // Cerâmica Colonial
  let tileName = "Telha Cerâmica Colonial";

  if (settings.roofType === 'concrete') {
    tilesPerM2 = 10.5;
    tileName = "Telha de Concreto";
  } else if (settings.roofType === 'fiber_cement') {
    tilesPerM2 = 0.7; // Telha grande 2.44x1.10 (aprox)
    tileName = "Telha Fibrocimento 6mm";
  }

  const totalTiles = Math.ceil(applyMargin(realArea * tilesPerM2, margin));
  const woodM3 = parseFloat(applyMargin(realArea * 0.025, margin).toFixed(2)); // Estimativa de madeiramento 0.025m³/m²

  return [
    {
      id: generateId('mat-roof-tile'),
      name: tileName,
      quantity: totalTiles,
      unit: 'unid',
      category: ServiceType.ROOFING,
      unitPrice: 0,
      totalCost: 0,
      note: `Área Cob: ${realArea.toFixed(2)}m² (incl. inclinação)`
    },
    {
      id: generateId('mat-wood'),
      name: 'Madeiramento Misto (Vigota/Caibro/Ripa)',
      quantity: woodM3,
      unit: 'm³',
      category: ServiceType.ROOFING,
      unitPrice: 0,
      totalCost: 0,
      note: 'Estrutura completa estimada'
    }
  ];
};

const calculateDrywall = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const margin = settings.wasteMargin;
  let area = 0;
  let materials: MaterialItem[] = [];

  if (settings.drywallType === 'ceiling') {
    area = calculateFloorArea(dim.width, dim.length);
    // Chapa ST 1.20x2.40 = 2.88m²
    const plates = Math.ceil(applyMargin(area / 2.88, margin));
    
    materials = [
      {
        id: generateId('mat-dw-plate'),
        name: 'Chapa Drywall ST (1.20x2.40m)',
        quantity: plates,
        unit: 'unid',
        category: ServiceType.DRYWALL,
        unitPrice: 0,
        totalCost: 0,
        note: `Forro: ${area.toFixed(2)}m²`
      },
      {
        id: generateId('mat-dw-perf'),
        name: 'Perfil F530 (Canaleta)',
        quantity: Math.ceil(applyMargin(area * 1.5, margin)), // Estimativa linear
        unit: 'barras 3m',
        category: ServiceType.DRYWALL,
        unitPrice: 0,
        totalCost: 0
      }
    ];
  } else {
    // Parede
    area = calculateWallArea(dim.length, dim.height || 0);
    // Parede tem 2 faces
    const plates = Math.ceil(applyMargin((area * 2) / 2.88, margin));
    
    materials = [
      {
        id: generateId('mat-dw-plate'),
        name: 'Chapa Drywall ST (1.20x2.40m)',
        quantity: plates,
        unit: 'unid',
        category: ServiceType.DRYWALL,
        unitPrice: 0,
        totalCost: 0,
        note: `Parede 2 faces: ${area.toFixed(2)}m²`
      },
      {
        id: generateId('mat-dw-gui'),
        name: 'Guia 48/70/90mm',
        quantity: Math.ceil(applyMargin(dim.length / 3, margin) * 2), // Chão e teto
        unit: 'barras 3m',
        category: ServiceType.DRYWALL,
        unitPrice: 0,
        totalCost: 0
      },
      {
        id: generateId('mat-dw-mon'),
        name: 'Montante',
        quantity: Math.ceil(applyMargin(dim.length / 0.60, margin)), // A cada 60cm
        unit: 'barras 3m',
        category: ServiceType.DRYWALL,
        unitPrice: 0,
        totalCost: 0
      }
    ];
  }

  // Comuns
  materials.push({
    id: generateId('mat-dw-screw'),
    name: 'Parafusos GN25 (Cento)',
    quantity: Math.ceil(area / 10), // Aprox 1 cento p/ 10m²
    unit: 'cento',
    category: ServiceType.DRYWALL,
    unitPrice: 0,
    totalCost: 0
  });

  return materials;
};

const calculateElectrical = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const points = settings.electricalPoints || 1;
  const margin = settings.wasteMargin;

  // Estimativa muito grosseira para MVP
  // 1 ponto = 1 caixa, 1 conjunto, ~15m fio (Fase+Neutro+Terra), ~3m Eletroduto
  
  return [
    {
      id: generateId('mat-ele-box'),
      name: 'Caixa de Luz 4x2 Amarela',
      quantity: points,
      unit: 'unid',
      category: ServiceType.ELECTRICAL,
      unitPrice: 0,
      totalCost: 0,
      note: `${points} pontos estimados`
    },
    {
      id: generateId('mat-ele-mod'),
      name: 'Conjunto Tomada/Interruptor',
      quantity: points,
      unit: 'unid',
      category: ServiceType.ELECTRICAL,
      unitPrice: 0,
      totalCost: 0
    },
    {
      id: generateId('mat-ele-wire'),
      name: 'Cabo Flexível 2.5mm (Rolo 100m)',
      quantity: Math.ceil(applyMargin(points * 15, margin) / 100), // ~15m por ponto
      unit: 'rolos',
      category: ServiceType.ELECTRICAL,
      unitPrice: 0,
      totalCost: 0,
      note: 'Considerando F+N+T'
    },
    {
      id: generateId('mat-ele-duct'),
      name: 'Eletroduto Corrugado 3/4 (Rolo 50m)',
      quantity: Math.ceil(applyMargin(points * 4, margin) / 50),
      unit: 'rolos',
      category: ServiceType.ELECTRICAL,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculatePlumbing = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const points = settings.plumbingPoints || 1;
  const margin = settings.wasteMargin;
  const type = settings.plumbingType || 'pvc_soldavel';
  
  // Estimativa: 3m de tubo por ponto + conexões
  const pipeName = type === 'pvc_soldavel' ? 'Tubo PVC Soldável 25mm' : 'Tubo PEX 16mm';
  
  return [
    {
      id: generateId('mat-plumb-pipe'),
      name: pipeName,
      quantity: Math.ceil(applyMargin(points * 3, margin)), // 3m por ponto
      unit: 'm',
      category: ServiceType.PLUMBING,
      unitPrice: 0,
      totalCost: 0
    },
    {
      id: generateId('mat-plumb-conn'),
      name: 'Conexões Diversas (Joelhos/Tês)',
      quantity: Math.ceil(applyMargin(points * 4, margin)), // 4 conexões por ponto
      unit: 'unid',
      category: ServiceType.PLUMBING,
      unitPrice: 0,
      totalCost: 0
    },
    {
      id: generateId('mat-plumb-adh'),
      name: type === 'pvc_soldavel' ? 'Adesivo Plástico PVC' : 'Anéis/Clipagem PEX',
      quantity: Math.ceil(points / 5),
      unit: 'unid',
      category: ServiceType.PLUMBING,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculateWaterproofing = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const area = calculateFloorArea(dim.width, dim.length);
  const margin = settings.wasteMargin;
  const system = settings.waterproofingSystem || 'rigid';

  // Rígido (Argamassa Polimérica): ~3kg/m²
  // Flexível (Manta Líquida): ~2kg/m² (demãos)
  
  const consumption = system === 'rigid' ? 3 : 2;
  const productName = system === 'rigid' ? 'Argamassa Polimérica (Cx 18kg)' : 'Manta Líquida (Balde 18kg)';
  
  const totalKg = applyMargin(area * consumption, margin);
  const totalUnits = Math.ceil(totalKg / 18);

  return [
    {
      id: generateId('mat-water'),
      name: productName,
      quantity: totalUnits,
      unit: 'unid',
      category: ServiceType.WATERPROOFING,
      unitPrice: 0,
      totalCost: 0,
      note: `Cobertura: ${area.toFixed(2)}m²`
    },
    {
      id: generateId('mat-brush'),
      name: 'Brocha/Rolo para aplicação',
      quantity: 1,
      unit: 'unid',
      category: ServiceType.WATERPROOFING,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculateFinishing = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const linearMeters = dim.linearMeters || 0;
  const margin = settings.wasteMargin;
  const type = settings.finishingType || 'baseboard';
  const material = settings.finishingMaterial || 'polystyrene';

  const typeName = type === 'baseboard' ? 'Rodapé' : 'Roda-teto/Moldura';
  const matName = material === 'wood' ? 'Madeira' : material === 'ceramic' ? 'Cerâmica' : 'Poliestireno';

  // Se for cerâmica, vende por peça ou metro. Vamos assumir Metro Linear para simplificar.
  // Barra padrão 2.40m para madeira/poliestireno.
  
  const totalMeters = applyMargin(linearMeters, margin);
  const bars = Math.ceil(totalMeters / 2.40);
  
  return [
    {
      id: generateId('mat-fin-bar'),
      name: `${typeName} de ${matName} (Barra 2.40m)`,
      quantity: bars,
      unit: 'barras',
      category: ServiceType.FINISHING,
      unitPrice: 0,
      totalCost: 0,
      note: `Perímetro: ${linearMeters}m`
    },
    {
      id: generateId('mat-fin-glue'),
      name: 'Cola/Fixador de Montagem',
      quantity: Math.ceil(bars / 5), // 1 tubo a cada 5 barras (aprox)
      unit: 'tubo',
      category: ServiceType.FINISHING,
      unitPrice: 0,
      totalCost: 0
    }
  ];
};

const calculateDemolition = (dim: Dimensions, settings: CalculationSettings): MaterialItem[] => {
  const area = calculateWallArea(dim.length, dim.height || dim.width); // Usa Width se for chão
  const thicknessCm = settings.demolitionThickness || 15;
  const type = settings.demolitionType || 'wall_brick';

  // Volume Entulho = Área * Espessura * Coeficiente de Empolamento (~1.3 a 1.5)
  // Vamos usar 1.5 de empolamento (entulho solto ocupa mais espaço)
  const volumeReal = area * (thicknessCm / 100);
  const volumeDebris = volumeReal * 1.5;

  // Caçamba estacionária padrão = 4m³ ou 5m³. Vamos usar 4m³.
  const dumpsters = Math.ceil(volumeDebris / 4);

  let desc = 'Demolição de Alvenaria';
  if(type === 'concrete_floor') desc = 'Demolição de Piso/Concreto';
  if(type === 'tile_removal') desc = 'Retirada de Revestimento (Azulejo/Piso)';

  return [
    {
      id: generateId('serv-demo'),
      name: `Serviço: ${desc}`,
      quantity: parseFloat(area.toFixed(2)),
      unit: 'm²',
      category: ServiceType.DEMOLITION,
      unitPrice: 0,
      totalCost: 0,
      note: `Espessura consid.: ${thicknessCm}cm`
    },
    {
      id: generateId('serv-dump'),
      name: 'Caçamba Estacionária (4m³)',
      quantity: dumpsters,
      unit: 'unid',
      category: ServiceType.DEMOLITION,
      unitPrice: 0,
      totalCost: 0,
      note: `Entulho est.: ${volumeDebris.toFixed(1)}m³`
    },
    {
      id: generateId('mat-bags'),
      name: 'Sacos de Entulho (Ráfia)',
      quantity: Math.ceil(volumeDebris * 20), // Aprox 20 sacos por m³ se for ensacar
      unit: 'unid',
      category: ServiceType.DEMOLITION,
      unitPrice: 0,
      totalCost: 0,
      note: 'Caso não use caçamba'
    }
  ];
};

const calculateCustom = (settings: CalculationSettings): MaterialItem[] => {
  const qty = settings.customQuantity || 1;
  const price = settings.customUnitPrice || 0;
  
  return [{
    id: generateId('serv-manual'),
    name: settings.customDescription || 'Serviço Diversos',
    quantity: qty,
    unit: settings.customUnit || 'vb',
    category: ServiceType.CUSTOM,
    unitPrice: price,
    totalCost: qty * price,
    note: 'Lançamento Manual'
  }];
};

/**
 * Fachada Principal para Lógica de Cálculo
 */
export const calculateMaterials = (
  type: ServiceType,
  dim: Dimensions,
  settings: CalculationSettings
): CalculationResult => {
  let materials: MaterialItem[] = [];
  let area = 0;

  switch (type) {
    case ServiceType.MASONRY:
      materials = calculateMasonry(dim, settings);
      area = calculateWallArea(dim.length, dim.height || 0);
      break;
    case ServiceType.PAINTING:
      materials = calculatePainting(dim, settings);
      area = calculateWallArea(dim.length, dim.height || 0);
      break;
    case ServiceType.FLOORING:
      materials = calculateFlooring(dim, settings);
      area = calculateFloorArea(dim.width, dim.length);
      break;
    case ServiceType.ROOFING:
      materials = calculateRoofing(dim, settings);
      area = calculateFloorArea(dim.width, dim.length); 
      break;
    case ServiceType.DRYWALL:
      materials = calculateDrywall(dim, settings);
      area = settings.drywallType === 'ceiling' 
        ? calculateFloorArea(dim.width, dim.length)
        : calculateWallArea(dim.length, dim.height || 0);
      break;
    case ServiceType.ELECTRICAL:
      materials = calculateElectrical(dim, settings);
      area = 0; 
      break;
    case ServiceType.PLUMBING:
      materials = calculatePlumbing(dim, settings);
      area = 0;
      break;
    case ServiceType.WATERPROOFING:
      materials = calculateWaterproofing(dim, settings);
      area = calculateFloorArea(dim.width, dim.length);
      break;
    case ServiceType.FINISHING:
      materials = calculateFinishing(dim, settings);
      area = dim.linearMeters || 0;
      break;
    case ServiceType.DEMOLITION:
      materials = calculateDemolition(dim, settings);
      area = calculateWallArea(dim.length, dim.height || dim.width);
      break;
    case ServiceType.CUSTOM:
      materials = calculateCustom(settings);
      area = 0;
      break;
  }

  return {
    serviceType: type,
    totalArea: parseFloat(area.toFixed(2)),
    materials,
    generatedAt: new Date(),
  };
};