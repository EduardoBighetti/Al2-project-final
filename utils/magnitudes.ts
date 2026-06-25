export interface MagnitudeDef {
  key: string;
  name: string;
  unit: string;
}

export interface MagnitudeCategory {
  name: string;
  magnitudes: MagnitudeDef[];
}

export const MAGNITUDE_CATEGORIES: MagnitudeCategory[] = [
  {
    name: "Espaço e Tempo",
    magnitudes: [
      { key: "comprimento", name: "Comprimento", unit: "m" },
      { key: "area", name: "Área", unit: "m²" },
      { key: "volume", name: "Volume", unit: "m³" },
      { key: "tempo", name: "Tempo", unit: "s" },
      { key: "frequencia", name: "Frequência", unit: "Hz" },
      { key: "velocidade", name: "Velocidade", unit: "m/s" },
      { key: "aceleracao", name: "Aceleração", unit: "m/s²" },
      { key: "velocidade_angular", name: "Velocidade angular", unit: "rad/s" },
      { key: "aceleracao_angular", name: "Aceleração angular", unit: "rad/s²" },
    ],
  },
  {
    name: "Mecânica e Matéria",
    magnitudes: [
      { key: "massa", name: "Massa", unit: "kg" },
      { key: "densidade", name: "Densidade", unit: "kg/m³" },
      { key: "forca", name: "Força", unit: "N" },
      { key: "peso", name: "Peso", unit: "N" },
      { key: "torque", name: "Torque", unit: "N·m" },
      { key: "pressao", name: "Pressão", unit: "Pa" },
      { key: "trabalho", name: "Trabalho", unit: "J" },
      { key: "energia", name: "Energia", unit: "J" },
      { key: "potencia", name: "Potência", unit: "W" },
      { key: "quantidade_movimento", name: "Quantidade de movimento", unit: "kg·m/s" },
      { key: "momento_angular", name: "Momento angular", unit: "kg·m²/s" },
      { key: "momento_inercia", name: "Momento de inércia", unit: "kg·m²" },
      { key: "viscosidade_dinamica", name: "Viscosidade dinâmica", unit: "Pa·s" },
      { key: "viscosidade_cinematica", name: "Viscosidade cinemática", unit: "m²/s" },
      { key: "tensao_superficial", name: "Tensão superficial", unit: "N/m" },
      { key: "vazao_volumetrica", name: "Vazão volumétrica", unit: "m³/s" },
      { key: "vazao_massica", name: "Vazão mássica", unit: "kg/s" },
    ],
  },
  {
    name: "Termodinâmica e Calor",
    magnitudes: [
      { key: "temperatura", name: "Temperatura", unit: "°C" }, // Default °C (could be K, but °C is common)
      { key: "calor", name: "Calor", unit: "J" },
      { key: "fluxo_termico", name: "Fluxo térmico", unit: "W" },
      { key: "condutividade_termica", name: "Condutividade térmica", unit: "W/(m·K)" },
      { key: "resistencia_termica", name: "Resistência térmica", unit: "K/W" },
      { key: "capacidade_termica", name: "Capacidade térmica", unit: "J/K" },
      { key: "calor_especifico", name: "Calor específico", unit: "J/(kg·K)" },
      { key: "entropia", name: "Entropia", unit: "J/K" },
      { key: "entalpia", name: "Entalpia", unit: "J" },
    ],
  },
  {
    name: "Eletricidade e Magnetismo",
    magnitudes: [
      { key: "carga_eletrica", name: "Carga elétrica", unit: "C" },
      { key: "densidade_carga", name: "Densidade de carga", unit: "C/m³" },
      { key: "corrente_eletrica", name: "Corrente elétrica", unit: "A" },
      { key: "densidade_corrente", name: "Densidade de corrente", unit: "A/m²" },
      { key: "tensao_eletrica", name: "Tensão elétrica", unit: "V" },
      { key: "campo_eletrico", name: "Campo elétrico", unit: "V/m" },
      { key: "resistencia_eletrica", name: "Resistência elétrica", unit: "Ω" },
      { key: "resistividade_eletrica", name: "Resistividade elétrica", unit: "Ω·m" },
      { key: "condutancia_eletrica", name: "Condutância elétrica", unit: "S" },
      { key: "condutividade_eletrica", name: "Condutividade elétrica", unit: "S/m" },
      { key: "capacitancia", name: "Capacitância", unit: "F" },
      { key: "indutancia", name: "Indutância", unit: "H" },
      { key: "permissividade", name: "Permissividade", unit: "F/m" },
      { key: "permeabilidade_magnetica", name: "Permeabilidade magnética", unit: "H/m" },
      { key: "fluxo_magnetico", name: "Fluxo magnético", unit: "Wb" },
      { key: "densidade_fluxo_magnetico", name: "Densidade de fluxo magnético", unit: "T" },
      { key: "intensidade_campo_magnetico", name: "Intensidade de campo magnético", unit: "A/m" },
      { key: "forca_magnetomotriz", name: "Força magnetomotriz", unit: "Ae" },
    ],
  },
  {
    name: "Óptica e Radiação Eletromagnética",
    magnitudes: [
      { key: "fluxo_luminoso", name: "Fluxo luminoso", unit: "lm" },
      { key: "intensidade_luminosa", name: "Intensidade luminosa", unit: "cd" },
      { key: "iluminancia", name: "Iluminância", unit: "lx" },
      { key: "luminancia", name: "Luminância", unit: "cd/m²" },
      { key: "energia_radiante", name: "Energia radiante", unit: "J" },
      { key: "fluxo_radiante", name: "Fluxo radiante", unit: "W" },
      { key: "intensidade_radiante", name: "Intensidade radiante", unit: "W/sr" },
      { key: "irradiancia", name: "Irradiância", unit: "W/m²" },
      { key: "radiancia", name: "Radiância", unit: "W/(sr·m²)" },
      { key: "comprimento_onda", name: "Comprimento de onda", unit: "m" },
      { key: "indice_refracao", name: "Índice de refração", unit: "" },
    ],
  },
  {
    name: "Acústica",
    magnitudes: [
      { key: "pressao_sonora", name: "Pressão sonora", unit: "Pa" },
      { key: "intensidade_sonora", name: "Intensidade sonora", unit: "W/m²" },
      { key: "potencia_sonora", name: "Potência sonora", unit: "W" },
      { key: "nivel_ruido", name: "Nível de ruído", unit: "dB" },
    ],
  },
  {
    name: "Química e Física Molecular",
    magnitudes: [
      { key: "quantidade_materia", name: "Quantidade de matéria", unit: "mol" },
      { key: "concentracao_molar", name: "Concentração molar", unit: "mol/m³" },
      { key: "concentracao_massica", name: "Concentração mássica", unit: "kg/m³" },
      { key: "molalidade", name: "Molalidade", unit: "mol/kg" },
      { key: "fracao_molar", name: "Fração molar", unit: "mol/mol" },
      { key: "massa_molar", name: "Massa molar", unit: "kg/mol" },
      { key: "volume_molar", name: "Volume molar", unit: "m³/mol" },
    ],
  },
  {
    name: "Física Nuclear e Radiação Ionizante",
    magnitudes: [
      { key: "atividade_radioativa", name: "Atividade radioativa", unit: "Bq" },
      { key: "dose_absorvida", name: "Dose absorvida", unit: "Gy" },
      { key: "equivalente_dose", name: "Equivalente de dose", unit: "Sv" },
      { key: "exposicao_radiacao", name: "Exposição à radiação", unit: "C/kg" },
      { key: "taxa_dose_absorvida", name: "Taxa de dose absorvida", unit: "Gy/s" },
    ],
  },
  {
    name: "Adimensionais e Estatísticas",
    magnitudes: [
      { key: "umidade_relativa", name: "Umidade relativa", unit: "%" },
      { key: "indice_uv", name: "Índice UV", unit: "UV" },
      { key: "qualidade_ar", name: "Qualidade do ar", unit: "AQI" },
      { key: "ph", name: "Potencial hidrogênico (pH)", unit: "" },
      { key: "angulo_plano", name: "Ângulo plano", unit: "rad" },
      { key: "angulo_solido", name: "Ângulo sólido", unit: "sr" },
    ],
  },
];

export const getMagnitudeByKey = (key: string): MagnitudeDef | undefined => {
  for (const cat of MAGNITUDE_CATEGORIES) {
    const mag = cat.magnitudes.find((m) => m.key === key);
    if (mag) return mag;
  }
  return undefined;
};
