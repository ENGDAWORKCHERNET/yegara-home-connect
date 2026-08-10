import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/") || (file.type && !ALLOWED.includes(file.type))) {
    return "Please choose a JPG, PNG or WEBP image.";
  }
  if (file.size > MAX_BYTES) return "Image is too large. Maximum size is 5MB.";
  if (file.size === 0) return "That file appears to be empty.";
  return null;
}

/** Uploads into the user's own private folder using a random file name. */
export async function uploadPrivateImage(userId: string, folder: string, file: File) {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}
