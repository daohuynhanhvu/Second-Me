import React, { useEffect, useRef, useState } from 'react';
import type { GameEngine, HUDState } from '../game/GameEngine.ts';
import { SettingsPanel } from './CampaignUI.tsx';
import { sounds } from '../game/logic/sound.ts';

/**
 * Painted title screen (public/assets/menu/main-menu.jpg, prepared by
 * tools/assets/prepare_main_menu.py). The title is part of the painting; the menu words
 * were erased from the stone panel and are real buttons here, so they translate, take
 * keyboard focus and show the rune-framed highlight on whichever item is selected.
 */
const MENU_ART = `${import.meta.env.BASE_URL}assets/menu/main-menu.jpg`;
type Item = 'start' | 'continue' | 'settings' | 'credits' | 'quit';
const ITEMS: Item[] = ['start', 'continue', 'settings', 'credits', 'quit'];
const LABEL: Record<'en' | 'vi', Record<Item, string>> = {
  en: { start: 'START GAME', continue: 'CONTINUE', settings: 'SETTINGS', credits: 'CREDITS', quit: 'QUIT' },
  vi: { start: 'BẮT ĐẦU', continue: 'TIẾP TỤC', settings: 'CÀI ĐẶT', credits: 'GHI CÔNG', quit: 'THOÁT' },
};
const TEXT = {
  en: {
    replay: '▶ REPLAY INTRO', hint: '↑ ↓ select · ENTER confirm', noSave: 'No journey to continue yet',
    creditsTitle: 'Credits', close: 'CLOSE', quitTitle: 'Leave the forest?',
    quitBody: 'The browser keeps this tab open. Close the tab to quit; your progress is saved.', back: 'BACK TO MENU',
    credits: [
      ['Game', 'Second Me · Chapter II: The Emberforge'],
      ['Art', 'Hand-painted forest, traps, gates and menu art from the Second Me asset set'],
      ['Characters', 'Blue Wizard, Kael and the Frost Guardian sprite sets'],
      ['Voice', 'Narration and character lines rendered offline with OmniVoice'],
      ['Built with', 'React, TypeScript, Vite and the Web Audio API'],
    ],
  },
  vi: {
    replay: '▶ XEM LẠI INTRO', hint: '↑ ↓ chọn · ENTER xác nhận', noSave: 'Chưa có hành trình để tiếp tục',
    creditsTitle: 'Ghi công', close: 'ĐÓNG', quitTitle: 'Rời khu rừng?',
    quitBody: 'Trình duyệt không cho trang tự đóng tab. Hãy đóng tab để thoát; tiến độ đã được lưu.', back: 'VỀ MENU',
    credits: [
      ['Trò chơi', 'Second Me · Chương II: Lò Rèn Emberforge'],
      ['Mỹ thuật', 'Khu rừng, bẫy, cổng và menu vẽ tay từ bộ asset Second Me'],
      ['Nhân vật', 'Bộ sprite Pháp sư Xanh, Kael và Hộ Vệ Băng Giá'],
      ['Lồng tiếng', 'Lời dẫn và thoại nhân vật dựng sẵn bằng OmniVoice'],
      ['Công nghệ', 'React, TypeScript, Vite và Web Audio API'],
    ],
  },
} as const;

