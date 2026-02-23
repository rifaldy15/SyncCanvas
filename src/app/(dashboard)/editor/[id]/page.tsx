import { getDocument } from "@/services/document";
import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const document = await getDocument(id);
  if (!document) notFound();

  return (
    <DocumentEditor
      document={document}
      userId={user.id}
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? user.email ?? "Anonymous"}
    />
  );
}
