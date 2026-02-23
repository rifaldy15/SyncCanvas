import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getDocuments } from "@/services/document";
import { DocumentsContent } from "./documents-content";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let documents: Awaited<ReturnType<typeof getDocuments>> = [];
  try {
    documents = await getDocuments();
  } catch {
    // Table might not exist yet
  }

  return (
    <DocumentsContent
      user={{
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? "",
      }}
      initialDocuments={documents}
    />
  );
}
