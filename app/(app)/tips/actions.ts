"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db/client";
import { getTip } from "@/lib/app/tips";
import { isDesignPreview } from "@/lib/config/countries";

export async function setTipSaved(slug: string, saved: boolean): Promise<{ error?: string; saved?: boolean }> {
  if (isDesignPreview()) return { error: "Saving is unavailable in the design preview. Sign in to the live app to save tips." };
  const user = await requireUser("/tips/" + encodeURIComponent(slug));
  try {
    const { tip } = await getTip(slug);
    if (!tip) return { error: "This published tip is no longer available." };
    const db = getDatabase();
    if (saved) {
      await db.savedTip.upsert({
        where: { userId_predictionId: { userId: user.id, predictionId: tip.id } },
        create: { userId: user.id, predictionId: tip.id, market: tip.locked ? null : tip.market, selection: tip.locked ? null : tip.selection, revisionAt: new Date(tip.updatedAt!) },
        update: {},
      });
    } else await db.savedTip.deleteMany({ where: { userId: user.id, predictionId: tip.id } });
    revalidatePath("/tips"); revalidatePath("/saved-tips"); revalidatePath("/profile");
    return { saved };
  } catch { return { error: "Could not save your change. Please try again." }; }
}
