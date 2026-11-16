import { UsersRound } from "lucide-react";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  group?: boolean;
}

export function Avatar({
  src,
  name,
  size = "md",
  online = false,
  group = false,
}: AvatarProps) {
  return (
    <span
      className={`avatar avatar-${size}${src ? " has-image" : ""}`}
      style={src ? { backgroundImage: `url("${src}")` } : undefined}
      role="img"
      aria-label={name}
    >
      {!src && (group ? <UsersRound size={size === "sm" ? 14 : 18} /> : name.slice(0, 1))}
      {online && <span className="online-dot" />}
    </span>
  );
}
