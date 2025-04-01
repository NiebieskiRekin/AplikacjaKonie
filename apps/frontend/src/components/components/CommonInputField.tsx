import type { Dispatch, SetStateAction } from "react";

type CommonInputFieldProps<T = string | number | readonly string[]> = {
  label: string;
  type: string;
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
};

function CommonInputField({
  label,
  type,
  value,
  setValue,
}: CommonInputFieldProps) {
  return (
    <label className="mb-2 block">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border p-2"
      />
    </label>
  );
}

export default CommonInputField;
