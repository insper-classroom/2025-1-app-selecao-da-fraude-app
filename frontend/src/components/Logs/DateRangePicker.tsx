import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ptBR from 'date-fns/locale/pt-BR';
import { Calendar } from 'lucide-react';
import Button from '../UI/Button';

// Register Portuguese (Brazil) locale
registerLocale('pt-BR', ptBR);

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  onApply: () => void;
  onReset: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  onApply,
  onReset
}) => {
  return (
    <div className="bg-white rounded-lg shadow-ml p-4">
      <div className="flex flex-col md:flex-row md:space-x-4">
        <div className="mb-4 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Inicial
          </label>
          <div className="relative">
            <DatePicker
              selected={startDate}
              onChange={(date) => onDateChange(date, endDate)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={new Date()}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-ml-blue focus:border-ml-blue pl-10"
              placeholderText="Selecione uma data"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="mb-4 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Final
          </label>
          <div className="relative">
            <DatePicker
              selected={endDate}
              onChange={(date) => onDateChange(startDate, date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-ml-blue focus:border-ml-blue pl-10"
              placeholderText="Selecione uma data"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-end space-x-2">
          <Button
            onClick={onApply}
            disabled={!startDate || !endDate}
          >
            Aplicar Filtro
          </Button>
          
          <Button
            variant="secondary"
            onClick={onReset}
          >
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;