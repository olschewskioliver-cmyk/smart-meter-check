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
4. Gateway-Gehäuse vollständig geschlossen — kein offener Deckel, kein gebrochener Clip
5. Keine sichtbare Kondensation, Feuchtigkeitsspuren oder Wasserflecken am/um das Gateway

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
- Typenschild am Gerät: Muss lesbar und unversehrt sein — Tippfehler auf Gerät-Aufkleber (z.B. "Gatewey") → needs_review
- Antennenschutzkappe: Falls Antennenanschluss sichtbar ohne angeschlossenes Kabel → needs_review
- Installationsdatum-Aufkleber: Sollte vorhanden und lesbar sein — fehlend oder unleserlich → needs_review

GEHÄUSE UND UMGEBUNGSZUSTAND:
- Kabel zu kurz und erzeugt sichtbare Zugspannung auf den Anschluss — Kabel unter mechanischer Spannung → needs_review
- Unzureichender Freiraum um das Gateway: andere Objekte direkt anliegend, keine Belüftungsmöglichkeit → needs_review
- Mehrere Gateways sichtbar und scheinbar aktiv — nur eines sollte betrieben werden → needs_review
- Ungenutzte Ports (USB, Ethernet, etc.) nicht abgedeckt oder versiegelt → needs_review

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
  "recommendation": "auto_approve" oder "needs_review",
  "gateway_closed": boolean,
  "cable_tension_detected": boolean,
  "ventilation_clearance_ok": boolean,
  "moisture_detected": boolean,
  "multiple_gateways_detected": boolean,
  "unused_ports_unsealed": boolean,
  "installation_date_label_present": boolean oder null
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
- Kabelbinder fehlt oder gebrochen wo Kabel gebündelt sein sollten → needs_review

NORMKONFORMITÄT (VDE 0100):
- Farbkodierung korrekt (L braun/schwarz, N blau, PE grün-gelb)
- Mindestbiegeradius eingehalten (keine starken Knickstellen)
- Zugentlastung an Kabeldurchführungen vorhanden

KLEMMENANSCHLÜSSE — ERWEITERTE DETAILPRÜFUNG (KRITISCH):
- FEHLENDE ADERENDHÜLSEN: Litzenleiter ohne Aderendhülse direkt in Klemme eingeführt — erhöhte Brandgefahr → FAIL
- DOPPELT BELEGTE KLEMME: Zwei Kabel in einer Klemme, die erkennbar nicht für Mehrfachbelegung ausgelegt ist → FAIL
- N UND PE VERTAUSCHT: Neutralleiter (blau) und Schutzleiter (grün-gelb) in falschen Klemmen → FAIL
- ZÄHLERUMGEHUNG (BYPASS): Kabel überbrückt den Zähler — illegale Umgehung → FAIL
- FALSCHE PHASENZUORDNUNG: L1/L2/L3 erkennbar in falschen Klemmen angeschlossen → FAIL
- KABELQUERSCHNITT ZU DÜNN: Kabel wirkt für die Klemmengröße/-nennung erkennbar zu dünn → needs_review
- KABELDURCHFÜHRUNG NICHT ABGEDICHTET: Kabeleintritt ohne Tülle, Dichtung oder Knickschutz → needs_review
- ZUGSPANNUNG AUF KLEMME: Kabel zu kurz und liegt unter mechanischer Zugspannung in der Klemme → needs_review
- VERBINDUNGSDOSE IM SCHRANK: Abzweigdose oder Lüsterklemme sichtbar — gehört nicht in den Zählerschrank → needs_review

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
  "recommendation": "auto_approve" oder "needs_review",
  "ferrules_present": boolean,
  "double_occupied_terminal": boolean,
  "n_pe_vertauscht": boolean,
  "zaehlerumgehung_detected": boolean,
  "phasenzuordnung_korrekt": boolean,
  "kabelquerschnitt_ausreichend": boolean,
  "kabeldurchfuehrung_abgedichtet": boolean,
  "zugspannung_auf_klemme": boolean,
  "verbindungsdose_vorhanden": boolean
}`;

const cabinetPrompt = `Du bist ein Qualitätsprüfer für Smart-Meter-Installationen eines deutschen Netzbetreibers.

Analysiere dieses Foto eines geöffneten Zählerschranks und prüfe folgende Kriterien sehr sorgfältig:

