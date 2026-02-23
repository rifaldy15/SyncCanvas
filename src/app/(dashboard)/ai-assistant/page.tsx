import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AIAssistantContent } from "./ai-assistant-content";

export default async function AIAssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AIAssistantContent
      user={{
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? "",
      }}
    />
  );
}
