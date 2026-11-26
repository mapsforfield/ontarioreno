// The public phone number shown on the site (tap-to-call). It is the Twilio
// number, which forwards to the office. One constant so it is changed in one
// place. Inbound TEXTS to this number still hit /api/sms/inbound as before —
// publishing it does not change that path.
export const PUBLIC_PHONE_E164 = '+16475585900';
export const PUBLIC_PHONE_DISPLAY = '(647) 558-5900';
export const PUBLIC_PHONE_HREF = `tel:${PUBLIC_PHONE_E164}`;
