"use client";

import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isDataUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { FileText, History, LinkIcon, Plus, Send, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, memo, useCallback, useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatSummary = { id: string; title: string };
type ChatStatus = UseChatHelpers<UIMessage>["status"];
type MessagePart = UIMessage["parts"][number];

export function Chat({
  chatId,
  initialMessages,
  history,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  history: ChatSummary[];
}) {
  const pathname = usePathname();
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { id: chatId } }),
    [chatId],
  );
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full">
      <ChatSidebar history={history} pathname={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="sr-only">Chat</h1>
        <MobileChatBar history={history} pathname={pathname} />
        <MessageList messages={messages} />
        <p role="status" className="sr-only">
          {status === "submitted" || status === "streaming"
            ? "Assistant is responding…"
            : ""}
        </p>
        <ChatComposer
          status={status}
          error={error}
          onSend={handleSend}
          onStop={stop}
          onRetry={regenerate}
        />
      </div>
    </div>
  );
}

/** Compact history access below lg, where the sidebar is hidden. */
const MobileChatBar = memo(function MobileChatBar({
  history,
  pathname,
}: {
  history: ChatSummary[];
  pathname: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2 lg:hidden">
      <span className="text-sm font-semibold">Chat</span>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={history.length === 0}>
              <History className="h-4 w-4" />
              History
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-72 w-64 overflow-y-auto"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Recent conversations
            </DropdownMenuLabel>
            {history.map((chat) => (
              <DropdownMenuItem
                key={chat.id}
                onClick={() => router.push(`/dashboard/chat/${chat.id}`)}
                className={cn(
                  pathname === `/dashboard/chat/${chat.id}` && "bg-secondary",
                )}
              >
                <span className="truncate">{chat.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/chat">
            <Plus className="h-4 w-4" /> New chat
          </Link>
        </Button>
      </div>
    </div>
  );
});

const ChatSidebar = memo(function ChatSidebar({
  history,
  pathname,
}: {
  history: ChatSummary[];
  pathname: string;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r p-3 lg:flex">
      <Button
        asChild
        variant="outline"
        className="mb-3 w-full justify-start gap-2"
      >
        <Link href="/dashboard/chat">
          <Plus className="h-4 w-4" /> New chat
        </Link>
      </Button>
      <nav
        aria-label="Chat history"
        className="flex flex-col gap-1 overflow-y-auto"
      >
        {history.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No conversations yet. They&apos;ll appear here once you start
            chatting.
          </p>
        )}
        {history.map((chat) => {
          const active = pathname === `/dashboard/chat/${chat.id}`;

          return (
            <Link
              key={chat.id}
              href={`/dashboard/chat/${chat.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "truncate rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {chat.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
});

const MessageList = memo(function MessageList({
  messages,
}: {
  messages: UIMessage[];
}) {
  return (
    <Conversation>
      <ConversationContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-8">
        {messages.length === 0 && (
          <ConversationEmptyState
            className="min-h-[45vh]"
            title="Ask anything"
            description="Responses stream in as they're generated, and conversations are saved to your history."
          />
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
});

const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: UIMessage;
}) {
  return (
    <Message from={message.role} className="max-w-full">
      <MessageContent
        className={cn(
          "max-w-[85%]",
          "group-[.is-assistant]:rounded-lg group-[.is-assistant]:bg-secondary group-[.is-assistant]:px-4 group-[.is-assistant]:py-3",
        )}
      >
        {message.parts.map((part, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Message parts are append-only stream positions without separate IDs.
          <MessagePartView key={`${part.type}-${index}`} part={part} />
        ))}
      </MessageContent>
    </Message>
  );
});

const MessagePartView = memo(function MessagePartView({
  part,
}: {
  part: MessagePart;
}) {
  if (part.type === "text") {
    return <MessageResponse>{part.text}</MessageResponse>;
  }

  if (part.type === "reasoning" && part.text.trim()) {
    return (
      <details className="rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          Reasoning
        </summary>
        <MessageResponse className="mt-2">{part.text}</MessageResponse>
      </details>
    );
  }

  if (isToolUIPart(part)) {
    return <ToolPartView part={part} />;
  }

  if (part.type === "source-url") {
    return (
      <a
        href={part.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs underline-offset-4 hover:underline"
      >
        <LinkIcon className="h-3.5 w-3.5" />
        <span className="truncate">{part.title ?? part.url}</span>
      </a>
    );
  }

  if (part.type === "source-document") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span className="truncate">
          {part.title || part.filename || "Source document"}
        </span>
      </div>
    );
  }

  if (part.type === "file") {
    const label = part.filename ?? part.mediaType;

    if (part.mediaType.startsWith("image/") || part.mediaType === "image") {
      return (
        <Image
          src={part.url}
          alt={label}
          width={640}
          height={360}
          unoptimized
          className="max-h-72 rounded-md border object-contain"
        />
      );
    }

    return (
      <a
        href={part.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs underline-offset-4 hover:underline"
      >
        <FileText className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </a>
    );
  }

  if (part.type === "reasoning-file") {
    return (
      <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        Reasoning file available
      </div>
    );
  }

  if (isDataUIPart(part)) {
    return (
      <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        {part.type.replace("data-", "")} updated
      </div>
    );
  }

  return null;
});

const ToolPartView = memo(function ToolPartView({
  part,
}: {
  part: ExtractToolPart<MessagePart>;
}) {
  const name = getToolName(part);
  const title = part.title ?? name;

  if (part.state === "output-error") {
    return (
      <ToolFrame
        title={title}
        tone="error"
        body={part.errorText || "Tool failed"}
      />
    );
  }

  if (part.state === "output-denied") {
    return <ToolFrame title={title} tone="muted" body="Tool request denied" />;
  }

  if (part.state === "approval-requested") {
    return <ToolFrame title={title} tone="pending" body="Approval required" />;
  }

  if (part.state === "output-available") {
    return (
      <ToolFrame
        title={title}
        tone="success"
        body={summarizeToolOutput(part.output)}
      />
    );
  }

  return (
    <ToolFrame
      title={title}
      tone="pending"
      body={formatToolState(part.state)}
    />
  );
});

function ToolFrame({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "pending" | "success" | "error" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background/60 px-3 py-2 text-xs",
        tone === "error" && "border-destructive/40 text-destructive",
        tone === "success" && "border-border/70 text-foreground",
        tone === "pending" && "border-border/70 text-muted-foreground",
        tone === "muted" && "border-border/70 text-muted-foreground",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <Wrench className="h-3.5 w-3.5" />
        <span className="truncate">{title}</span>
      </div>
      <div className="mt-1 text-muted-foreground">{body}</div>
    </div>
  );
}

function formatToolState(state: string) {
  switch (state) {
    case "input-streaming":
      return "Preparing tool call…";
    case "input-available":
      return "Running tool…";
    case "approval-responded":
      return "Approval recorded";
    default:
      return "Tool running…";
  }
}

/** Turn a transport error into copy that tells the user what to do next. */
function describeChatError(error: Error) {
  const message = error.message || "";
  if (message.includes("AI is not configured")) {
    return "AI isn't configured on the server. Set AI_GATEWAY_API_KEY and restart.";
  }
  if (message.includes("Unauthorized")) {
    return "Your session expired. Refresh the page and sign in again.";
  }
  if (/rate.?limit|429/i.test(message)) {
    return "You're sending messages too quickly. Wait a moment, then retry.";
  }
  if (message && message.length < 160 && !/^\s*[<{]/.test(message)) {
    return `The message could not be sent: ${message}`;
  }
  return "The message could not be sent. Check your connection and retry.";
}

function summarizeToolOutput(output: unknown) {
  if (!isRecord(output)) return "Tool completed";

  if (typeof output.error === "string") return output.error;

  if (Array.isArray(output.items)) {
    return `${output.items.length} ${output.items.length === 1 ? "result" : "results"}`;
  }

  if (isRecord(output.issue)) {
    const id =
      typeof output.issue.identifier === "string"
        ? output.issue.identifier
        : undefined;
    const title =
      typeof output.issue.title === "string" ? output.issue.title : undefined;
    return [id, title].filter(Boolean).join(" - ") || "Issue updated";
  }

  if (typeof output.message === "string") return output.message;
  if (typeof output.status === "string") return output.status;
  if (output.success === true) return "Tool completed";

  return "Tool completed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type ExtractToolPart<T> = T extends
  | { type: `tool-${string}` }
  | { type: "dynamic-tool" }
  ? T
  : never;

const ChatComposer = memo(function ChatComposer({
  status,
  error,
  onSend,
  onStop,
  onRetry,
}: {
  status: ChatStatus;
  error: Error | undefined;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const trimmedInput = input.trim();
  const loading = status === "submitted" || status === "streaming";
  const disabled = status !== "ready";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmedInput || disabled) return;

    onSend(trimmedInput);
    setInput("");
  }

  return (
    <form onSubmit={onSubmit} className="border-t p-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 text-sm text-destructive"
          >
            <p>{describeChatError(error)}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
            placeholder="Send a message…"
            disabled={disabled}
            autoFocus
          />
          {loading ? (
            <Button type="button" variant="outline" onClick={onStop}>
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={disabled || !trimmedInput}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
});