export function MainMenu({ engine, hud, active, onReplay }: { engine: GameEngine | null; hud: HUDState; active: boolean; onReplay: () => void }) {
  const lang = hud.language === 'vi' ? 'vi' : 'en';
  const canContinue = hud.completed.length > 0;
  const [selected, setSelectedState] = useState<Item>(canContinue ? 'continue' : 'start');
  const selectedRef = useRef(selected);
  const setSelected = (item: Item) => { selectedRef.current = item; setSelectedState(item); };
  const [dialog, setDialog] = useState<null | 'settings' | 'credits' | 'quit'>(null);
  const buttons = useRef<Partial<Record<Item, HTMLButtonElement | null>>>({});
  const enabled = (item: Item) => item !== 'continue' || canContinue;

  const activate = (item: Item) => {
    if (!enabled(item)) return;
    if (item !== 'quit') sounds.playPlateActivate();
    if (item === 'start') engine?.openLobby();
    else if (item === 'continue') engine?.continueGame();
    else if (item === 'quit') { window.close(); setDialog('quit'); }   // close() only works for script-opened tabs
    else setDialog(item);
  };

  // Keyboard: arrows / W S move, Enter / Space confirm. Captured before the engine's own
  // Enter handler so Enter does what the highlighted item says.
  useEffect(() => {
    if (!active || dialog) return;
    const onKey = (e: KeyboardEvent) => {
      const step = e.code === 'ArrowDown' || e.code === 'KeyS' ? 1 : e.code === 'ArrowUp' || e.code === 'KeyW' ? -1 : 0;
      if (step) {
        e.preventDefault(); e.stopImmediatePropagation();
        let i = ITEMS.indexOf(selectedRef.current);
        do i = (i + step + ITEMS.length) % ITEMS.length; while (!enabled(ITEMS[i]));
        setSelected(ITEMS[i]);
        buttons.current[ITEMS[i]]?.focus({ preventScroll: true });
      } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
        e.preventDefault(); e.stopImmediatePropagation();
        activate(selectedRef.current);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, dialog, canContinue, engine]);

  // Escape closes the credits / quit card (the settings panel has its own close button).
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.stopImmediatePropagation(); setDialog(null); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [dialog]);

  const t = TEXT[lang];
  return (
    <div className={`main-menu overlay${hud.reducedMotion ? ' still' : ''}`} data-testid="main-menu" style={{ backgroundImage: `url(${MENU_ART})` }}>
      <div className="mm-portal-glow" aria-hidden="true"/>
      <div className="mm-motes" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i}/>)}</div>
      <h1 className="sr-only">Second Me · Echoes of the Wild</h1>
      <nav className="mm-list" aria-label={lang === 'vi' ? 'Menu chính' : 'Main menu'}>
        {ITEMS.map(item => (
          <button key={item} ref={el => { buttons.current[item] = el; }} type="button"
            className={`mm-item${selected === item ? ' selected' : ''}`}
            disabled={!enabled(item)} title={!enabled(item) ? t.noSave : undefined}
            onMouseEnter={() => enabled(item) && setSelected(item)} onFocus={() => setSelected(item)}
            onClick={() => activate(item)}>
            <span className="mm-rune" aria-hidden="true">ᚱ</span>{LABEL[lang][item]}<span className="mm-rune" aria-hidden="true">ᛟ</span>
          </button>
        ))}
      </nav>
      <div className="mm-footer">
        <button type="button" className="mm-replay" onClick={onReplay}>{t.replay}</button>
        <span>{t.hint}</span>
      </div>
      {dialog === 'settings' && <SettingsPanel engine={engine} hud={hud} close={() => setDialog(null)}/>}
      {dialog === 'credits' && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <div className="panel mm-card" role="dialog" aria-modal="true" aria-labelledby="mm-credits-title" onClick={e => e.stopPropagation()}>
            <span className="eyebrow gold">SECOND ME</span>
            <h2 id="mm-credits-title">{t.creditsTitle}</h2>
            <dl>{t.credits.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
            <button className="primary" autoFocus onClick={() => setDialog(null)}>{t.close}</button>
          </div>
        </div>
      )}
      {dialog === 'quit' && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <div className="panel mm-card" role="dialog" aria-modal="true" aria-labelledby="mm-quit-title" onClick={e => e.stopPropagation()}>
            <h2 id="mm-quit-title">{t.quitTitle}</h2>
            <p className="muted">{t.quitBody}</p>
            <button className="primary" autoFocus onClick={() => setDialog(null)}>{t.back}</button>
          </div>
        </div>
      )}
    </div>
  );
}
