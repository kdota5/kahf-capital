"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StyleComparisonProps {
  promptFragment: string;
}

export default function StyleComparison({
  promptFragment,
}: StyleComparisonProps) {
  const [defaultText, setDefaultText] = useState<string | null>(null);
  const [styledText, setStyledText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setGenerated(false);
    setDefaultText(null);
    setStyledText(null);
  }, [promptFragment]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-style/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleFragment: promptFragment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Comparison failed");
      }
      const data = await res.json();
      setDefaultText(data.defaultText);
      setStyledText(data.styledText);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate comparison");
    } finally {
      setLoading(false);
    }
  };

  if (!generated && !loading) {
    return (
      <div className="border border-border rounded-xl p-6 text-center space-y-3">
        <p className="text-sm text-text-secondary">
          See how your firm&apos;s style transforms a sample portfolio analysis.
        </p>
        <button
          onClick={generate}
          className="px-5 py-2.5 bg-accent text-white font-heading font-bold text-sm rounded-xl hover:bg-accent/90 transition-colors"
        >
          Generate Comparison
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-muted">
          Generating side-by-side comparison...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-error/20 bg-error/5 rounded-xl p-4 text-sm text-error">
        {error}
        <button
          onClick={generate}
          className="ml-3 underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-surface px-4 py-2.5 border-b border-border">
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-text-muted">
              Default AI Output
            </h4>
          </div>
          <div className="p-4 text-sm text-text-secondary leading-relaxed prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {defaultText || ""}
            </ReactMarkdown>
          </div>
        </div>

        <div className="border border-accent/30 rounded-xl overflow-hidden bg-accent/[0.02]">
          <div className="bg-accent-dim px-4 py-2.5 border-b border-accent/20">
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-accent">
              Your Firm&apos;s Style
            </h4>
          </div>
          <div className="p-4 text-sm text-text-secondary leading-relaxed prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {styledText || ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted text-center">
        Both panels analyze the same sample scenario — the right panel applies
        your firm&apos;s tone, structure, and vocabulary.
      </p>
    </div>
  );
}
