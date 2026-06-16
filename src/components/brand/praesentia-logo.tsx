import Link from "next/link";
import type { CSSProperties } from "react";
import type { PraesentiaMarkOptions } from "@/lib/brand/praesentia-mark";

export type PraesentiaLogoVariant = "light" | "dark";

export const PRAESENTIA_LOGO_SRC = {
  light: "/brand/logo-praesentia-fundo-claro.svg",
  dark: "/brand/logo-praesentia-fundo-escuro.svg"
} as const;

export const PRAESENTIA_LOGO_ASPECT = 60854.14 / 20320;
export const PRAESENTIA_MARK_WIDTH_RATIO = 22000 / 60854.14;
export const PRAESENTIA_MARK_ASPECT = 22000 / 20320;

export type PraesentiaLogoProps = {
  href?: string;
  /** `light` = fundo claro (header). `dark` = fundo escuro (rodapé). */
  variant?: PraesentiaLogoVariant;
  markHeight?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  withTape?: boolean;
  withShadow?: boolean;
  layout?: "horizontal" | "vertical";
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
  markOptions?: PraesentiaMarkOptions;
  "aria-label"?: string;
};

function resolveLogoHeight({
  markHeight = 34,
  wordmarkSize = 18,
  showWordmark = true
}: Pick<PraesentiaLogoProps, "markHeight" | "wordmarkSize" | "showWordmark">) {
  if (!showWordmark) return markHeight;
  return Math.max(markHeight, Math.round(wordmarkSize * 1.65));
}

function LogoAsset({
  height,
  variant = "light",
  showWordmark = true,
  muted = false,
  className,
  style
}: {
  height: number;
  variant?: PraesentiaLogoVariant;
  showWordmark?: boolean;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const src = PRAESENTIA_LOGO_SRC[variant];
  const fullWidth = Math.round(height * PRAESENTIA_LOGO_ASPECT);
  const imageStyle: CSSProperties = {
    display: "block",
    height,
    width: fullWidth,
    maxWidth: "none",
    opacity: muted ? 0.72 : 1
  };

  if (showWordmark) {
    return (
      <img
        src={src}
        alt=""
        width={fullWidth}
        height={height}
        className={className ? `praesentia-logo-svg is-${variant} ${className}` : `praesentia-logo-svg is-${variant}`}
        style={{ ...imageStyle, width: "auto", maxWidth: "100%", ...style }}
      />
    );
  }

  const markWidth = Math.round(height * PRAESENTIA_MARK_ASPECT);

  return (
    <span
      className={className ? `praesentia-mark-crop is-${variant} ${className}` : `praesentia-mark-crop is-${variant}`}
      style={{
        display: "inline-block",
        height,
        width: markWidth,
        overflow: "hidden",
        flexShrink: 0,
        opacity: muted ? 0.72 : 1,
        ...style
      }}
    >
      <img src={src} alt="" width={fullWidth} height={height} style={imageStyle} />
    </span>
  );
}

export function PraesentiaLogo({
  href,
  variant = "light",
  markHeight = 34,
  showWordmark = true,
  wordmarkSize = 18,
  layout = "horizontal",
  muted = false,
  className,
  style,
  "aria-label": ariaLabel = "Praesentia"
}: PraesentiaLogoProps) {
  const height = resolveLogoHeight({ markHeight, wordmarkSize, showWordmark });
  const content = (
    <span
      className={`praesentia-logo-lockup${layout === "vertical" ? " is-vertical" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexDirection: layout === "vertical" ? "column" : "row"
      }}
    >
      <LogoAsset height={height} variant={variant} showWordmark={showWordmark} muted={muted} />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel} style={{ textDecoration: "none", color: "inherit", ...style }}>
        {content}
      </Link>
    );
  }

  return (
    <span className={className} aria-label={ariaLabel} style={style}>
      {content}
    </span>
  );
}

export function PraesentiaBrandFooter({
  kicker = "feito com",
  markHeight = 24,
  wordmarkSize = 17
}: {
  kicker?: string;
  markHeight?: number;
  wordmarkSize?: number;
}) {
  return (
    <div style={{ textAlign: "center", color: "var(--faint, #8a7c6a)" }}>
      <div className="mono" style={{ fontSize: 9, marginBottom: 6 }}>
        {kicker}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PraesentiaLogo variant="dark" markHeight={markHeight} wordmarkSize={wordmarkSize} />
      </div>
    </div>
  );
}

export function PraesentiaMarkOnly({
  height = 34,
  variant = "light",
  muted = false,
  className,
  style
}: {
  height?: number;
  variant?: PraesentiaLogoVariant;
  withTape?: boolean;
  withShadow?: boolean;
  markOptions?: PraesentiaMarkOptions;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return <LogoAsset height={height} variant={variant} showWordmark={false} muted={muted} className={className} style={style} />;
}
