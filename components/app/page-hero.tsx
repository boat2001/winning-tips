import type { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import pitchImage from "@/public/assets/backgrounds/stadium-pitch.webp";
import ribbon from "@/public/assets/decorations/green-ribbon.webp";
import { cn } from "@/lib/utils/cn";
export function PageHero({kicker,title,subtitle,artwork,artworkClassName,flourish,children,className}: {
  kicker?:string;title:ReactNode;subtitle?:string;artwork?:StaticImageData;artworkClassName?:string;flourish?:ReactNode;children?:ReactNode;className?:string;
}) {
  return <section className={cn("page-hero",artwork && "has-artwork",className)}>
    <Image src={pitchImage} alt="" fill priority sizes="(min-width: 1200px) 1200px, 100vw" className="hero-pitch" />
    <div aria-hidden className="hero-scrim" />
    <Image src={ribbon} alt="" sizes="100vw" className="hero-ribbon" />
    {artwork && <Image src={artwork} alt="" priority sizes="(min-width: 1200px) 580px, 65vw" className={cn("hero-athletes",artworkClassName)} />}
    <div className="hero-copy">{kicker && <p className="kicker">{kicker}</p>}<h1>{title}</h1>{subtitle && <p className="hero-subtitle">{subtitle}</p>}</div>
    {flourish && <p className="hero-flourish"><span aria-hidden className="block text-green-400">♛</span>{flourish}<span aria-hidden className="flourish-line" /></p>}
    {children && <div className="hero-content">{children}</div>}
  </section>;
}
