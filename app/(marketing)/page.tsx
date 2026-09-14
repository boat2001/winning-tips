import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Send, Trophy, Users, Zap } from "lucide-react";
import athleteGroup from "@/public/assets/athletes/athlete-group.webp";
import phoneDashboard from "@/public/assets/mockups/phone-dashboard.webp";
import pitchImage from "@/public/assets/backgrounds/stadium-pitch.webp";
import sportBalls from "@/public/assets/sports/balls.webp";
import ribbon from "@/public/assets/decorations/green-ribbon.webp";
import supporters from "@/public/assets/community/cheering-supporters.webp";
import { getCurrentUser } from "@/lib/auth/session";
import { communityLinks } from "@/lib/config/site";
import { SiteLinksFooter } from "@/components/app/site-links-footer";
import { LandingSections } from "@/components/marketing/landing-sections";
import { getTipsData } from "@/lib/app/tips";
import { launchCountry } from "@/lib/config/countries";
export const metadata:Metadata={title:"Your Home for Smart Sports Predictions",alternates:{canonical:"/"},description:"Sports predictions, clear analysis and a transparent results record. Built for Africa, starting in Ghana."};
export const dynamic="force-dynamic";
export default async function LandingPage(){
  const user=await getCurrentUser(); if(user)redirect("/home");
  const data=await getTipsData();
  return <><section className="landing-hero">
    <Image src={pitchImage} alt="" fill priority sizes="100vw" className="landing-pitch"/>
    <div className="landing-wash" aria-hidden/>
    <Image src={ribbon} alt="" sizes="100vw" className="landing-ribbon"/>
    <Image src={supporters} alt="" sizes="45vw" className="landing-supporters"/>
    <div className="landing-copy"><p className="landing-kicker">Africa&apos;s sports prediction community</p><h1>Your Home for<br/><span>Smart Sports</span><br/>Predictions</h1>
      <p className="landing-lede">Explore daily predictions, thoughtful analysis, and a transparent results record. Your home for football, basketball and tennis insights. Predict smarter, together.</p>
      <div className="landing-actions"><a href={communityLinks.telegram} target="_blank" rel="noreferrer" className="landing-join"><Send aria-hidden/><span>Join Our Telegram<small>GET DAILY TIPS</small></span><ChevronRight aria-hidden/></a><Link href="/tips" className="landing-picks">View Today&apos;s Picks <ChevronRight aria-hidden/></Link></div>
      <div className="landing-trust">{[{icon:Trophy,text:"Transparent Results"},{icon:Zap,text:"Daily Sports Insights"},{icon:Users,text:"An African Community"}].map(t=><div key={t.text}><t.icon aria-hidden/><span>{t.text}</span></div>)}</div>
    </div>
    <div className="landing-art" aria-label="Illustration of the Winning Tips experience">
      <Image src={athleteGroup} alt="" priority sizes="(min-width:1200px) 800px, 80vw" className="landing-athletes"/>
      <figure className="landing-phone"><Image src={phoneDashboard} alt="Illustrative Winning Tips app preview. Sample figures are not live performance." priority sizes="(min-width:1200px) 460px, 65vw"/><figcaption>Illustrative app preview · sample figures</figcaption></figure>
      <div className="landing-float landing-float-one"><Users aria-hidden/><span><strong>One community</strong><small>Share. Learn. Together.</small></span></div>
      <div className="landing-float landing-float-two"><Trophy aria-hidden/><span><strong>Open record</strong><small>Wins and losses included</small></span></div>
      <Image src={sportBalls} alt="" sizes="(min-width:1200px) 300px, 60vw" className="landing-balls"/>
    </div>
    <p className="landing-script">More<br/>Winners<br/>Together<span/></p>
    <p className="landing-script-right">Different<br/>Games.<br/>Same Passion.<span/></p>
  </section><LandingSections tips={data.tips} timezone={launchCountry.timezone}/><SiteLinksFooter/></>;
}
