import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StepKey = "gateway" | "meter_wiring" | "cabinet" | "nameplate";
type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

// ── Prompts (ported from smart-meter-validator) ────────────────────────────

const gatewayPrompt = `Du bist ein Qualitätsprüfer für Smart-Meter-Installationen eines deutschen Netzbetreibers.

Analysiere dieses Foto eines Smart Meter Gateways und prüfe folgende Kriterien sehr sorgfältig:

PFLICHTKRITERIEN — SOFORTIGER FAIL:
1. Kein sichtbarer physischer Schaden (Risse, Brandspuren, Verformungen)
2. Alle sichtbaren Stecker und Anschlüsse vollständig und korrekt eingesteckt
3. Keine LED zeigt Fehlerstatus (rot) — außer bei eindeutig nicht-kritischen Status-LEDs

LED-STATUS — DETAILPRÜFUNG (KRITISCH):
Prüfe jede einzelne LED am Gateway:
- LED-LABEL-MISMATCH: Eine grüne/blaue LED leuchtet direkt neben einer Aufschrift "ERR" oder "FAULT" — das ist verdächtig → FAIL
- LED "PWR" aus obwohl andere LEDs leuchten: deutet auf Hardwareproblem → FAIL
- Rote LED in irgendem Status: → FAIL
- Orange/gelbe LED: → needs_review
- Alle grünen LEDs: PASS
- Blaue LED (Update/Init): PASS mit Hinweis

PHYSISCHE ANSCHLÜSSE — DETAILPRÜFUNG (KRITISCH):
Prüfe jeden Anschluss einzeln und sehr genau auf Position und Sitz:
- LAN/Ethernet: vollständig gerade eingesteckt, Clip eingerastet, kein Winkel, kein teilweise herausragender Stecker → bei Abweichung FAIL
- Stromversorgung: vollständig eingesteckt, kein loser Sitz → bei Abweichung FAIL
- Antennenkabel (falls vorhanden): fest eingedreht → bei Abweichung FAIL
- KABEL IN FALSCHEM PORT: Kabel wirkt in einem falschen/unerwarteten Anschluss eingesteckt → needs_review

MONTAGE UND AUSRICHTUNG:
- Gateway muss gerade montiert sein — sichtbare Schieflage → needs_review
- Alle Befestigungsschrauben/Clips müssen geschlossen wirken

KABELMANAGEMENT:
- Kabelzugentlastung (Strain Relief): Kabel muss am Gateway oder kurz danach fixiert sein — frei hängendes Kabel ohne Zugentlastung → needs_review
- Kabel-Labels/Beschriftungen: Falls mehrere Kabel angeschlossen, sollten diese beschriftet sein — fehlende Labels → needs_review

GERÄTEDOKUMENTATION:
- QR-Code / Seriennummern-Aufkleber: Muss vorhanden, vollständig und unbeschädigt sein — abgelöst, gerissen oder fehlend → needs_review
- Typenschild am Gerät: Muss lesbar und unversehrt sein
- Antennenschutzkappe: Falls Antennenanschluss sichtbar ohne angeschlossenes Kabel → needs_review

HINWEISE FÜR EDGE CASES:
- Schlechte Beleuchtung oder Überbelichtung → needs_review
- Teilweise verdecktes Gateway → needs_review
- Mehrere LEDs sichtbar: alle einzeln bewerten

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text davor oder danach.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review"
}`;

