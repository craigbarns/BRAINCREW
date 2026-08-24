import { DashboardShell } from "@/components/dashboard-shell";
import { AgentsWorkspace } from "@/components/agents-workspace";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const query = await searchParams;
  return (
    <DashboardShell active="/agents">
      <AgentsWorkspace defaultOpen={query.create === "1"} />
    </DashboardShell>
  );
}