PFLICHTKRITERIEN — SOFORTIGER FAIL:
1. Keine Brandspuren, Ruß, geschmolzene Bauteile oder Überhitzungszeichen
2. Kein Fremdkörper im Schrank (Werkzeug, Abfall, lose Teile)
3. Plombe am Zähler vorhanden und intakt (falls sichtbar)
4. Keine offenen Schlitze/Lücken an spannungsführenden Teilen ohne Abdeckblende
5. Keine Feuchtigkeitsschäden: Rostflecken, Wasserflecken, Kondensation oder Schimmel im Schrank
6. Nullschiene und PE-Sammelschiene müssen vorhanden sein

SCHALTER UND KOMPONENTEN — DETAILPRÜFUNG:
- Alle Leitungsschutzschalter müssen eingeschaltet sein (Hebel oben = EIN): Ein ausgeschalteter Schalter während andere eingeschaltet sind → FAIL
- Alle Komponenten müssen gerade auf der DIN-Schiene sitzen — schiefe, kippende Bauteile → needs_review
- Leere Schlitze auf der DIN-Schiene müssen mit Abdeckblenden verschlossen sein → needs_review
- Fehlende Abdeckblenden an Sammelschienen oder Klemmen → FAIL
- Verschiedene Fabrikate/Hersteller von Leitungsschutzschaltern → needs_review

BESCHRIFTUNG — DETAILPRÜFUNG (KRITISCH):
Untersuche jede einzelne Beschriftung im Schrank sehr genau:
- DOPPELTE BESCHRIFTUNG: Zwei Schutzschalter mit identischem Namen (z.B. zweimal "Küche") → FAIL
- FEHLENDE BESCHRIFTUNG: Bestückter Schutzschalter ohne Beschriftung → needs_review
- TIPPFEHLER: Offensichtliche Rechtschreibfehler (z.B. "Waschmaschiene", "Badzimer") → needs_review
- INKONSISTENZ: Mix aus verschiedenen Beschriftungssystemen oder Handschriften → needs_review
- ÜBERKLEBT/DURCHGESTRICHEN: Alte Beschriftung noch sichtbar unter neuer → needs_review

STROMKREISVERZEICHNIS (Schranktür-Innenplan):
- Muss vorhanden und vollständig ausgefüllt sein
- Muss gerade/aufrecht angebracht sein — schief oder verkehrt herum → needs_review
- Beschriftungen im Plan müssen mit tatsächlichen Schalterbezeichnungen übereinstimmen
- Fehlende Zeilen oder leere Felder bei bestückten Schutzorganen → needs_review

PRÜFAUFKLEBER UND PLOMBIERUNG:
- Eichplombe am Zähler intakt: PASS
- Plombe gebrochen oder fehlend → FAIL
- Prüf-/Inspektionsaufkleber fehlt, abgelöst oder veraltet → needs_review

INSTALLATIONSPRÜFUNG:
- Schutzleiter (grün-gelb) korrekt geführt
- Kabelkanäle/Kabelführungen geschlossen
- Offene Kabelenden ohne Anschluss: needs_review

ERWEITERTE SICHERHEITS- UND ZUSTANDSPRÜFUNG:
- FI-SCHUTZSCHALTER FEHLT: Kein Fehlerstromschutzschalter (RCD) sichtbar, obwohl dieser bei Wohninstallationen vorgeschrieben ist → needs_review
- KABELEINFÜHRUNGEN NICHT ABGEDICHTET: Kabeleintritt oben/unten ohne Dichtung oder Bürstenleiste — IP-Schutz beeinträchtigt → needs_review
- ÜBERSPANNUNGSSCHUTZ FEHLT: Kein Überspannungsableiter (SPD) sichtbar → needs_review
- KABELKANAL ÜBERFÜLLT: Kabelkanal erkennbar überlastet (Kabel drängen nach außen) → needs_review
- SCHALTERAMPERE UNPLAUSIBEL: Nennstrom eines Schutzschalters wirkt offensichtlich zu hoch für den angeschlossenen Kabelquerschnitt → needs_review
- SCHMELZSICHERUNGEN (ALTE TECHNOLOGIE): Veraltete Schmelzsicherungen statt moderner Leitungsschutzschalter → needs_review
- SCHRANKTÜR-VERSCHLUSS DEFEKT: Scharnier oder Türverschluss erkennbar beschädigt → needs_review
- ZÄHLER NICHT IM RAHMEN GESICHERT: Zähler sitzt erkennbar locker in der Zählerhalterung → needs_review
- WARNSCHILDER FEHLEN: Keine Warnkennzeichnung (z.B. Blitzpfeil, Spannungswarnung) auf oder an der Schranktür → needs_review
- ROST AM SCHRANKGEHÄUSE: Rost oder Korrosion am Metallgehäuse des Schranks sichtbar → needs_review
- FALSCHER SCHRANK VERDACHT: Beschriftung, Adresse oder Name im/am Schrank passt erkennbar nicht zur erwarteten Installation → needs_review

