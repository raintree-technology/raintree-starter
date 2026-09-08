import { notFound, redirect } from "next/navigation";
import { Chat } from "@/components/ai/chat";
import { isAiConfigured } from "@/lib/ai";
import { getAppContext } from "@/lib/app-context";
import { features } from "@/lib/config";
import { getChatMessages, listChats } from "@/lib/data/chat";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Chat",
  description: "Continue a saved AI chat session.",
  path: "/dashboard/chat",
});

export default async function ChatByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!features.aiChat) notFound();
  if (!isAiConfigured) redirect("/dashboard/chat");

  const ctx = await getAppContext();
  if (!ctx) return null;

  const { id } = await params;
  const [messages, history] = await Promise.all([
    getChatMessages(id, ctx.user.id),
    listChats(ctx.user.id),
  ]);

  return <Chat chatId={id} initialMessages={messages} history={history} />;
}
