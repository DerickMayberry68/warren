type WarrenLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
};

export function WarrenLogo({
  className = "",
  compact = false,
  variant = "light",
}: WarrenLogoProps) {
  const foreground = variant === "light" ? "#f7f0e2" : "#17130f";
  const muted = variant === "light" ? "#d7a15b" : "#8f3f21";

  return (
    <svg
      aria-label="Warren Welding and Generators"
      className={className}
      role="img"
      viewBox="0 0 360 84"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!compact ? (
        <g>
          <text
            fill={foreground}
            fontFamily="Geist, Arial, sans-serif"
            fontSize="51"
            fontWeight="800"
            letterSpacing="4.8"
            x="0"
            y="46"
          >
            WARREN
          </text>
          <path
            d="M2 56h258"
            stroke={muted}
            strokeLinecap="square"
            strokeWidth="3"
          />
          <text
            fill={muted}
            fontFamily="Geist Mono, Consolas, monospace"
            fontSize="16"
            fontWeight="700"
            letterSpacing="2.9"
            x="3"
            y="77"
          >
            WELDING &amp; GENERATORS
          </text>
        </g>
      ) : (
        <text
          fill={foreground}
          fontFamily="Geist, Arial, sans-serif"
          fontSize="51"
          fontWeight="800"
          letterSpacing="4.8"
          x="0"
          y="54"
        >
          WARREN
        </text>
      )}
    </svg>
  );
}
