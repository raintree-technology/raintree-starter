import { RecoverableErrorBoundary } from "@/components/error-boundary";
import { SettingsNav } from "@/components/settings/settings-nav";
import { isMultiTenant } from "@/lib/tenancy";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="content-width py-8">
      <h1 className="text-headline mb-6">Settings</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsNav multiTenant={isMultiTenant} />
        <div className="min-w-0 flex-1 space-y-8">
          <RecoverableErrorBoundary
            title="This settings section could not load."
            description="Try again while keeping the settings navigation in place."
            homeHref="/settings"
            homeLabel="Open profile settings"
            align="start"
            className="min-h-[18rem]"
          >
            {children}
          </RecoverableErrorBoundary>
        </div>
      </div>
    </div>
  );
}
