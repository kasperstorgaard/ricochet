import { HTMLAttributes } from "preact";

import { clsx } from "clsx/lite";

type SelectProps = HTMLAttributes<HTMLSelectElement> & {
  label: string;
  value: string;
  name: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

/**
 * Native select with custom styling to match the app's design language.
 */
// TODO: make sure this works with standard form handling
export function Select(
  { label, value, name, options, onChange, ...rest }: SelectProps,
) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-fl-0 text-text-2">
        {label}
      </label>

      <div className="relative grid items-center">
        <select
          className={clsx(
            "py-1 pr-fl-2 pl-fl-1 rounded-1 ",
            "text-text-1 appearance-none text-1 font-weight-7 cursor-pointer bg-surface-1",
            "hover:bg-surface-3 focus:bg-surface-3",
          )}
          name={name}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <i className="ph-caret-down ph absolute right-2 pointer-events-none text-fl-0" />
      </div>
    </div>
  );
}
