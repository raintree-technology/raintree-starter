import { FolderPlus, Plus } from "lucide-react";
import { Suspense } from "react";
import { CreateProject } from "@/components/app/create-project";
import { ProjectGridSkeleton } from "@/components/app/loading-skeletons";
import { PageHeader } from "@/components/app/page-header";
import { ProjectCard } from "@/components/app/project-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAppContext } from "@/lib/app-context";
import { listProjects } from "@/lib/data/projects";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Dashboard",
  description: "View and manage projects in your organization.",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const ctx = await getAppContext();
  if (!ctx) return null;

  const scope = ctx.activeOrganization?.name ?? "your account";

  return (
    <div className="content-width py-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${ctx.user.name.split(" ")[0]} — projects in ${scope}.`}
        actions={<CreateProject />}
      />

      <Suspense fallback={<ProjectGridSkeleton />}>
        <Projects
          userId={ctx.user.id}
          organizationId={ctx.activeOrganizationId}
        />
      </Suspense>
    </div>
  );
}

async function Projects({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string | null;
}) {
  const projects = await listProjects({ userId, organizationId });

  if (projects.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Projects are where your work lives. Create the first one to get started."
          action={
            <CreateProject
              trigger={
                <Button variant="outline">
                  <Plus /> Create your first project
                </Button>
              }
            />
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
          }}
        />
      ))}
    </div>
  );
}
