import { HTMLAttributes } from "preact";

type NumberRangeProps =
  & Omit<HTMLAttributes<HTMLInputElement>, "onChange" | "value" | "label">
  & {
    label: string;
    value: [number, number];
    min?: number;
    max?: number;
    onChange: (value: [number, number]) => void;
  };

/** Labeled min–max pair using native number inputs. */
export function NumberRange(
  { label, value, min = 0, max = 20, onChange, ...rest }: NumberRangeProps,
) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-fl-0 text-text-2">{label}</span>

      <div className="flex items-center gap-fl-1">
        <input
          type="number"
          className="text-1 min-w-4ch text-center"
          value={value[0]}
          min={min}
          max={value[1]}
          onChange={(e) => onChange([Number(e.currentTarget.value), value[1]])}
          {...rest}
        />

        <span className="text-text-2">–</span>

        <input
          type="number"
          className="text-1 min-w-4ch text-center"
          value={value[1]}
          min={value[0]}
          max={max}
          onChange={(e) => onChange([value[0], Number(e.currentTarget.value)])}
        />
      </div>
    </div>
  );
}
