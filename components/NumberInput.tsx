import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, min = 1, max }) => {
  const handleIncrement = () => {
    const newValue = value + 1;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - 1;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
        if ((min === undefined || num >= min) && (max === undefined || num <= max)) {
            onChange(num);
        } else if (min !== undefined && num < min) {
            onChange(min);
        }
    } else if (e.target.value === '') {
        onChange(min);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        className="w-full p-3 border border-gray-200 rounded-xl text-center"
      />
      <div className="absolute right-2 flex flex-col">
        <button type="button" onClick={handleIncrement} className="p-1 text-gray-500 hover:text-gray-800">
          <ChevronUp className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleDecrement} className="p-1 text-gray-500 hover:text-gray-800">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
