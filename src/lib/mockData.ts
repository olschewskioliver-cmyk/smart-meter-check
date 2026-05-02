import { Installation, STEPS, StepKey } from "./types";

const PH = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

function makePhotos(
  seed: string,
  overrides: Partial<Record<StepKey, { status: "passed" | "failed"; reasoning: string; confidence?: number }>> = {}
) {
  return STEPS.map((s) => {
    const o = overrides[s.key];
    return {
      step: s.key,
      imageUrl: PH(`${seed}-${s.key}`),
      status: o?.status ?? "passed",
      confidence: o?.confidence ?? 0.94,
      reasoning:
        o?.reasoning ??
        "Bild scharf, alle relevanten Merkmale klar erkennbar.",
    };
  });
}

export const MOCK_INSTALLATIONS: Installation[] = [
  {
    id: "INST-2419",
    electrician: "Markus Weber",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    meterNumber: "1ESY1161234567",
    status: "edge_case",
    photos: makePhotos("2419", {
      gateway: {
        status: "failed",
        reasoning: "LED-Status nicht eindeutig erkennbar – Bild überbelichtet.",
        confidence: 0.42,
      },
    }),
  },
  {
    id: "INST-2418",
    electrician: "Sandra Klein",
    createdAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    meterNumber: "1ESY1169988123",
    status: "edge_case",
    photos: makePhotos("2418", {
      nameplate: {
        status: "failed",
        reasoning: "Zählernummer teilweise verdeckt – manuelle Prüfung nötig.",
        confidence: 0.55,
      },
    }),
  },
  {
    id: "INST-2417",
    electrician: "Tobias Frank",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    meterNumber: "1ESY1162224498",
    status: "warning",
    photos: makePhotos("2417", {
      cabinet: {
        status: "failed",
        reasoning: "Schrank teilweise geschlossen – Einbaukontext unklar.",
        confidence: 0.61,
      },
    }),
  },
  {
    id: "INST-2416",
    electrician: "Jana Hoffmann",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    meterNumber: "1ESY1167770012",
    status: "auto_approved",
    photos: makePhotos("2416"),
  },
  {
    id: "INST-2415",
    electrician: "Markus Weber",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    meterNumber: "1ESY1160001284",
    status: "auto_approved",
    photos: makePhotos("2415"),
  },
  {
    id: "INST-2414",
    electrician: "Lisa Schmidt",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    meterNumber: "1ESY1163450921",
    status: "auto_approved",
    photos: makePhotos("2414"),
  },
  {
    id: "INST-2413",
    electrician: "Sandra Klein",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    meterNumber: "1ESY1166543210",
    status: "approved",
    photos: makePhotos("2413"),
  },
  {
    id: "INST-2412",
    electrician: "Tobias Frank",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    meterNumber: "1ESY1168889911",
    status: "rejected",
    photos: makePhotos("2412", {
      meter_wiring: {
        status: "failed",
        reasoning: "Verkabelung nicht vollständig im Bild.",
        confidence: 0.38,
      },
    }),
  },
];

export const MOCK_ELECTRICIANS = [
  "Markus Weber",
  "Sandra Klein",
  "Tobias Frank",
  "Jana Hoffmann",
  "Lisa Schmidt",
];
