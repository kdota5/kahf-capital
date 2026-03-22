"use client";

import { useState, useCallback } from "react";
import type { FirmStyleProfile } from "@/lib/style-engine";

interface ProfileViewerProps {
  profile: FirmStyleProfile;
  onUpdate: (profile: FirmStyleProfile) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

function SectionCard({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface/50 transition-colors"
      >
        <span className="font-heading font-bold text-sm uppercase tracking-wider text-text">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  multiline = false,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs text-text-muted font-medium">{label}</label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-accent/40 bg-bg text-sm text-text focus:outline-none resize-none"
            rows={3}
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-accent/40 bg-bg text-sm text-text focus:outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-text-muted font-medium">{label}</label>
      <div
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="group flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 hover:bg-surface/50 transition-colors -mx-3"
      >
        <p className="text-sm text-text-secondary flex-1 leading-relaxed">
          {value || <span className="italic text-text-muted">Not set</span>}
        </p>
        <svg
          className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </div>
    </div>
  );
}

function TagList({
  label,
  items,
  onUpdate,
  color = "accent",
}: {
  label: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  color?: "accent" | "error";
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const addItem = () => {
    if (!draft.trim()) return;
    onUpdate([...items, draft.trim()]);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-text-muted font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
              color === "error"
                ? "bg-error/10 text-error border border-error/20"
                : "bg-accent-dim text-accent border border-accent/20"
            }`}
          >
            {item}
            <button
              onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              className="hover:opacity-60 transition-opacity ml-0.5"
            >
              &times;
            </button>
          </span>
        ))}
        {adding ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={addItem}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            autoFocus
            placeholder="Type and Enter"
            className="px-2.5 py-1 rounded-lg border border-accent/40 bg-bg text-xs text-text focus:outline-none w-32"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="px-2.5 py-1 rounded-lg border border-dashed border-border text-xs text-text-muted hover:border-accent/40 hover:text-accent transition-colors"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}

function TermMap({
  label,
  terms,
  onUpdate,
}: {
  label: string;
  terms: Record<string, string>;
  onUpdate: (terms: Record<string, string>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [draftVal, setDraftVal] = useState("");

  const addTerm = () => {
    if (!draftKey.trim() || !draftVal.trim()) return;
    onUpdate({ ...terms, [draftKey.trim()]: draftVal.trim() });
    setDraftKey("");
    setDraftVal("");
    setAdding(false);
  };

  const entries = Object.entries(terms);

  return (
    <div className="space-y-2">
      <label className="text-xs text-text-muted font-medium">{label}</label>
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="text-accent bg-accent-dim px-2 py-0.5 rounded">&quot;{v}&quot;</span>
            <span className="text-text-muted">not</span>
            <span className="text-text-secondary">&quot;{k}&quot;</span>
            <button
              onClick={() => {
                const next = { ...terms };
                delete next[k];
                onUpdate(next);
              }}
              className="text-text-muted hover:text-error transition-colors ml-auto"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="flex items-center gap-2">
          <input
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="Common word"
            className="flex-1 px-2.5 py-1 rounded-lg border border-border bg-bg text-xs text-text focus:outline-none focus:border-accent/40"
            autoFocus
          />
          <span className="text-text-muted text-xs">→</span>
          <input
            value={draftVal}
            onChange={(e) => setDraftVal(e.target.value)}
            placeholder="Preferred term"
            className="flex-1 px-2.5 py-1 rounded-lg border border-border bg-bg text-xs text-text focus:outline-none focus:border-accent/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") addTerm();
              if (e.key === "Escape") {
                setAdding(false);
                setDraftKey("");
                setDraftVal("");
              }
            }}
          />
          <button onClick={addTerm} className="text-accent text-xs font-medium">
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-text-muted hover:text-accent transition-colors underline underline-offset-2"
        >
          + Add term mapping
        </button>
      )}
    </div>
  );
}

export default function StyleProfileViewer({
  profile,
  onUpdate,
  onRegenerate,
  regenerating,
}: ProfileViewerProps) {
  const update = useCallback(
    (patch: Partial<FirmStyleProfile>) => {
      onUpdate({ ...profile, ...patch, updatedAt: new Date().toISOString() });
    },
    [profile, onUpdate]
  );

  const updateNested = useCallback(
    <K extends keyof FirmStyleProfile>(
      key: K,
      subPatch: Partial<FirmStyleProfile[K]>
    ) => {
      const current = profile[key];
      if (typeof current === "object" && current !== null) {
        update({ [key]: { ...current, ...subPatch } } as unknown as Partial<FirmStyleProfile>);
      }
    },
    [profile, update]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-base text-text">
            {profile.firmName}
          </h3>
          <p className="text-xs text-text-muted">
            Based on {profile.samplesUsed} sample{profile.samplesUsed !== 1 ? "s" : ""} · Click any field to edit
          </p>
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          {regenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate Style Guide"
          )}
        </button>
      </div>

      <SectionCard title="Structure" defaultOpen>
        <EditableField
          label="Section Order"
          value={profile.structure.sectionOrder.join(" → ")}
          onSave={(v) =>
            updateNested("structure", {
              sectionOrder: v.split("→").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
        <EditableField
          label="Executive Summary Style"
          value={profile.structure.executiveSummaryStyle}
          onSave={(v) => updateNested("structure", { executiveSummaryStyle: v })}
          multiline
        />
        <EditableField
          label="Section Transitions"
          value={profile.structure.sectionTransitions}
          onSave={(v) => updateNested("structure", { sectionTransitions: v })}
        />
        <EditableField
          label="Conclusion Style"
          value={profile.structure.conclusionStyle}
          onSave={(v) => updateNested("structure", { conclusionStyle: v })}
        />
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              checked={profile.structure.usesNumberedSections}
              onChange={(e) =>
                updateNested("structure", { usesNumberedSections: e.target.checked })
              }
              className="rounded border-border"
            />
            Uses numbered sections
          </label>
          <label className="flex items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              checked={profile.structure.usesAppendices}
              onChange={(e) =>
                updateNested("structure", { usesAppendices: e.target.checked })
              }
              className="rounded border-border"
            />
            Uses appendices
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Tone">
        <div className="space-y-1">
          <label className="text-xs text-text-muted font-medium">Formality</label>
          <div className="flex gap-2">
            {(["formal", "professional_conversational", "conversational"] as const).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => updateNested("tone", { formality: level })}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    profile.tone.formality === level
                      ? "bg-accent-dim border-accent/40 text-accent font-medium"
                      : "border-border text-text-secondary hover:border-border-active"
                  }`}
                >
                  {level.replace("_", " ")}
                </button>
              )
            )}
          </div>
        </div>
        <EditableField
          label="Pronoun Usage"
          value={profile.tone.personPronouns}
          onSave={(v) => updateNested("tone", { personPronouns: v })}
        />
        <div className="space-y-1">
          <label className="text-xs text-text-muted font-medium">Technical Depth</label>
          <div className="flex gap-2">
            {(["simplified", "moderate", "technical"] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateNested("tone", { technicalDepth: level })}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  profile.tone.technicalDepth === level
                    ? "bg-accent-dim border-accent/40 text-accent font-medium"
                    : "border-border text-text-secondary hover:border-border-active"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <EditableField
          label="Confidence Style"
          value={profile.tone.confidenceStyle}
          onSave={(v) => updateNested("tone", { confidenceStyle: v })}
          multiline
        />
        <EditableField
          label="Client Relationship"
          value={profile.tone.clientRelationship}
          onSave={(v) => updateNested("tone", { clientRelationship: v })}
          multiline
        />
      </SectionCard>

      <SectionCard title="Formatting">
        <EditableField
          label="Data Presentation"
          value={profile.formatting.dataPresentation}
          onSave={(v) => updateNested("formatting", { dataPresentation: v })}
          multiline
        />
        <EditableField
          label="Number Format"
          value={profile.formatting.numberFormat}
          onSave={(v) => updateNested("formatting", { numberFormat: v })}
        />
        <EditableField
          label="Chart Style"
          value={profile.formatting.chartStyle}
          onSave={(v) => updateNested("formatting", { chartStyle: v })}
        />
        <EditableField
          label="Bullet Style"
          value={profile.formatting.bulletStyle}
          onSave={(v) => updateNested("formatting", { bulletStyle: v })}
        />
        <EditableField
          label="Table Style"
          value={profile.formatting.tableStyle}
          onSave={(v) => updateNested("formatting", { tableStyle: v })}
        />
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              checked={profile.formatting.usesCharts}
              onChange={(e) =>
                updateNested("formatting", { usesCharts: e.target.checked })
              }
              className="rounded border-border"
            />
            Uses charts
          </label>
          <label className="flex items-center gap-2 text-text-secondary">
            <input
              type="checkbox"
              checked={profile.formatting.usesBulletPoints}
              onChange={(e) =>
                updateNested("formatting", { usesBulletPoints: e.target.checked })
              }
              className="rounded border-border"
            />
            Uses bullet points
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Vocabulary">
        <TermMap
          label="Preferred Terms"
          terms={profile.vocabulary.preferredTerms}
          onUpdate={(terms) => updateNested("vocabulary", { preferredTerms: terms })}
        />
        <TagList
          label="Avoided Terms"
          items={profile.vocabulary.avoidedTerms}
          onUpdate={(items) => updateNested("vocabulary", { avoidedTerms: items })}
          color="error"
        />
        <TagList
          label="Signature Phrases"
          items={profile.vocabulary.signaturePhrases}
          onUpdate={(items) =>
            updateNested("vocabulary", { signaturePhrases: items })
          }
        />
        <EditableField
          label="Jargon Level"
          value={profile.vocabulary.jargonLevel}
          onSave={(v) => updateNested("vocabulary", { jargonLevel: v })}
        />
      </SectionCard>

      <SectionCard title="Compliance">
        <div className="space-y-2">
          <label className="text-xs text-text-muted font-medium">
            Required Disclaimers
          </label>
          {profile.compliance.requiredDisclaimers.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={d}
                onChange={(e) => {
                  const next = [...profile.compliance.requiredDisclaimers];
                  next[i] = e.target.value;
                  updateNested("compliance", { requiredDisclaimers: next });
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-xs text-text-secondary focus:outline-none focus:border-accent/40 resize-none"
                rows={2}
              />
              <button
                onClick={() => {
                  const next = profile.compliance.requiredDisclaimers.filter(
                    (_, j) => j !== i
                  );
                  updateNested("compliance", { requiredDisclaimers: next });
                }}
                className="text-text-muted hover:text-error transition-colors mt-1"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              updateNested("compliance", {
                requiredDisclaimers: [
                  ...profile.compliance.requiredDisclaimers,
                  "",
                ],
              })
            }
            className="text-xs text-text-muted hover:text-accent transition-colors underline underline-offset-2"
          >
            + Add disclaimer
          </button>
        </div>
        <EditableField
          label="Performance Disclosure"
          value={profile.compliance.performanceDisclosure}
          onSave={(v) =>
            updateNested("compliance", { performanceDisclosure: v })
          }
          multiline
        />
        <EditableField
          label="Compliance Notes"
          value={profile.compliance.complianceNotes}
          onSave={(v) => updateNested("compliance", { complianceNotes: v })}
          multiline
        />
      </SectionCard>
    </div>
  );
}
