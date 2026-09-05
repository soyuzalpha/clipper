import { streamAsset } from "../../serve";

export const dynamic = "force-dynamic";

/** Attachment stream with a sanitized filename. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return streamAsset(request, id, "attachment");
}
