/**
 * Sound effects from public/assets/sfx. As with music, the FILE NAME decides which sound a
 * file replaces, so adding effects never needs code: drop an .mp3/.ogg/.wav/.m4a in the folder
 * and name it after the sound (accents and case do not matter). A sound with no file keeps its
 * synthesised version in sound.ts; the four combat sounds marked "new" and the two portal
 * transition sounds are silent without one.
 * Several files for one sound are picked at random each time (good for footsteps and hits).
 * The folder listing comes from assets/sfx/index.json, which vite.config.ts serves live in dev
 * and writes at build time. The README in the folder lists the names for players.
 */
export type SfxId =
  | 'recordStop' | 'recordStart' | 'echoDismiss' | 'echoSpawn'
  | 'plateOff' | 'plateOn' | 'doorClose' | 'doorOpen'
  | 'finisher' | 'slash' | 'spell' | 'dodge'
  | 'break' | 'hit' | 'footstep' | 'victory'
  | 'portalMove' | 'portalOpen';

export const SFX_BASE = `${import.meta.env?.BASE_URL ?? '/'}assets/sfx`;

/** Checked top to bottom on the accent-free, lower-case name: the first match wins. */
const RULES: [SfxId, RegExp][] = [
  ['recordStop', /dung ghi|ngung ghi|record ?stop|stop ?record/],
  ['recordStart', /bat dau ghi|ghi hinh|record/],
  ['echoDismiss', /huy echo|echo ?(dismiss|tan|bien mat)|dismiss/],
  ['echoSpawn', /echo|trieu hoi|summon/],
  ['plateOff', /nha nut|tha nut|plate ?off/],
  ['plateOn', /nhan nut|nut bam|plate|button/],
  ['doorClose', /dong cua|door ?close/],
  ['doorOpen', /mo cua|door/],
  ['finisher', /ket lieu|finisher|don cuoi|nova/],
  ['slash', /chem|kiem|slash|swing/],
  ['spell', /phep|spell|cast|magic/],
  ['dodge', /\bne\b|ne tranh|dodge|luot|roll/],
  ['break', /\bvo\b|\bpha\b|break|shatter/],
  ['hit', /trung don|danh trung|\bhit\b|impact/],
  ['footstep', /buoc chan|footstep|\bstep\b/],
  ['victory', /chien thang|qua man|victory|\bwin\b/],
  // Loading screen's portal transition (loadingScene.ts): the stone arch sliding and turning,
  // then the portal waking and the dive into it.
  ['portalMove', /da truot|keo da|cong truot|rock|stone|slid|grind/],
  ['portalOpen', /mo cong|cong dich chuyen|portal|vortex|warp/],
];

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export function sfxOf(file: string): SfxId | null {
  const name = plain(file.replace(/\.[^.]+$/, '')).replace(/[-_.]+/g, ' ');
  return RULES.find(([, re]) => re.test(name))?.[0] ?? null;
}

/** URL of a file in the folder, spelled as the preloader spells it (same buffer cache entry). */
export const sfxUrl = (file: string) => `${SFX_BASE}/${encodeURIComponent(file)}`;

let index: Promise<Partial<Record<SfxId, string[]>>> | null = null;
let files: Partial<Record<SfxId, string[]>> | null = null;

/** Loads the folder listing once; until it arrives every sound plays its synth version. */
export function loadSfxIndex() {
  index ??= (typeof fetch === 'undefined' ? Promise.resolve([]) : fetch(`${SFX_BASE}/index.json`).then(r => (r.ok ? r.json() : [])).catch(() => []))
    .then((list: string[]) => {
      const out: Partial<Record<SfxId, string[]>> = {};
      for (const f of list) {
        const id = sfxOf(f);
        if (id) (out[id] ??= []).push(f);
        else if (import.meta.env?.DEV) console.info(`[sfx] "${f}" matches no sound name, ignored`);
      }
      files = out;
      return out;
    });
  return index;
}

/** The files for a sound (empty until the listing has loaded, or when the folder has none). */
export function sfxFiles(id: SfxId): string[] {
  return files?.[id] ?? [];
}
