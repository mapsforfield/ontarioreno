import { Check, ImageIcon, Loader2, Mail, Pencil, Send, Tag, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { ClientVideo } from '../data/types';

const PRESET_LABELS = ['Before', 'During', 'After'] as const;
const MAX_BYTES = 250 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function labelBadge(label: string): string {
  switch (label) {
    case 'Before': return 'bg-amber-100 text-amber-800';
    case 'During': return 'bg-sky-100 text-sky-800';
    case 'After': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-violet-100 text-violet-800';
  }
}

const isImage = (m: ClientVideo) => m.contentType.startsWith('image/');

export default function ClientVideos({ clientId }: { clientId: string }) {
  const { listClientVideos, uploadClientVideo, deleteClientVideo, updateClientMedia, sendClientMedia, contractors } = usePortalData();
  const { currentUser } = usePortalAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [media, setMedia] = useState<ClientVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('Before');
  const [customLabel, setCustomLabel] = useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Send-by-email modal state
  const [sendTarget, setSendTarget] = useState<ClientVideo | null>(null);
  const [sendTo, setSendTo] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sendBusy, setSendBusy] = useState(false);

  // Inline tag editing
  const [editId, setEditId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<string>('Before');
  const [editCustom, setEditCustom] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const startEditTag = (m: ClientVideo) => {
    setEditId(m.id);
    const preset = (PRESET_LABELS as readonly string[]).includes(m.label);
    setEditMode(preset ? m.label : 'Custom');
    setEditCustom(preset ? '' : m.label);
  };
  const saveTag = async (m: ClientVideo) => {
    const newLabel = editMode === 'Custom' ? editCustom.trim() : editMode;
    if (!newLabel) return;
    setEditBusy(true);
    await updateClientMedia(m.id, newLabel);
    setEditBusy(false);
    setMedia((cur) => cur.map((v) => (v.id === m.id ? { ...v, label: newLabel } : v)));
    setEditId(null);
    showToast({ variant: 'success', message: 'Tag updated', description: newLabel });
  };

  const contractorsWithEmail = useMemo(
    () => contractors.filter((c) => (c.email ?? '').trim()),
    [contractors],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setMedia(await listClientVideos(clientId));
    setLoading(false);
  }, [clientId, listClientVideos]);

  useEffect(() => { refresh(); }, [refresh]);

  const isCustom = label === 'Custom';
  const effectiveLabel = isCustom ? customLabel.trim() : label;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isMedia = file.type.startsWith('video/') || file.type.startsWith('image/');
    if (!isMedia) {
      showToast({ variant: 'error', message: 'Please choose a photo or video file.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast({ variant: 'error', message: 'File is too large (max 250 MB).', description: 'Try a shorter clip or lower resolution.' });
      return;
    }
    if (isCustom && !effectiveLabel) {
      showToast({ variant: 'error', message: 'Enter a custom tag first.' });
      return;
    }
    setUploadPct(0);
    try {
      const saved = await uploadClientVideo(clientId, file, effectiveLabel || 'Before', (pct) => setUploadPct(pct));
      if (saved) {
        setMedia((cur) => [saved, ...cur]);
        showToast({ variant: 'success', message: 'Uploaded', description: `${effectiveLabel || 'Before'} · ${formatSize(file.size)}` });
        if (isCustom) setCustomLabel('');
      } else {
        showToast({ variant: 'error', message: 'Upload failed. Please try again.' });
      }
    } catch (err) {
      showToast({ variant: 'error', message: 'Upload failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setUploadPct(null);
    }
  };

  const handleDelete = async (m: ClientVideo) => {
    if (!window.confirm('Delete this file? This cannot be undone.')) return;
    setMedia((cur) => cur.filter((v) => v.id !== m.id));
    await deleteClientVideo(m.id);
  };

  const openSend = (m: ClientVideo) => {
    setSendTarget(m);
    setSendTo('');
    setSendNote('');
  };

  const submitSend = async () => {
    if (!sendTarget || !sendTo.trim()) return;
    setSendBusy(true);
    const result = await sendClientMedia(sendTarget.id, sendTo.trim(), sendNote.trim());
    setSendBusy(false);
    if (result.ok) {
      showToast({ variant: 'success', message: 'Sent', description: `${isImage(sendTarget) ? 'Photo' : 'Video'} link emailed to ${sendTo.trim()}` });
      setSendTarget(null);
    } else {
      showToast({ variant: 'error', message: 'Could not send', description: result.error });
    }
  };

  const uploading = uploadPct !== null;

  return (
    <section>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        Project Media{media.length > 0 ? ` (${media.length})` : ''}
      </p>

      {/* Uploader bar */}
      <div className="mb-3 rounded-[0.6rem] border border-slate-200 bg-slate-50/70 p-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2">
            <Tag className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="shrink-0 text-xs font-bold text-slate-500">Tag</span>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={uploading}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-slate-800 outline-none disabled:opacity-50"
            >
              {PRESET_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
              <option value="Custom">Custom…</option>
            </select>
          </label>
          {isCustom && (
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Before — Shower"
              disabled={uploading}
              className="min-w-0 flex-1 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#1B3C6C] disabled:opacity-50"
            />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#153158] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload media'}
          </button>
          <input ref={fileRef} type="file" accept="video/*,image/*" className="sr-only" onChange={handleFile} />
        </div>

        {uploading && (
          <div className="mt-2.5 px-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#1B3C6C] transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">{uploadPct}% uploaded — keep this panel open until it finishes.</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 py-8">
          <ImageIcon className="h-7 w-7 text-slate-200" />
          <p className="mt-2 text-sm font-bold text-slate-400">No media yet</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Add a before/after photo or walkthrough video.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {media.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white">
              {isImage(m) ? (
                <a href={m.url} target="_blank" rel="noreferrer" className="block">
                  <img src={m.url} alt={m.label} className="aspect-video w-full bg-slate-900 object-cover" />
                </a>
              ) : (
                <video src={m.url} controls preload="metadata" className="aspect-video w-full bg-slate-900" />
              )}
              {editId === m.id ? (
                <div className="flex flex-col gap-2 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <select
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value)}
                      className="rounded-[0.4rem] border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B3C6C]"
                    >
                      {PRESET_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      <option value="Custom">Custom…</option>
                    </select>
                    {editMode === 'Custom' && (
                      <input
                        value={editCustom}
                        onChange={(e) => setEditCustom(e.target.value)}
                        placeholder="Custom tag"
                        autoFocus
                        className="min-w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1B3C6C]"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveTag(m)}
                      disabled={editBusy || (editMode === 'Custom' && !editCustom.trim())}
                      className="inline-flex items-center gap-1.5 rounded-[0.4rem] bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
                    >
                      {editBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="rounded-[0.4rem] border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-black ${labelBadge(m.label)}`}>
                      {m.label}
                    </span>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500" title={m.fileName}>
                      {formatSize(m.sizeBytes)} · {new Date(m.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {(isAdmin || m.uploadedByUserId === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => startEditTag(m)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#e8f1fb] hover:text-[#1B3C6C]"
                        aria-label="Edit tag"
                        title="Edit tag"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openSend(m)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#e8f1fb] hover:text-[#1B3C6C]"
                      aria-label="Send by email"
                      title="Send by email"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    {(isAdmin || m.uploadedByUserId === currentUser?.id) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send-by-email modal */}
      {sendTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => !sendBusy && setSendTarget(null)}>
          <div className="w-full max-w-md rounded-[0.6rem] bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">Send {isImage(sendTarget) ? 'Photo' : 'Video'}</p>
                <h3 className="mt-1 text-lg font-black tracking-[-0.01em] text-slate-900">{sendTarget.label}</h3>
              </div>
              <button type="button" onClick={() => setSendTarget(null)} disabled={sendBusy} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="grid gap-1.5 text-xs font-bold text-slate-600">
              Recipient email
              <input
                type="email"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="name@example.com"
                className="rounded-[0.5rem] border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
              />
            </label>

            {contractorsWithEmail.length > 0 && (
              <label className="mt-3 grid gap-1.5 text-xs font-bold text-slate-600">
                Or pick a contractor
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setSendTo(e.target.value); }}
                  className="rounded-[0.5rem] border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#1B3C6C]"
                >
                  <option value="">Select a contractor…</option>
                  {contractorsWithEmail.map((c) => (
                    <option key={c.id} value={c.email}>{c.companyName} — {c.email}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-3 grid gap-1.5 text-xs font-bold text-slate-600">
              Note (optional)
              <textarea
                rows={3}
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
                placeholder="Add a short message…"
                className="rounded-[0.5rem] border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
              />
            </label>

            <p className="mt-2 text-[0.7rem] font-semibold text-slate-400">
              They’ll get a secure link that streams/downloads the {isImage(sendTarget) ? 'photo' : 'video'} for 7 days.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSendTarget(null)} disabled={sendBusy} className="rounded-[0.5rem] border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSend}
                disabled={sendBusy || !sendTo.trim()}
                className="inline-flex items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
              >
                {sendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sendBusy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
