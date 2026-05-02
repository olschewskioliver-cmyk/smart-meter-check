import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar, OfficeView } from "@/components/office/Sidebar";
import { TopBar } from "@/components/office/TopBar";
import { EdgeCaseQueue } from "@/components/office/EdgeCaseQueue";
import { AutoApprovedList } from "@/components/office/AutoApprovedList";
import { AllJobsTable } from "@/components/office/AllJobsTable";
import { DetailPanel } from "@/components/office/DetailPanel";
import { useInstallations } from "@/lib/installationsStore";

export default function Office() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const installations = useInstallations();
  const [view, setView] = useState<OfficeView>("edge");
  const [refreshKey, setRefreshKey] = useState(0);

  const selected = id ? installations.find((i) => i.id === id) : undefined;

  useEffect(() => {
    if (id && !selected) navigate("/office", { replace: true });
  }, [id, selected, navigate]);

  function handleSelect(installationId: string) {
    navigate(`/office/${installationId}`);
  }

  const counts = useMemo(() => {
    const edge = installations.filter(
      (i) => i.status === "edge_case" || i.status === "warning"
    ).length;
    const auto = installations.filter(
      (i) => i.status === "auto_approved" || i.status === "approved"
    ).length;
    return { edge, auto, all: installations.length };
  }, [installations]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayItems = installations.filter(
      (i) => new Date(i.createdAt).getTime() >= today.getTime()
    );
    return {
      todayChecked: todayItems.length,
      autoApproved: todayItems.filter((i) => i.status === "auto_approved").length,
      edgeCases: todayItems.filter(
        (i) => i.status === "edge_case" || i.status === "warning"
      ).length,
    };
  }, [installations]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-office text-office-fg">
      <Sidebar
        active={view}
        onChange={(v) => { setView(v); }}
        counts={counts}
        stats={stats}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar name="Max Müller" role="Prüfer" />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[380px] shrink-0 border-r border-office bg-office-panel" key={refreshKey}>
            {view === "edge" && (
              <EdgeCaseQueue
                installations={installations}
                selectedId={selected?.id}
                onSelect={handleSelect}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            )}
            {view === "auto" && (
              <AutoApprovedList
                installations={installations}
                selectedId={selected?.id}
                onSelect={handleSelect}
              />
            )}
            {view === "all" && (
              <AllJobsTable
                installations={installations}
                selectedId={selected?.id}
                onSelect={handleSelect}
              />
            )}
          </div>

          <DetailPanel installation={selected} />
        </div>
      </div>
    </div>
  );
}
