/* SkiShare logo image. white={true} renders it white (for dark backgrounds). */
export default function Logo({ className = "h-9", white = false }: { className?: string; white?: boolean }) {
  return (
    <img
      src="/skishare-logo.png"
      alt="SkiShare"
      className={`${className} w-auto`}
      style={white ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
