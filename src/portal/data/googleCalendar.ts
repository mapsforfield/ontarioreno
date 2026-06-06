const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly';
const CONNECTION_STORAGE_KEY = 'ontarioreno.portal.googleCalendar';

export type GoogleCalendarConnection = {
  accessToken: string;
  calendarId: string;
  connectedAt: string;
  expiresAt: number;
};

export type GoogleCalendarEvent = {
  externalCalendarId: string;
  externalEventId: string;
  title: string;
  startDateTime: string;
  description: string;
  location: string;
  teamMemberName?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  expires_in?: number;
};

type GoogleCalendarApiEvent = {
  description?: string;
  id: string;
  location?: string;
  organizer?: { email?: string };
  start?: { date?: string; dateTime?: string };
  summary?: string;
};

type GoogleCalendarApiResponse = {
  items?: GoogleCalendarApiEvent[];
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            callback: (response: GoogleTokenResponse) => void;
            client_id: string;
            prompt?: string;
            scope: string;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google Identity script failed to load.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Google Identity script failed to load.'));
    document.head.appendChild(script);
  });
}

export function getGoogleCalendarConnection(): GoogleCalendarConnection | null {
  const rawConnection = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
  if (!rawConnection) return null;

  try {
    const connection = JSON.parse(rawConnection) as GoogleCalendarConnection;
    if (!connection.accessToken || connection.expiresAt <= Date.now()) {
      window.localStorage.removeItem(CONNECTION_STORAGE_KEY);
      return null;
    }

    return connection;
  } catch {
    window.localStorage.removeItem(CONNECTION_STORAGE_KEY);
    return null;
  }
}

export function disconnectGoogleCalendar() {
  window.localStorage.removeItem(CONNECTION_STORAGE_KEY);
}

function saveGoogleCalendarConnection(
  response: GoogleTokenResponse
): GoogleCalendarConnection {
  const expiresInMs = (response.expires_in ?? 3600) * 1000;
  const connection: GoogleCalendarConnection = {
    accessToken: response.access_token ?? '',
    calendarId: 'primary',
    connectedAt: new Date().toISOString(),
    expiresAt: Date.now() + expiresInMs - 60000,
  };

  window.localStorage.setItem(
    CONNECTION_STORAGE_KEY,
    JSON.stringify(connection)
  );

  return connection;
}

export async function connectGoogleCalendar() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error(
      'Missing VITE_GOOGLE_CLIENT_ID. Add it to your Vite environment before connecting Google Calendar.'
    );
  }

  await loadGoogleIdentityScript();
  const tokenClientFactory = window.google?.accounts?.oauth2?.initTokenClient;
  if (!tokenClientFactory) {
    throw new Error('Google OAuth client is not available.');
  }

  return new Promise<GoogleCalendarConnection>((resolve, reject) => {
    const tokenClient = tokenClientFactory({
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(response.error ?? 'Google Calendar connection failed.')
          );
          return;
        }

        resolve(saveGoogleCalendarConnection(response));
      },
      client_id: clientId,
      prompt: 'consent',
      scope: GOOGLE_CALENDAR_SCOPE,
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

function extractTeamMemberName(event: GoogleCalendarApiEvent) {
  const text = `${event.summary ?? ''} ${event.description ?? ''}`;
  const repMatch = text.match(/\b(?:rep|team member|staff)\s*:\s*([A-Za-z]+)/i);

  return repMatch?.[1];
}

function mapGoogleEvent(
  event: GoogleCalendarApiEvent,
  calendarId: string
): GoogleCalendarEvent | null {
  const startDateTime = event.start?.dateTime ?? event.start?.date;
  if (!startDateTime) return null;

  return {
    description: event.description ?? '',
    externalCalendarId: calendarId,
    externalEventId: event.id,
    location: event.location ?? '',
    startDateTime,
    teamMemberName: extractTeamMemberName(event),
    title: event.summary ?? 'Google Calendar Appointment',
  };
}

export async function fetchGoogleCalendarEvents(): Promise<
  GoogleCalendarEvent[]
> {
  const connection = getGoogleCalendarConnection();
  if (!connection) {
    throw new Error('Google Calendar is not connected.');
  }

  const params = new URLSearchParams({
    maxResults: '50',
    orderBy: 'startTime',
    singleEvents: 'true',
    timeMin: new Date().toISOString(),
  });
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      connection.calendarId
    )}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) disconnectGoogleCalendar();
    throw new Error('Could not read Google Calendar events.');
  }

  const data = (await response.json()) as GoogleCalendarApiResponse;

  return (data.items ?? [])
    .map((event) => mapGoogleEvent(event, connection.calendarId))
    .filter((event): event is GoogleCalendarEvent => Boolean(event));
}

export async function fetchMockGoogleCalendarEvents(): Promise<
  GoogleCalendarEvent[]
> {
  return [
    {
      description:
        'Setmore consultation. Client: Seema Persad-Sankarsingh. Rep: Xavier. Renovation appointment.',
      externalCalendarId: 'setmore-primary',
      externalEventId: 'setmore-xavier-seema-001',
      location: 'Ontario',
      startDateTime: '2026-06-08T10:00:00',
      teamMemberName: 'Xavier',
      title: 'Seema Persad-Sankarsingh - Renovation Consultation',
    },
    {
      description:
        'Setmore consultation. Client: Olaniyan Olasunbo. Rep: Oliver. Renovation appointment.',
      externalCalendarId: 'setmore-primary',
      externalEventId: 'setmore-oliver-olaniyan-001',
      location: 'Ontario',
      startDateTime: '2026-06-09T14:30:00',
      teamMemberName: 'Oliver',
      title: 'Olaniyan Olasunbo - Renovation Consultation',
    },
  ];
}
