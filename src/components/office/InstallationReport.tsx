import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Installation } from "@/lib/types";
import { STEPS } from "@/lib/types";

const BRAND = "#1a3a6b";
const PAD = 40;

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", padding: PAD, fontFamily: "Helvetica", fontSize: 10, color: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: BRAND },
  brand: { fontSize: 18, fontWeight: "bold", color: BRAND },
  brandSub: { fontSize: 8, color: "#666", marginTop: 2 },
  reportTitle: { fontSize: 11, color: "#555", textAlign: "right" },
  reportDate: { fontSize: 9, color: "#888", textAlign: "right", marginTop: 3 },
  metaGrid: { flexDirection: "row", gap: 10, marginBottom: 22 },
  metaBox: { flex: 1, backgroundColor: "#f5f7fb", borderRadius: 6, padding: 9 },
  metaLabel: { fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  metaValue: { fontSize: 10, fontWeight: "bold", color: "#111" },
  statusBadge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  sectionTitle: { fontSize: 8, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  // Photo card — full width, 2 per page
  photoCard: { marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" },
  photoImg: { width: "100%", height: 220 },
  photoBody: { padding: 12, flexDirection: "row", gap: 16 },
  photoLeft: { flex: 1 },
  photoStepLabel: { fontSize: 7, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  photoTitle: { fontSize: 11, fontWeight: "bold", color: "#111", marginBottom: 6 },
  reasoning: { fontSize: 9, color: "#555", lineHeight: 1.5 },
  resultCol: { alignItems: "flex-end", gap: 4 },
  badge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, fontWeight: "bold" },
  confidence: { fontSize: 8, color: "#666" },
  // Review box
  reviewBox: { marginTop: 8, backgroundColor: "#f5f7fb", borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: BRAND },
  reviewLabel: { fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  reviewText: { fontSize: 9, color: "#333", lineHeight: 1.5 },
  reviewMeta: { fontSize: 8, color: "#888", marginTop: 4 },
  // Footer
  footer: { position: "absolute", bottom: 24, left: PAD, right: PAD, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 7 },
  footerText: { fontSize: 7, color: "#bbb" },
});

function statusLabel(status: string) {
  const map: Record<string, string> = {
    auto_approved: "Auto-Freigabe", approved: "Freigegeben",
    rejected: "Abgelehnt", edge_case: "Edge Case",
    warning: "Warnung", pending: "Ausstehend",
  };
  return map[status] ?? status;
}

function statusColor(status: string) {
  if (status === "approved" || status === "auto_approved") return { bg: "#dcfce7", text: "#166534" };
  if (status === "rejected") return { bg: "#fee2e2", text: "#991b1b" };
  if (status === "warning") return { bg: "#fef9c3", text: "#854d0e" };
  return { bg: "#fee2e2", text: "#991b1b" };
}

function PhotoCard({ photo, step }: { photo: { imageUrl: string; status: string; confidence: number; reasoning: string }; step: typeof STEPS[number] }) {
  const passed = photo.status === "passed";
  return (
    <View style={s.photoCard}>
      {photo.imageUrl ? (
        <Image src={photo.imageUrl} style={s.photoImg} />
      ) : (
        <View style={[s.photoImg, { backgroundColor: "#f3f4f6" }]} />
      )}
      <View style={s.photoBody}>
        <View style={s.photoLeft}>
          <Text style={s.photoStepLabel}>Schritt {step.index}</Text>
          <Text style={s.photoTitle}>{step.title}</Text>
          <Text style={s.reasoning}>{photo.reasoning || "—"}</Text>
        </View>
        <View style={s.resultCol}>
          <View style={[s.badge, { backgroundColor: passed ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={{ color: passed ? "#166534" : "#991b1b", fontSize: 8, fontWeight: "bold" }}>
              {passed ? "OK" : "FEHLER"}
            </Text>
          </View>
          <Text style={s.confidence}>{Math.round(photo.confidence * 100)}%</Text>
        </View>
      </View>
    </View>
  );
}

function Footer({ jobId }: { jobId: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>OVAG Netz – Smart Meter Prüfsystem</Text>
      <Text style={s.footerText}>{jobId}</Text>
    </View>
  );
}

interface Props { installation: Installation }

export function InstallationReport({ installation }: Props) {
  const generated = new Date().toLocaleString("de-DE");
  const createdDate = new Date(installation.createdAt).toLocaleString("de-DE");
  const sc = statusColor(installation.status);

  // Map step keys to their photos
  const photosByStep = Object.fromEntries(
    installation.photos.map((p) => [p.step, p])
  );

  // Split 4 steps into two pairs → one pair per page
  const pairs = [STEPS.slice(0, 2), STEPS.slice(2, 4)];

  return (
    <Document>
      {/* ── Page 1: header + meta + photos 1 & 2 ── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>OVAG Netz</Text>
            <Text style={s.brandSub}>Smart Meter Prüfsystem</Text>
          </View>
          <View>
            <Text style={s.reportTitle}>Installationsbericht</Text>
            <Text style={s.reportDate}>Erstellt: {generated}</Text>
          </View>
        </View>

        <View style={s.metaGrid}>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Job-ID</Text>
            <Text style={s.metaValue}>{installation.id}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Zählernummer</Text>
            <Text style={s.metaValue}>{installation.meterNumber}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Elektriker</Text>
            <Text style={s.metaValue}>{installation.electrician}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Datum</Text>
            <Text style={s.metaValue}>{createdDate}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Status</Text>
            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badge, { color: sc.text, backgroundColor: "transparent" }]}>
                {statusLabel(installation.status)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Fotoprüfung</Text>

        {pairs[0].map((step) => {
          const photo = photosByStep[step.key];
          return photo ? <PhotoCard key={step.key} photo={photo} step={step} /> : null;
        })}

        <Footer jobId={installation.id} />
      </Page>

      {/* ── Page 2: photos 3 & 4 + review ── */}
      <Page size="A4" style={s.page}>
        {pairs[1].map((step) => {
          const photo = photosByStep[step.key];
          return photo ? <PhotoCard key={step.key} photo={photo} step={step} /> : null;
        })}

        {(installation.reviewedBy || installation.reviewComment) && (
          <View style={s.reviewBox}>
            <Text style={s.reviewLabel}>Prüfentscheid</Text>
            {installation.reviewComment && (
              <Text style={s.reviewText}>{installation.reviewComment}</Text>
            )}
            <Text style={s.reviewMeta}>
              {installation.reviewedBy}
              {installation.reviewedAt
                ? ` · ${new Date(installation.reviewedAt).toLocaleString("de-DE")}`
                : ""}
            </Text>
          </View>
        )}

        <Footer jobId={installation.id} />
      </Page>
    </Document>
  );
}
