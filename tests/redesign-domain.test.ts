import { describe, expect, it, vi, afterEach } from "vitest";
import { safeDestination } from "@/lib/auth/destination";
import { isDesignPreview } from "@/lib/config/countries";
import { resultsForRange, summarizeResults } from "@/lib/domain/result-summary";
import { applyTipFilters, parseTipFilters } from "@/lib/domain/tip-filters";
import { isOddsStale, type PublishedTip } from "@/lib/domain/tips";
const now = new Date("2026-09-07T12:00:00Z");
const tip = (overrides:Partial<PublishedTip>={}):PublishedTip=>({
 id:"one",slug:"one",sport:"football",competition:"League",home:{name:"Home"},away:{name:"Away"},kickoffAt:"2026-09-07T10:00:00Z",
 market:"1X2",selection:"Home",modelProbability:null,confidenceBand:null,dataQuality:null,odds:null,status:"GRADED",grade:"WON",finalScore:"1 - 0",premium:false,savedByViewer:false,summary:null,...overrides
});
afterEach(()=>vi.unstubAllEnvs());
describe("redesign domain",()=>{
 it("never allows preview records in production",()=>{vi.stubEnv("NODE_ENV","production");vi.stubEnv("DESIGN_PREVIEW","true");expect(isDesignPreview()).toBe(false);});
 it("requires explicit development preview opt-in",()=>{vi.stubEnv("NODE_ENV","development");vi.stubEnv("DESIGN_PREVIEW","false");expect(isDesignPreview()).toBe(false);vi.stubEnv("DESIGN_PREVIEW","true");expect(isDesignPreview()).toBe(true);});
 it("rejects external, backslash and control-character login destinations",()=>{
   for(const path of ["//evil.example","/\\evil.example","/\nevil.example","https://evil.example"]) expect(safeDestination(path)).toBe("/home");
   expect(safeDestination("/tips/one?from=saved#analysis")).toBe("/tips/one?from=saved#analysis");
 });
 it("filters result records, not just headings, across inclusive day boundaries",()=>{
   const today=tip();const edge=tip({id:"edge",kickoffAt:"2026-09-01T00:00:00Z"});const old=tip({id:"old",kickoffAt:"2026-08-31T23:59:59Z"});
   expect(resultsForRange([today,edge,old],"today",now)).toEqual([today]);
   expect(resultsForRange([today,edge,old],"7d",now)).toEqual([today,edge]);
   expect(resultsForRange([today,edge,old],"all",now)).toHaveLength(3);
 });
 it("retains losses, voids and pushes without diluting the decided win rate",()=>{
   const summary=summarizeResults([tip(),tip({grade:"LOST"}),tip({grade:"VOID"}),tip({grade:"PUSH"})],"all");
   expect(summary).toMatchObject({settled:4,won:1,lost:1,voided:2,winRate:0.5,units:null});
   expect(summarizeResults([tip({grade:"VOID"})],"all").winRate).toBeNull();
 });
 it("excludes yesterday, suspended and graded tips from today's picks",()=>{
   const active=tip({grade:null,status:"PUBLISHED",kickoffAt:"2026-09-07T18:00:00Z"});
   expect(applyTipFilters([active,tip(),tip({...active,id:"old",kickoffAt:"2026-09-06T18:00:00Z"}),tip({...active,status:"SUSPENDED"})],parseTipFilters({}),now)).toEqual([active]);
 });
 it("treats malformed and future-dated odds as unavailable",()=>{
   for(const capturedAt of ["invalid","2026-09-08T12:00:00Z"]) expect(isOddsStale({decimal:1.5,capturedAt,operatorName:"Example"},now)).toBe(true);
 });
});
