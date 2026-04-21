import { useState } from "react";
import logoImage from "../assets/my-guys-time-option-b.png";

interface LogoProps {
  className?: string;
  size?: "app" | "marketing" | "preview";
}

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Logo({ className, size = "app" }: LogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span className={joinClasses("logo", `logo--${size}`, "brand-logo", className)}>
        <span className="brand-logo__primary">My Guys</span>
        <span className="brand-logo__secondary">Time</span>
      </span>
    );
  }

  return (
    <span className={joinClasses("logo", `logo--${size}`, className)}>
      <img
        alt="My Guys Time"
        className="logo__image"
        decoding="async"
        draggable={false}
        onError={() => setImageFailed(true)}
        src={logoImage}
      />
    </span>
  );
}
