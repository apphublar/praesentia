import type { CSSProperties, ReactNode } from "react";

export function GuestPolaroidFrame({
  src,
  alt,
  caption,
  footer,
  className,
  style,
  rotate,
  withTape,
  tapeColor,
  captionStyle = "inline"
}: {
  src?: string;
  alt: string;
  caption?: string;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
  rotate?: number;
  withTape?: boolean;
  tapeColor?: string;
  captionStyle?: "inline" | "polaroid";
}) {
  return (
    <article
      className={`guest-polaroid polaroid${className ? ` ${className}` : ""}`}
      style={{
        transform: rotate !== undefined ? `rotate(${rotate}deg)` : undefined,
        ...style
      }}
    >
      {withTape ? <span className="tape guest-polaroid-tape" style={tapeColor ? { background: tapeColor } : undefined} /> : null}
      <div className="guest-polaroid-media">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="guest-polaroid-image" />
        ) : (
          <div className="guest-polaroid-fallback" aria-hidden="true" />
        )}
      </div>
      {caption ? (
        captionStyle === "polaroid" ? (
          <div className="cap">{caption}</div>
        ) : (
          <p className="guest-polaroid-caption">{caption}</p>
        )
      ) : null}
      {footer}
    </article>
  );
}
