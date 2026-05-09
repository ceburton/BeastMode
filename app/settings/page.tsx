'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertOctagon, Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleExport() {
    setBusy('export');
    try {
      const res = await fetch('/api/data');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beastmode-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash('Progress exported.');
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    setBusy('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      flash('Progress imported.');
    } catch (e) {
      flash('Import failed: ' + (e instanceof Error ? e.message : 'unknown'));
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    if (!confirm('Wipe all progress (flashcard SRS, quiz attempts, exam history, study sessions)? Source content stays intact.')) return;
    setBusy('reset');
    try {
      await fetch('/api/data', { method: 'DELETE' });
      flash('Progress reset.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Local storage controls. All data lives at <code>data/beast.db</code>.
        </p>
      </div>

      {message && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-3 text-sm text-success">{message}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup & restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export your progress as JSON, or restore from a previous export.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport} disabled={busy !== null} variant="outline">
              <Download className="h-3.5 w-3.5" /> Export progress
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null}
              variant="outline"
            >
              <Upload className="h-3.5 w-3.5" /> Import progress
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-destructive" /> Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Wipe SRS schedules, quiz history, exam attempts, and study sessions. Source content (units, topics, terms) is unaffected.
          </p>
          <Button onClick={handleReset} disabled={busy !== null} variant="destructive">
            <Trash2 className="h-3.5 w-3.5" /> Reset all progress
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Re-ingest source</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Edit <code>the Beast Review.md</code> and re-run <code>npm run ingest</code> to rebuild the database.
            <strong className="text-destructive ml-1">Warning:</strong> a fresh ingest deletes the DB file and your progress with it.
            Export first if you want to keep your history.
          </p>
        </CardContent>
      </Card>

      <Link href="/">
        <Button variant="ghost">← Back to dashboard</Button>
      </Link>
    </div>
  );
}
