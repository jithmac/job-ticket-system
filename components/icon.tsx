/** Material Symbols Outlined icon, as used throughout the sample UIs. */
export function Icon({
  name,
  className = "",
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${fill ? "fill" : ""} ${className}`}>
      {name}
    </span>
  );
}
