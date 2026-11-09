import './timeItemArt.css';

/** Transparent item artwork shared by the shop and inventory. */
export function TimeItemArt() {
  return <span className="time-item-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}assets/ui/them-mot-chut.png`} alt=""/></span>;
}
