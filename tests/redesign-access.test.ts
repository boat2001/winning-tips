import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({user:vi.fn(),predictions:vi.fn(),payments:vi.fn(),saved:vi.fn()}));
vi.mock("react",()=>({cache:(fn:unknown)=>fn}));
vi.mock("@/lib/auth/session",()=>({getCurrentUser:mocks.user}));
vi.mock("@/lib/config/countries",()=>({isDesignPreview:()=>false}));
vi.mock("@/lib/db/client",()=>({getDatabase:()=>({prediction:{findMany:mocks.predictions},payment:{findMany:mocks.payments},savedTip:{findMany:mocks.saved}})}));
import { getTipsData } from "@/lib/app/tips";
function row(id:string,bookingId:string|null,visibility="PREMIUM"){
 return {id,slug:id,bookingId,visibility,result:"PENDING",market:"Private market",selection:"Private selection",analysis:"Private analysis",confidence:99,updatedAt:new Date(),fixture:{kickoffAt:new Date(),status:"SCHEDULED",homeScore:null,awayScore:null,league:{name:"League"},homeTeam:{name:"Home"},awayTeam:{name:"Away"}}};
}
beforeEach(()=>{
 mocks.user.mockResolvedValue({id:"member",role:"USER"});
 mocks.predictions.mockResolvedValue([row("owned","booking-one"),row("other","booking-two"),row("free",null,"FREE")]);
 mocks.payments.mockResolvedValue([{bookingId:"booking-one"}]);mocks.saved.mockResolvedValue([]);
});
describe("member tip data boundary",()=>{
 it("unlocks only the exact successfully purchased booking",async()=>{
   const {tips}=await getTipsData();
   expect(tips[0]).toMatchObject({locked:false,selection:"Private selection"});
   expect(tips[1]).toMatchObject({locked:true,summary:null,selection:"Unlock this slip to view"});
   expect(tips[2]).toMatchObject({locked:false});
   expect(mocks.payments).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({userId:"member",status:"SUCCESS"})}));
 });
 it("never relabels editorial confidence or unverified odds as a model output",async()=>{
   const {tips}=await getTipsData();
   expect(tips[0]).toMatchObject({modelProbability:null,confidenceBand:null,dataQuality:null,odds:null});
 });
 it("keeps premium content out of guest responses",async()=>{
   mocks.user.mockResolvedValue(null);
   const {tips}=await getTipsData();expect(tips[0].locked).toBe(true);expect(tips[0].summary).toBeNull();
 });
 it("reports an outage instead of silently substituting fixture records",async()=>{
   mocks.predictions.mockRejectedValue(new Error("Unavailable"));
   expect(await getTipsData()).toEqual({tips:[],unavailable:true});
 });
 it("excludes draft, future-published and mock-provider rows at the query boundary",async()=>{
   await getTipsData();
   expect(mocks.predictions).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({status:"PUBLISHED",fixture:{provider:{not:"mock"}}})}));
 });
});
