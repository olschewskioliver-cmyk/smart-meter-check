export type StepKey = "gateway" | "meter_wiring" | "cabinet" | "nameplate";

export interface StepDefinition {
  key: StepKey;
  index: number; // 1..4
  title: string;
  description: string;
}

export const STEPS: StepDefinition[] = [
  {
    key: "gateway",
    index: 1,
    title: "Gateway (leuchtend)",
    description:
      "Foto des Smart Meter Gateways mit sichtbarer LED – rot, orange oder grün muss klar erkennbar sein.",
  },
  {
    key: "meter_wiring",
    index: 2,
    title: "Zähler & Verkabelung",
    description:
      "Gesamtaufnahme des Zählers mit der vollständigen Verkabelung zum Gateway.",
  },
  {
    key: "cabinet",
    index: 3,
    title: "Zählerschrank (offen)",
    description:
      "Foto vom geöffneten Zählerschrank von außen – vollständiger Einbaukontext sichtbar.",
  },
  {
    key: "nameplate",
    index: 4,
    title: "Zählernummer (Typenschild)",
    description:
      "Nahaufnahme des Typenschilds – Zählernummer muss scharf und vollständig lesbar sein.",
  },
];

export type PhotoStatus = "passed" | "failed";

export interface PhotoCheck {
  step: StepKey;
  imageUrl: string;
  status: PhotoStatus;
  confidence: number; // 0..1
  reasoning: string;
}

export type InstallationStatus =
  | "edge_case"     // needs human review (red)
  | "warning"       // borderline (yellow)
  | "auto_approved" // green
  | "approved"      // human-approved
  | "rejected";     // human-rejected

export interface Installation {
  id: string;            // Job ID, e.g. INST-2419
  electrician: string;
  createdAt: string;     // ISO
  meterNumber: string;
  status: InstallationStatus;
  photos: PhotoCheck[];
  overallNote?: string;
}
