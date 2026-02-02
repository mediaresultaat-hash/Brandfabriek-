import { getSessionUser } from "../../../../lib/auth";
import { supabaseServer } from "../../../../lib/supabaseServer";

const BUCKET = "post-media";

export async function POST(request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType } = await request.json();
  if (!filename) {
    return Response.json({ error: "Missing filename" }, { status: 400 });
  }

  const path = `${sessionUser.id}/${Date.now()}-${filename}`;

  const { data, error } = await supabaseServer.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { contentType: contentType || "application/octet-stream" });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const { data: publicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({
    uploadUrl: data.signedUrl,
    path,
    publicUrl: publicUrl.publicUrl
  });
}
