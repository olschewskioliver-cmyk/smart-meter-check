import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { Installation } from "@/lib/types";
import { STEPS } from "@/lib/types";

Font.register({
  family: "Helvetica",
  fonts: [],
});

const BRAND = "#1a3a6b";

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#222" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: BRAND },
  brand: { fontSize: 18, fontWeight: "bold", color: BRAND },
  brandSub: { fontSize: 8, color: "#666", marginTop: 2 },
  reportTitle: { fontSize: 11, color: "#555", textAlign: "right" },
  reportDate: { fontSize: 9, color: "#888", textAlign: "right", marginTop: 3 },
  metaGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  metaBox: { flex: 1, backgroundColor: "#f5f7fb", borderRadius: 6, padding: 10 },
  metaLabel: { fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  metaValue: { fontSize: 11, fontWeight: "bold", color: "#111" },
  statusBadge: { display: "flex", alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#555", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoCard: { width: "48%", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, overflow: "hidden", marginBottom: 4 },
  photoImg: { width: "100%", height: 120, objectFit: "cover" },
  photoBody: { padding: 8 },
  photoStep: { fontSize: 7, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  photoTitle: { fontSize: 9, fontWeight: "bold", color: "#111", marginBottom: 4 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  badge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1.5, fontSize: 7, fontWeight: "bold" },
  confidence: { fontSize: 8, color: "#666" },
  reasoning: { fontSize: 8, color: "#555", lineHeight: 1.4 },
  reviewBox: { marginTop: 16, backgroundColor: "#f5f7fb", borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: BRAND },
  reviewLabel: { fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  reviewText: { fontSize: 9, color: "#333" },
  reviewMeta: { fontSize: 8, color: "#888", marginTop: 3 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8 },
  footerText: { fontSize: 8, color: "#aaa" },
});

function statusLabel(status: string) {
  const map: Record<string, string> = {
    auto_approved: "Auto-Freigabe",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
    edge_case: "Edge Case",
    warning: "Warnung",
    pending: "Ausstehend",
  };
  return map[status] ?? status;
}

function statusColor(status: string) {
  if (status === "approved" || status === "auto_approved") return { bg: "#dcfce7", text: "#166534" };
  if (status === "rejected") return { bg: "#fee2e2", text: "#991b1b" };
  if (status === "warning") return { bg: "#fef9c3", text: "#854d0e" };
  return { bg: "#fee2e2", text: "#991b1b" };
}

interface Props {
  installation: Installation;
}

export function InstallationReport({ installation }: Props) {
  const generated = new Date().toLocaleString("de-DE");
  const createdDate = new Date(installation.createdAt).toLocaleString("de-DE");
  const sc = statusColor(installation.status);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
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

        {/* Meta grid */}
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

        {/* Photos */}
        <Text style={s.sectionTitle}>Fotoprüfung</Text>
        <View style={s.photoGrid}>
          {STEPS.map((step) => {
            const photo = installation.photos.find((p) => p.step === step.key);
            if (!photo) return null;
            const passed = photo.status === "passed";
            return (
              <View key={step.key} style={s.photoCard}>
                {photo.imageUrl ? (
                  <Image src={photo.imageUrl} style={s.photoImg} />
                ) : (
                  <View style={[s.photoImg, { backgroundColor: "#f3f4f6" }]} />
                )}
                <View style={s.photoBody}>
                  <Text style={s.photoStep}>Schritt {step.index}</Text>
                  <Text style={s.photoTitle}>{step.title}</Text>
                  <View style={s.resultRow}>
                    <View style={[s.badge, { backgroundColor: passed ? "#dcfce7" : "#fee2e2" }]}>
                      <Text style={{ color: passed ? "#166534" : "#991b1b", fontSize: 7, fontWeight: "bold" }}>
                        {passed ? "OK" : "FEHLER"}
                      </Text>
                    </View>
                    <Text style={s.confidence}>Konfidenz {Math.round(photo.confidence * 100)}%</Text>
                  </View>
                  <Text style={s.reasoning}>{photo.reasoning}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Review info */}
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

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>OVAG Netz – Smart Meter Prüfsystem</Text>
          <Text style={s.footerText}>{installation.id}</Text>
        </View>
      </Page>
    </Document>
  );
}
