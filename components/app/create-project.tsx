"use client";

import { Plus } from "lucide-react";
import {
  type FormEvent,
  type ReactElement,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction } from "@/lib/actions/projects";
import { isMultiTenant } from "@/lib/tenancy";
import { getErrorMessage } from "@/lib/utils";

export function CreateProject({ trigger }: { trigger?: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createProjectAction({}, formData);
        if (res.success) {
          toast.success("Project created");
          formRef.current?.reset();
          setOpen(false);
        } else if (res.error) {
          toast.error(res.error);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not create project"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            {isMultiTenant
              ? "The project is created in your current organization."
              : "The project is created in your personal account."}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My project"
              maxLength={80}
              required
              autoFocus
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
