import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "@/components/office/Sidebar";
import type { OfficeView } from "@/components/office/Sidebar";
import { TopBar } from "@/components/office/TopBar";
import { EdgeCaseQueue } from "@/components/office/EdgeCaseQueue";
import { AutoApprovedList } from "@/components/office/AutoApprovedList";
import { AllJobsTable } from "@/components/office/AllJobsTable";
import { DetailPanel } from "@/components/office/DetailPanel";
import { useAuth } from "@/context/AuthContext";
import { useInstallationsList, useInstallationDetail } from "@/lib/useInstallationsQuery";

export default function Office() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [view, setView] = useState<OfficeView>("edge");
  const [panelWidth, setPanelWidth] = useState(380);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  function handleDragStart(e: React.MouseEvent) {
    dragState.current = { startX: e.clientX, startWidth: panelWidth };

    function onMouseMove(ev: MouseEvent) {
      if (!dragState.current) return;
      const delta = ev.clientX - dragState.current.startX;
      setPanelWidth(Math.min(Math.max(dragState.current.startWidth + delta, 260), 720));
    }

    function onMouseUp() {
      dragState.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const { data: installations = [], refetch } = useInstallationsList();
  const { data: selectedDetail, isLoading: detailLoading } = useInstallationDetail(id);

  // Redirect to /office if a job ID in the URL doesn't exist
  useEffect(() => {
    if (id && !detailLoading && !selectedDetail) {
      navigate("/office", { replace: true });
    }
  }, [id, selectedDetail, detailLoading, navigate]);

  // Auto-select the first item in the current view when nothing is selected
  useEffect(() => {
    if (id || installations.length === 0) return;
    const filtered =
      view === "edge"
        ? installations.filter((i) => i.status === "edge_case" || i.status === "warning")
        : view === "auto"
        ? installations.filter((i) => i.status === "auto_approved" || i.status === "approved")
        : installations;
    if (filtered.length > 0) {
      navigate(`/office/${filtered[0].id}`, { replace: true });
    }
  }, [id, installations, view, navigate]);

  function handleSelect(installationId: string) {
    navigate(`/office/${installationId}`);
  }

  const counts = useMemo(() => ({
    edge: installations.filter((i) => i.status === "edge_case" || i.status === "warning").length,
    auto: installations.filter((i) => i.status === "auto_approved" || i.status === "approved").length,
    all: installations.length,
  }), [installations]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayItems = installations.filter(
      (i) => new Date(i.createdAt).getTime() >= today.getTime()
    );
    return {
      todayChecked: todayItems.length,
      autoApproved: todayItems.filter((i) => i.status === "auto_approved").length,
      edgeCases: todayItems.filter((i) => i.status === "edge_case" || i.status === "warning").length,
    };
  }, [installations]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-office text-office-fg">
      <Sidebar active={view} onChange={setView} counts={counts} stats={stats} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar name={profile?.full_name ?? "Innendienst"} onSignOut={signOut} />

        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: panelWidth }} className="relative shrink-0 bg-office-panel">
            {view === "edge" && (
              <EdgeCaseQueue
                installations={installations}
                selectedId={id}
                onSelect={handleSelect}
                onRefresh={refetch}
              />
            )}
            {view === "auto" && (
              <AutoApprovedList
                installations={installations}
                selectedId={id}
                onSelect={handleSelect}
              />
            )}
            {view === "all" && (
              <AllJobsTable
                installations={installations}
                selectedId={id}
                onSelect={handleSelect}
              />
            )}
            {/* Drag handle — sits on the right edge, widens hit area for easy grab */}
            <div
              onMouseDown={handleDragStart}
              className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-office hover:bg-office-accent/40 transition-colors"
            />
          </div>

          <DetailPanel installation={selectedDetail} isLoading={detailLoading && !!id} />
        </div>
      </div>
    </div>
  );
}
