"use client";

import { Trash2 } from "lucide-react";
import { type MouseEvent, memo, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteProjectAction } from "@/lib/actions/projects";
import { formatDate, getErrorMessage } from "@/lib/utils";

export const ProjectCard = memo(function ProjectCard({
  project,
}: {
  project: { id: string; name: string; createdAt: Date };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const createdAt = useMemo(
    () => formatDate(project.createdAt),
    [project.createdAt],
  );

  function onDelete() {
    if (pending) return;

    startTransition(async () => {
      try {
        const res = await deleteProjectAction(project.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Project deleted");
          setOpen(false);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not delete project"));
      }
    });
  }

  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{project.name}</p>
        <p className="text-footnote">Created {createdAt}</p>
      </div>
      <AlertDialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
      >
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${project.name}`}
            disabled={pending}
          >
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Delete {project.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
