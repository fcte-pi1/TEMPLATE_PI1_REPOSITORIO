import type { ChangeEvent, InputHTMLAttributes } from "react";

interface ButtonSelectProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  name: string;
  defaultChecked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ButtonSelect({
  label,
  value,
  name,
 defaultChecked,
 onChange,
...rest} : ButtonSelectProps) {
  return (
    <label
      className="
        text-white/20
        border border-white/30
        hover:text-white
        hover:border-white
        transition

        has-checked:text-[#00D3F3]
        has-checked:bg-[#00D3F3]/10
        has-checked:border-[#00D3F3]

        px-2.5 py-1.5
        rounded-md
        cursor-pointer
      "
    >
      {label}

      <input

        {...rest}
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
        onChange={onChange}
      />
    </label>
  );
}