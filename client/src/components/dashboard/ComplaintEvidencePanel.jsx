function formatFileSize(bytes = 0) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds = 0) {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function ComplaintEvidencePanel({ image, voiceNote, title = 'Citizen Evidence' }) {
  if (!image && !voiceNote) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate">
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {image ? (
          <article className="rounded-2xl border border-ink/10 bg-mist p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-tide">Image Evidence</p>
            <img
              src={image.dataUrl}
              alt={image.name || 'Citizen evidence'}
              className="mt-3 h-52 w-full rounded-xl object-cover"
            />
            <p className="mt-3 font-semibold text-ink">{image.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate">
              {formatFileSize(image.size)}
            </p>
          </article>
        ) : null}

        {voiceNote ? (
          <article className="rounded-2xl border border-ink/10 bg-mist p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-tide">Voice Note</p>
            <audio controls src={voiceNote.dataUrl} className="mt-3 w-full" />
            <p className="mt-3 font-semibold text-ink">{voiceNote.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate">
              {formatDuration(voiceNote.durationSeconds)} | {formatFileSize(voiceNote.size)}
            </p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

export default ComplaintEvidencePanel;