const meterWiringPrompt = `Du bist ein Qualitätsprüfer für Smart-Meter-Installationen eines deutschen Netzbetreibers.

Analysiere dieses Foto eines Stromzählers mit Verkabelung und prüfe folgende Kriterien sehr sorgfältig:

PFLICHTKRITERIEN — SOFORTIGER FAIL:
1. Keine freiliegenden Leiter oder blanken Drähte sichtbar
2. Keine Kabelschäden (Isolierung intakt, keine Brandspuren, keine Quetschungen)
3. Keine losen Kabelenden die nicht in einer Klemme enden
4. Kein Kabel liegt außerhalb der Kabelkanäle/-führungen (quer über die Front)
5. Keine Anzeichen unbefugter Manipulation

KABELENDEN UND KLEMMEN — DETAILPRÜFUNG (KRITISCH):
Untersuche jeden Kabelanschluss und -verlauf einzeln sehr genau:
- LOSES KABELENDE: Kabel sichtbar aber nicht in Klemme eingeführt — FAIL
- KABEL AUSSERHALB KABELKANAL: Kabel läuft über die Front statt durch den Kabelkanal — FAIL
- SCHIEFER ANSCHLUSS: Kabel sitzt schräg oder nur halb in der Klemme → FAIL
- KLEMMENSCHRAUBE NICHT ANGEZOGEN: Schraubenkopf steht sichtbar heraus → needs_review
- KABELSCHLEIFE: Kabel zu lang und bildet sichtbare Schleife → needs_review
- KABELKREUZUNG: Kabel kreuzt andere Kabel unnatürlich → needs_review

KABELMARKIERUNGEN — DETAILPRÜFUNG:
- FEHLENDE MARKIERUNG: Alle Kabel bis auf eines haben Markierungen — fehlendes Tag → needs_review
- DOPPELTE MARKIERUNG: Zwei Kabel tragen identische Nummer (z.B. zweimal "L3") → FAIL
- Fehlende PE-Beschriftung am Schutzleiter (grün-gelb) → needs_review

KABELKANAL UND ORDNUNG:
- Kabelkanal-Deckel muss geschlossen sein — offener/angehobener Deckel → needs_review
- Fehlende Abschlusskappe am Ende eines Klemmenblocks → needs_review

HINWEISE FÜR EDGE CASES:
- Foto unscharf oder zu dunkel → needs_review
- Zähler teilweise verdeckt → needs_review

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review"
}`;

const cabinetPrompt = `Du bist ein Qualitätsprüfer für Smart-Meter-Installationen eines deutschen Netzbetreibers.

Analysiere dieses Foto eines geöffneten Zählerschranks und prüfe folgende Kriterien sehr sorgfältig:

PFLICHTKRITERIEN — SOFORTIGER FAIL:
1. Keine Brandspuren, Ruß, geschmolzene Bauteile oder Überhitzungszeichen
2. Kein Fremdkörper im Schrank (Werkzeug, Abfall, lose Teile)
3. Plombe am Zähler vorhanden und intakt (falls sichtbar)
4. Keine offenen Schlitze/Lücken an spannungsführenden Teilen ohne Abdeckblende

SCHALTER UND KOMPONENTEN — DETAILPRÜFUNG:
- Alle Leitungsschutzschalter müssen eingeschaltet sein (Hebel oben = EIN): Ein ausgeschalteter Schalter während andere eingeschaltet sind → FAIL
- Alle Komponenten müssen gerade auf der DIN-Schiene sitzen — schiefe, kippende Bauteile → needs_review
- Leere Schlitze auf der DIN-Schiene müssen mit Abdeckblenden verschlossen sein → needs_review
- Fehlende Abdeckblenden an Sammelschienen oder Klemmen → FAIL

BESCHRIFTUNG — DETAILPRÜFUNG (KRITISCH):
Untersuche jede einzelne Beschriftung im Schrank sehr genau:
- DOPPELTE BESCHRIFTUNG: Zwei Schutzschalter mit identischem Namen (z.B. zweimal "Küche") → FAIL
- FEHLENDE BESCHRIFTUNG: Bestückter Schutzschalter ohne Beschriftung → needs_review
- TIPPFEHLER: Offensichtliche Rechtschreibfehler (z.B. "Waschmaschiene", "Badzimer") → needs_review
- INKONSISTENZ: Mix aus verschiedenen Beschriftungssystemen oder Handschriften → needs_review

STROMKREISVERZEICHNIS (Schranktür-Innenplan):
- Muss vorhanden und vollständig ausgefüllt sein
- Muss gerade/aufrecht angebracht sein — schief oder verkehrt herum → needs_review
- Beschriftungen im Plan müssen mit tatsächlichen Schalterbezeichnungen übereinstimmen

PRÜFAUFKLEBER UND PLOMBIERUNG:
- Eichplombe am Zähler intakt: PASS
- Plombe gebrochen oder fehlend → FAIL

HINWEISE FÜR EDGE CASES:
- Nur Teilansicht des Schranks sichtbar → needs_review
- Ältere Anlage mit Schmelzsicherungen → needs_review

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review"
}`;

