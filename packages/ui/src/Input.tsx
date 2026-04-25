interface InputProps {
  label: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function InputField({ label, value, unit, min = 0, max = 10000, step = 1, onChange }: InputProps) {
  return { label, value, unit, min, max, step, onChange };
}