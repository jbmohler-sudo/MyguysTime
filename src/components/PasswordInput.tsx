import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  inputClassName?: string;
}

export function PasswordInput({
  autoComplete,
  disabled,
  inputClassName,
  style,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="password-input">
      <input
        {...inputProps}
        autoComplete={autoComplete}
        className={inputClassName}
        disabled={disabled}
        style={style ? { ...style, paddingRight: "3.25rem" } : undefined}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="password-input__toggle"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}
