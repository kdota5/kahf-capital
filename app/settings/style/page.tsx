"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { FirmStyleProfile } from "@/lib/style-engine";
import {
  saveStyleProfile,
  loadStyleProfile,
  clearStyleProfile,
  exportStyleProfile,
  importStyleProfile,
} from "@/lib/style-engine";
import StyleUploader from "@/components/settings/style-uploader";
import StyleProfileViewer from "@/components/settings/style-profile-viewer";
import StyleComparison from "@/components/settings/style-comparison";

export default function StyleSettingsPage() {
  const [profile, setProfile] = useState<FirmStyleProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadStyleProfile();
    if (stored) setProfile(stored);
  }, []);

  const handleAnalyze = useCallback(
    async (documentTexts: string[], firmName: string) => {
      setAnalyzing(true);
      setError(null);
      try {
        const res = await fetch("/api/analyze-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentTexts, firmName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        setProfile(data.profile);
        saveStyleProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  const handleRegenerate = useCallback(async () => {
    if (!profile) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-style/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed");
      const updated = {
        ...profile,
        promptFragment: data.promptFragment,
        updatedAt: new Date().toISOString(),
      };
      setProfile(updated);
      saveStyleProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }, [profile]);

  const handleProfileUpdate = useCallback((updated: FirmStyleProfile) => {
    setProfile(updated);
    saveStyleProfile(updated);
  }, []);

  const handleSaveAndActivate = useCallback(() => {
    if (!profile) return;
    saveStyleProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  const handleReset = useCallback(() => {
    clearStyleProfile();
    setProfile(null);
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    const json = exportStyleProfile();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firm-style-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importStyleProfile(text);
        if (imported) {
          setProfile(imported);
        } else {
          setError("Invalid style profile file");
        }
      } catch {
        setError("Failed to read file");
      }
      e.target.value = "";
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-text"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-heading font-bold text-xs text-white">
              C
            </div>
            <span className="font-heading font-bold text-sm tracking-tight">
              Conda
            </span>
            <span className="text-text-muted text-xs ml-1 hidden sm:inline">
              Settings
            </span>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg hover:border-border-active transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg hover:border-border-active transition-colors"
            >
              Export
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            Firm Style Configuration
          </h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Teach Conda how your firm writes. Upload sample documents and
            every AI response will match your voice.
          </p>
        </div>

        {error && (
          <div className="text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold ${profile ? "bg-success/20 text-success" : "bg-accent text-white"}`}>
              {profile ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <h2 className="font-heading font-bold text-lg">
              Upload Sample Documents
            </h2>
          </div>
          <div className="ml-11">
            <p className="text-sm text-text-secondary mb-4">
              Upload 1-3 anonymized proposals, reports, or client
              communications that represent your firm&apos;s best work.
            </p>
            <StyleUploader
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
            />
          </div>
        </section>

        {/* Step 2: Profile */}
        {profile && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-heading font-bold">
                2
              </div>
              <h2 className="font-heading font-bold text-lg">
                Review Style Profile
              </h2>
            </div>
            <div className="ml-11">
              <StyleProfileViewer
                profile={profile}
                onUpdate={handleProfileUpdate}
                onRegenerate={handleRegenerate}
                regenerating={regenerating}
              />
            </div>
          </section>
        )}

        {/* Step 3: Comparison */}
        {profile?.promptFragment && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-heading font-bold">
                3
              </div>
              <h2 className="font-heading font-bold text-lg">
                Preview Styled Output
              </h2>
            </div>
            <div className="ml-11">
              <StyleComparison promptFragment={profile.promptFragment} />
            </div>
          </section>
        )}

        {/* Actions */}
        {profile && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={handleSaveAndActivate}
              className="px-6 py-3 bg-accent text-white font-heading font-bold text-sm rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved & Active
                </>
              ) : (
                "Save & Activate Style"
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-text-muted hover:text-error border border-border rounded-xl hover:border-error/30 transition-colors"
            >
              Reset to Default
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
