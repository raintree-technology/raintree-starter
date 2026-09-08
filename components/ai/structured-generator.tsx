"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { DeepPartial } from "ai";
import { Sparkles } from "lucide-react";
import {
  type FormEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Generation, generationSchema } from "@/lib/ai-schema";

type GeneratedObject = DeepPartial<Generation>;
type GeneratedTask = NonNullable<NonNullable<GeneratedObject["tasks"]>[number]>;

export function StructuredGenerator() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/ai/object",
    schema: generationSchema,
  });
  const submitRef = useRef(submit);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const handleSubmit = useCallback((prompt: string) => {
    submitRef.current(prompt);
  }, []);

  return (
    <div className="content-width py-8">
      <PageHeader
        title="Generate"
        description={
          <>
            Stream a typed object from the model and render it as UI — AI SDK{" "}
            <code>Output.object</code> + <code>useObject</code>.
          </>
        }
      />

      <PromptForm isLoading={isLoading} onSubmit={handleSubmit} />

      <p role="status" className="sr-only">
        {isLoading ? "Generating…" : object ? "Generation complete" : ""}
      </p>
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive"
        >
          Generation failed:{" "}
          {error.message || "the model did not return a result"}. Adjust the
          prompt and try again.
        </div>
      )}
      {object && <GeneratedResult object={object} />}
    </div>
  );
}

const PromptForm = memo(function PromptForm({
  isLoading,
  onSubmit,
}: {
  isLoading: boolean;
  onSubmit: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const trimmedPrompt = prompt.trim();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmedPrompt || isLoading) return;

    onSubmit(trimmedPrompt);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        aria-label="Prompt"
        placeholder="e.g. a mobile app for tracking houseplants"
      />
      <Button type="submit" disabled={isLoading || !trimmedPrompt}>
        <Sparkles className="h-4 w-4" />
        {isLoading ? "Generating…" : "Generate"}
      </Button>
    </form>
  );
});

const GeneratedResult = memo(function GeneratedResult({
  object,
}: {
  object: GeneratedObject;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{object.title ?? "Generating…"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {object.summary && (
          <p className="text-sm text-muted-foreground">{object.summary}</p>
        )}
        <div className="space-y-2">
          {object.tasks?.map((task, index) =>
            task ? (
              <TaskRow
                key={getTaskKey(task, index)}
                task={task}
                index={index}
              />
            ) : null,
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const TaskRow = memo(function TaskRow({
  task,
  index,
}: {
  task: GeneratedTask;
  index: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <span>{task.name ?? `Task ${index + 1}`}</span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {task.estimateHours != null && <span>{task.estimateHours}h</span>}
        {task.priority && (
          <Badge variant="secondary" className="capitalize">
            {task.priority}
          </Badge>
        )}
      </span>
    </div>
  );
});

function getTaskKey(task: GeneratedTask, index: number) {
  return task.id ?? `${task.name ?? "task"}-${index}`;
}
