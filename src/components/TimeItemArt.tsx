import './timeItemArt.css';

/** The supplied artwork is kept intact; the frame crops its surrounding whitespace. */
export function TimeItemArt() {
  return <span className="time-item-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}assets/ui/them-mot-chut.png`} alt=""/></span>;
}
