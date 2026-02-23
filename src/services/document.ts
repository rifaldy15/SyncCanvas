"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface DocumentRow {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export async function getDocuments(): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createDocument(
  initialTitle?: string,
  initialContent?: string,
): Promise<DocumentRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: initialTitle || "Untitled",
      content: initialContent || "",
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return data;
}

export async function updateDocument(
  id: string,
  updates: { title?: string; content?: string },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
