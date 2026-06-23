import { Film, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { ClientVideo } from '../data/types';

const LABELS = ['Before', 'During', 'After', 'Other'] as const;

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
    default: return 'bg-slate-100 text-slate-600';
  }
}

export default function ClientVideos({ clientId }: { clientId: string }) {
  const { listClientVideos, uploadClientVideo, deleteClientVideo } = usePortalData();
  const { currentUser } = usePortalAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [videos, setVideos] = useState<ClientVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<(typeof LABELS)[number]>('Before');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setVideos(await listClientVideos(clientId));
    setLoading(false);
  }, [clientId, listClientVideos]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast({ variant: 'error', message: 'Please choose a video file.' });
      return;
    }
    if (file.size > 250 * 1024 * 1024) {
      showToast({ variant: 'error', message: 'Video is too large (max 250 MB).', description: 'Try a shorter clip or lower resolution.' });
      return;
    }
    setUploadPct(0);
    try {
      const saved = await uploadClientVideo(clientId, file, label, (pct) => setUploadPct(pct));
      if (saved) {
        setVideos((cur) => [saved, ...cur]);
        showToast({ variant: 'success', message: 'Video uploaded', description: `${label} · ${formatSize(file.size)}` });
      } else {
        showToast({ variant: 'error', message: 'Upload failed. Please try again.' });
      }
    } catch {
      showToast({ variant: 'error', message: 'Upload failed. Please try again.' });
    } finally {
      setUploadPct(null);
    }
  };

  const handleDelete = async (video: ClientVideo) => {
    if (!window.confirm('Delete this video? This cannot be undone.')) return;
    setVideos((cur) => cur.filter((v) => v.id !== video.id));
    await deleteClientVideo(video.id);
  };

  const uploading = uploadPct !== null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Project Videos{videos.length > 0 ? ` (${videos.length})` : ''}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value as (typeof LABELS)[number])}
            disabled={uploading}
            className="rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B3C6C] disabled:opacity-50"
          >
            {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : 'Upload video'}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="sr-only" onChange={handleFile} />
        </div>
      </div>

      {uploading && (
        <div className="mb-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#1B3C6C] transition-all" style={{ width: `${uploadPct}%` }} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">{uploadPct}% — keep this panel open until it finishes.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 py-8">
          <Film className="h-7 w-7 text-slate-200" />
          <p className="mt-2 text-sm font-bold text-slate-400">No videos yet</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Add a before/after walkthrough from the project.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.map((video) => (
            <div key={video.id} className="overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white">
              <video src={video.url} controls preload="metadata" className="aspect-video w-full bg-slate-900" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-black ${labelBadge(video.label)}`}>
                    {video.label}
                  </span>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500" title={video.fileName}>
                    {formatSize(video.sizeBytes)} · {new Date(video.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {(isAdmin || video.uploadedByUserId === currentUser?.id) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(video)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
