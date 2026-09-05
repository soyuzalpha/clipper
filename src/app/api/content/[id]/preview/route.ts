import { streamAsset } from "../../serve";

export const dynamic = "force-dynamic";

/** Inline media stream — <video>/<audio>/<img>/PDF embed hits this URL. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return streamAsset(request, id, "inline");
}
