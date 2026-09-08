import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { Chat } from "@/components/ai/chat";
import { PageHeader } from "@/components/app/page-header";
import { isAiConfigured } from "@/lib/ai";
import { getAppContext } from "@/lib/app-context";
import { features } from "@/lib/config";
import { listChats } from "@/lib/data/chat";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Chat",
  description: "Start an AI chat session with saved history.",
  path: "/dashboard/chat",
});

export default async function ChatPage() {
  if (!features.aiChat) notFound();

  await connection();

  if (!isAiConfigured) {
    return (
      <div className="content-width py-8">
        <PageHeader
          title="Chat"
          description="Streaming AI chat with saved history."
        />
        <AiNotConfigured feature="chat" />
      </div>
    );
  }

  const ctx = await getAppContext();
  if (!ctx) return null;

  const history = await listChats(ctx.user.id);
  const newId = crypto.randomUUID();

  return <Chat chatId={newId} initialMessages={[]} history={history} />;
}
