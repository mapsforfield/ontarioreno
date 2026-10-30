// The ads currently running — what a homeowner saw before they booked.
// Shown to reps on /portal/advertising so the first conversation picks up
// where the ad left off.
//
// To swap an ad: drop a compressed copy in public/reels/ (720px wide MP4 with
// +faststart, plus a small .webp poster frame) and edit this list.
//
// Keep "ad" out of the folder and file names. Ad-block lists hide any URL
// with /ads/ or -ad- in it, so a rep with a blocker saw a black phone and no
// thumbnails when these lived at /ads/basement-ad-1.mp4. Order here
// is the order on the page; the first entry is selected on open.

export type RunningAd = {
  id: string;
  title: string;
  /** One line on what the ad pitches, shown under the title. */
  angle: string;
  category: 'Basement' | 'Bathroom' | 'Kitchen' | 'Windows' | 'Other';
  video: string;
  poster: string;
  /** Seconds, for the label only. */
  duration: number;
};

export const RUNNING_ADS: RunningAd[] = [
  {
    id: 'basement-ad-1',
    title: 'Basement Ad #1',
    angle: 'No money down, from $399/mo · side entrance included · free call-back',
    category: 'Basement',
    video: '/reels/basement-1.mp4',
    poster: '/reels/basement-1.webp',
    duration: 11,
  },
  {
    id: 'basement-ad-2',
    title: 'Basement Ad #2',
    angle: 'From $399/mo, $0 down · move it to your mortgage at renewal · GTA',
    category: 'Basement',
    video: '/reels/basement-2.mp4',
    poster: '/reels/basement-2.webp',
    duration: 12,
  },
  {
    id: 'bathroom-ad',
    title: 'Bathroom Ad',
    angle: 'No money down, from $99/mo · before and after',
    category: 'Bathroom',
    video: '/reels/bathroom-1.mp4',
    poster: '/reels/bathroom-1.webp',
    duration: 11,
  },
];