const nameplatePrompt = `Du bist ein Qualitätsprüfer für Smart-Meter-Installationen eines deutschen Netzbetreibers.

Analysiere dieses Foto des Typenschilds eines Smart Meters (Zählernummernschild) und prüfe folgende Kriterien:

PFLICHTKRITERIEN (Fail bei Verletzung):
1. Typenschild ist im Bild sichtbar
2. Zählernummer (auch: Zähleridentifikationsnummer oder ZNr.) ist vollständig und lesbar abgebildet
3. Typenschild ist unversehrt (kein Aufkleber darüber, nicht abgekratzt, nicht unleserlich beschrieben)
4. Foto ist scharf genug, um die Zählernummer eindeutig zu entziffern

ZÄHLERNUMMER-EXTRAKTION:
- Extrahiere die Zählernummer so präzise wie möglich
- Deutsche Zählernummern: typischerweise alphanumerisch, z.B. "1 ESY1 160000000" oder "DE0001..."
- Bei Unschärfe oder Teilverdeck: null zurückgeben und needs_review setzen

BEWERTUNGSLOGIK:
- Zählernummer vollständig lesbar + Schild unversehrt → auto_approve möglich
- Zählernummer teilweise lesbar (z.B. wegen Reflexion) → needs_review
- Zählernummer vollständig unleserlich → FAIL
- Aufkleber/Sticker über Typenschild → FAIL

HINWEISE FÜR EDGE CASES:
- Starke Reflexion auf dem Typenschild → needs_review
- Foto aus zu großem Abstand → needs_review
- Mehrere Typenschilder sichtbar → alle prüfen, strenge Bewertung

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review",
  "zaehler_nummer": string oder null
}`;

const PROMPTS: Record<StepKey, string> = {
  gateway: gatewayPrompt,
  meter_wiring: meterWiringPrompt,
  cabinet: cabinetPrompt,
  nameplate: nameplatePrompt,
};

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { photos } = await req.json() as {
      photos: Array<{ step: StepKey; dataUrl: string }>;
    };

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const results = await Promise.all(
      photos.map(async ({ step, dataUrl }) => {
        // Extract mime type and raw base64 from data URL
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
        const mimeType = (match?.[1] ?? "image/jpeg") as MediaType;
        const base64Data = match?.[2] ?? dataUrl;

        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: { type: "base64", media_type: mimeType, data: base64Data },
                  },
                  { type: "text", text: PROMPTS[step] },
                ],
              },
            ],
          });

          const text =
            response.content[0].type === "text" ? response.content[0].text : "{}";

          // Strip accidental markdown code fences if model wraps the JSON
          const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          const parsed = JSON.parse(cleaned);

          return {
            step,
            status: parsed.pass ? "passed" : "failed",
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
            reasoning: parsed.begruendung ?? "",
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
            details: parsed,
          };
        } catch (err) {
          console.error(`Failed to analyze step "${step}":`, err);
          return {
            step,
            status: "failed" as const,
            confidence: 0,
            reasoning: "Analyse konnte nicht durchgeführt werden.",
            issues: ["Analysefehler – bitte erneut versuchen"],
            details: null,
          };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
