import Image from "next/image";
import trophyImage from "@/public/assets/decorations/trophy.webp";
import pitchImage from "@/public/assets/backgrounds/stadium-pitch.webp";

/**
 * The promotional card at the foot of the desktop sidebar.
 *
 * Composed rather than shipped as one flat picture (guide §13.4): the stadium
 * photograph, the trophy cut-out and the lettering are three layers, so the
 * words stay live text and translate with the rest of the product. The mock
 * bakes them into the artwork; keeping them separate is the documented
 * deviation, and it costs nothing visually.
 */
export function SidebarPromo() {
  return (
    <div className="relative isolate overflow-hidden rounded-card border border-navy-600/60">
      <Image src={pitchImage} alt="" fill sizes="240px" className="-z-10 object-cover" />
      {/* Navy wash so the lettering keeps its contrast over a busy photograph. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-navy-950/72" />

      <div className="flex flex-col gap-3 p-4">
        <p className="font-script text-[1.75rem] leading-[0.95] font-bold text-on-navy">
          Smarter Bets
          <br />
          <span className="text-green-400">Brighter</span>
          <br />
          Days
        </p>

        <Image
          src={trophyImage}
          alt=""
          sizes="200px"
          className="mx-auto h-28 w-auto drop-shadow-[0_0_18px_rgba(60,249,128,0.35)]"
        />

        <p className="kicker !text-on-navy-2">
          More than tips
          <br />A brighter game
        </p>
        <span aria-hidden className="h-0.5 w-10 rounded-full bg-green-400" />
      </div>
    </div>
  );
}
