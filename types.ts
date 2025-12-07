
// Domain Entities

export enum ServiceType {
  MASONRY = 'ALVENARIA',
  PAINTING = 'PINTURA',
  FLOORING = 'PISO_REVESTIMENTO',
  ROOFING = 'TELHADO_COBERTURA',
  DRYWALL = 'DRYWALL_GESSO',
  ELECTRICAL = 'ELETRICA',
  PLUMBING = 'HIDRAULICA',
  WATERPROOFING = 'IMPERMEABILIZACAO',
  FINISHING = 'ACABAMENTO_INTERNO', // Rodapés, Molduras
  DEMOLITION = 'DEMOLICAO',
  CUSTOM = 'MAO_DE_OBRA_OUTROS', // New type for manual entries
}

export interface Dimensions {
  width: number;
  height?: number; 
  length: number;
  linearMeters?: number; // Para acabamentos lineares
}

export interface CalculationSettings {
  wasteMargin: number; // Porcentagem
  
  // Specific inputs
  brickType?: 'standard' | 'block'; 
  paintLayers?: number; // Demãos
  tileSize?: { width: number; length: number }; // cm
  
  // Existing Inputs
  roofType?: 'ceramic' | 'concrete' | 'fiber_cement';
  drywallType?: 'wall' | 'ceiling'; // Parede ou Forro
  electricalPoints?: number; // Quantidade de pontos (tomadas/interruptores)

  // New Inputs
  plumbingPoints?: number; // Pontos de água
  plumbingType?: 'pvc_soldavel' | 'pex';
  
  waterproofingSystem?: 'rigid' | 'flexible'; // Argamassa Polimérica vs Manta
  
  finishingType?: 'baseboard' | 'crown_molding'; // Rodapé vs Roda-teto
  finishingMaterial?: 'wood' | 'ceramic' | 'polystyrene';

  demolitionType?: 'wall_brick' | 'concrete_floor' | 'tile_removal';
  demolitionThickness?: number; // cm (para calcular volume entulho)

  // Manual Input
  customDescription?: string;
  customUnit?: string;
  customQuantity?: number;
  customUnitPrice?: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ServiceType;
  unitPrice: number; 
  totalCost: number; 
  note?: string;
}

export interface CalculationResult {
  serviceType: ServiceType;
  totalArea: number;
  materials: MaterialItem[];
  generatedAt: Date;
  aiAnalysis?: string; 
}

export interface ProjectContext {
  contractorName: string; // New field
  clientName: string;
  projectName: string;
}