HINWEISE FÜR EDGE CASES:
- Nur Teilansicht des Schranks sichtbar → needs_review
- Ältere Anlage mit Schmelzsicherungen → needs_review
- Sehr komplexes System → needs_review

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review",
  "fi_schutzschalter_vorhanden": boolean oder null,
  "feuchtigkeitsschaden_detected": boolean,
  "kabeleinführungen_abgedichtet": boolean,
  "ueberspannungsschutz_vorhanden": boolean oder null,
  "kabelkanal_ueberfuellt": boolean,
  "nullschiene_pe_schiene_vorhanden": boolean,
  "schalterampere_plausibel": boolean,
  "schmelzsicherungen_vorhanden": boolean,
  "schranktuer_schloss_intakt": boolean,
  "zaehler_im_rahmen_gesichert": boolean,
  "warnschilder_vorhanden": boolean oder null,
  "rost_am_gehaeuse": boolean,
  "falscher_schrank_verdacht": boolean
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
- Lies alle Varianten: "ZNr.", "Zählernummer", "Meter-ID", "Gerätenummer", "Fabriknummer"

TECHNISCHE MINDESTANGABEN (sollten lesbar sein):
- Hersteller (z.B. Landis+Gyr, Iskraemeco, EMH, Sagemcom, Itron)
- Typ-/Modellbezeichnung
- Baujahr oder Fertigungsdatum
- Nennspannung und Nennstrom (z.B. 230V, 5(100)A)
- Eichgültigkeitsdatum (PTB-Zulassung, Eichfrist) — überschritten oder fehlend → needs_review
- Frequenzangabe (50 Hz) — fehlend oder unleserlich → needs_review
- Genauigkeitsklasse (z.B. Klasse 1 oder 2) — fehlend oder unleserlich → needs_review
- PTB-Baumusterprüfnummer — fehlend oder unleserlich → needs_review
- MID/CE-Kennzeichnung (Messgeräterichtlinie) — fehlend → needs_review
- Nennstrom offensichtlich nicht zur Installationsgröße passend → needs_review

ZUSÄTZLICHE SICHERHEITSPRÜFUNGEN:
- Zähler physisch verkehrt herum eingebaut (erkennbar an Typenschildausrichtung oder Anzeigerichtung) → FAIL
- Manipulationssiegel am Zählergehäuse gebrochen oder fehlend (falls sichtbar) → FAIL
- Zähleranzeigedisplay zeigt Fehlercode (falls Display im Foto sichtbar) → FAIL

BEWERTUNGSLOGIK:
- Zählernummer vollständig lesbar + Schild unversehrt → auto_approve möglich
- Zählernummer teilweise lesbar (z.B. wegen Reflexion) → needs_review
- Zählernummer vollständig unleserlich → FAIL
- Aufkleber/Sticker über Typenschild → FAIL

HINWEISE FÜR EDGE CASES:
- Starke Reflexion auf dem Typenschild → needs_review
- Foto aus zu großem Abstand → needs_review
- Mehrere Typenschilder sichtbar → alle prüfen, strenge Bewertung
- Schutzfolie noch auf dem Schild → needs_review

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Codeblöcke, kein erläuternder Text.

JSON-Schema:
{
  "pass": boolean,
  "confidence": number (0.0 bis 1.0),
  "issues": string[],
  "begruendung": string,
  "recommendation": "auto_approve" oder "needs_review",
  "zaehler_nummer": string oder null,
  "hersteller": string oder null,
  "zaehler_typ": string oder null,
  "baujahr": string oder null,
  "eichgueltigkeit": string oder null,
  "mid_kennzeichnung_vorhanden": boolean oder null,
  "genauigkeitsklasse_lesbar": boolean oder null,
  "ptb_nummer_lesbar": boolean oder null,
  "zähler_verkehrt_eingebaut": boolean,
  "manipulationssiegel_intakt": boolean oder null,
  "display_fehlercode_sichtbar": boolean oder null,
  "frequenzangabe_lesbar": boolean oder null,
  "nennstrom_plausibel": boolean oder null
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
