import React from 'react';
import { quotaService } from '../services/api';

export const QuotaWarning: React.FC = () => {
  if (!quotaService.isExceeded()) {
    return null;
  }
  
  return (
    <div className="bg-red-500 text-white text-center py-2 px-4 z-[200] sticky top-0 font-bold text-sm">
      Aviso: Cota do Firebase excedida. O sistema está rodando em modo Local/Fallback. Dados não serão salvos na nuvem.
    </div>
  );
};
