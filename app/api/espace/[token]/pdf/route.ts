import { db, getByToken } from "@/lib/supabase";
import { inviteDict } from "@/lib/i18n/invite";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "private, no-store, max-age=0" };
type PdfAccessRow = { paid_at?: string | null; comped_at?: string | null; pdf_granted_at?: string | null };

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getByToken(token);
  if (!invitation) return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  const access = invitation as typeof invitation & PdfAccessRow;
  const dictionary = inviteDict(invitation.data.lang);
  if (!access.paid_at && !access.comped_at && !access.pdf_granted_at) {
    return Response.json({ error: dictionary.pdf.reserved }, { status: 403, headers: noStore });
  }
  const { data: replies, error } = await db().from("rsvps")
    .select("name,attending,guests,message,created_at")
    .eq("invitation_id", invitation.id)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) {
    console.error("space.pdf.replies", error.message);
    return Response.json({ error: "pdf_data_unavailable" }, { status: 500, headers: noStore });
  }
  return Response.json({
    invitation: {
      template: invitation.template,
      data: {
        partner1: invitation.data.partner1,
        partner2: invitation.data.partner2,
        lang: invitation.data.lang || "fr",
        dateISO: invitation.data.dateISO,
        venue: invitation.data.venue,
      },
    },
    replies: replies || [],
    generatedAt: new Date().toISOString(),
  }, { headers: noStore });
}
