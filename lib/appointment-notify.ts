import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';

function fmtDate(d: string) {
  if (!d) return 'TBD';
  const [y, m, day] = d.split('-');
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtTime(t: string) {
  if (!t) return 'TBD';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

type NotifyEvent = 'scheduled' | 'rescheduled' | 'cancelled' | 'moved';

interface NotifyParams {
  event: NotifyEvent;
  repName: string;
  repEmail: string;
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  address?: string;
  city?: string;
  appointmentType?: string;
  title?: string | null;
  /** For moved events — the original date/time before the change */
  previousDate?: string;
  previousTime?: string;
}

const EVENT_LABELS: Record<NotifyEvent, string> = {
  scheduled: 'New Appointment Scheduled',
  rescheduled: 'Appointment Rescheduled',
  cancelled: 'Appointment Cancelled',
  moved: 'Appointment Moved',
};

const ACCENT_COLORS: Record<NotifyEvent, string> = {
  scheduled: '#1B3C6C',
  rescheduled: '#b45309',
  cancelled: '#b91c1c',
  moved: '#0369a1',
};

export async function sendAppointmentNotification(params: NotifyParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !params.repEmail) return;

  const {
    event, repName, repEmail, customerName,
    appointmentDate, appointmentTime,
    address, city, title,
    previousDate, previousTime,
  } = params;

  const label = EVENT_LABELS[event];
  const accent = ACCENT_COLORS[event];
  const location = [address, city].filter(Boolean).join(', ') || 'No location set';
  const dateTime = `${fmtDate(appointmentDate)} at ${fmtTime(appointmentTime)}`;
  const displayName = customerName || title || 'Appointment';
  const subject = `${label}: ${displayName}`;

  const previousRow = (previousDate || previousTime)
    ? `<tr><td width="4" style="width:4px;background:${accent};">&nbsp;</td><td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Was Scheduled For</p><p style="margin:0;font-size:15px;font-weight:600;color:#94a3b8;text-decoration:line-through;">${fmtDate(previousDate ?? appointmentDate)} at ${fmtTime(previousTime ?? appointmentTime)}</p></td></tr>`
    : '';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:${accent};padding:28px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);">OntarioReno · Appointments</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">${label}</p>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;">Hi ${repName}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.65;">${
      event === 'scheduled' ? `A new appointment has been booked for you.`
      : event === 'cancelled' ? `The following appointment has been <strong style="color:#b91c1c;">cancelled</strong>.`
      : event === 'rescheduled' ? `The following appointment has been <strong style="color:#b45309;">rescheduled</strong>.`
      : `The following appointment has been <strong style="color:#0369a1;">moved</strong> to a new date or time.`
    }</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${previousRow}
      <tr><td width="4" style="width:4px;background:${accent};">&nbsp;</td><td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Client</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${displayName}</p></td></tr>
      <tr><td width="4" style="width:4px;background:${accent};">&nbsp;</td><td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${event === 'cancelled' ? 'Was Scheduled' : 'Date &amp; Time'}</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;${event === 'cancelled' ? 'text-decoration:line-through;color:#94a3b8;' : ''}">${dateTime}</p></td></tr>
      <tr><td width="4" style="width:4px;background:${accent};">&nbsp;</td><td style="padding:13px 18px;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Location</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${location}</p></td></tr>
    </table>
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">Appointment managed through <strong style="color:#64748b;">OntarioReno</strong></p></div>
</div></body></html>`;

  const plainLines: string[] = [`Hi ${repName},`, ''];
  if (event === 'scheduled') plainLines.push('A new appointment has been booked for you.');
  else if (event === 'cancelled') plainLines.push('The following appointment has been cancelled.');
  else if (event === 'rescheduled') plainLines.push('The following appointment has been rescheduled.');
  else plainLines.push('The following appointment has been moved to a new date or time.');
  plainLines.push('');
  if (previousDate || previousTime) plainLines.push(`Was: ${fmtDate(previousDate ?? appointmentDate)} at ${fmtTime(previousTime ?? appointmentTime)}`);
  plainLines.push(`Client: ${displayName}`, `Date & Time: ${dateTime}`, `Location: ${location}`, '', 'OntarioReno');

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: repEmail,
      subject,
      html,
      text: plainLines.join('\n'),
    });
  } catch {
    // email is best-effort — don't fail the request
  }
}

