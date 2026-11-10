import type {ReactNode} from 'react';
type Kind='cast'|'sword'|'ice'|'shield'|'dodge'|'recall'|'echo'|'overdrive';
export function CombatPixelIcon({kind}:{kind:Kind}){
 const art:Record<Kind,ReactNode>={
 cast:<><path d="M3 25h5v-5h5v-5h5v-5h5V6h4v8h-5v5h-5v5h-5v5H3Z" fill="#23434e"/><path d="M5 25h4v-5h5v-5h5v-5h6v3h-5v5h-5v5h-5v4H5Z" fill="#b6f5ed"/><path d="M21 3h3v5h5v3h-5v5h-3v-5h-5V8h5Z" fill="#6cd8e0"/><path d="M5 10h3V7h2v3h3v2h-3v3H8v-3H5Z" fill="#e1fff1"/></>,
 sword:<><path d="M5 27h5l5-6 3 3 3-3-4-4L28 6V2h-5L12 14l-3-3-3 3 4 4-6 6Z" fill="#263b3b"/><path d="M13 16L25 4h2v3L16 19Z" fill="#d8f0da"/><path d="M14 16L25 5v3L16 18Z" fill="#87b6ae"/><path d="M8 12l12 11 2-2L10 10Z" fill="#d2b66d"/><path d="M4 26l3 3 6-8-3-2Z" fill="#9f7943"/></>,
 ice:<><path d="M2 27l5-16 5 12L17 3l6 20 4-11 4 15Z" fill="#214752"/><path d="M4 26l3-11 3 11Zm8 0l5-19 5 19Zm12 0l3-10 2 10Z" fill="#9ddde9"/><path d="M17 7v19h-5Zm10 9v10h-3ZM7 15v11H4Z" fill="#def9f2"/><path d="M5 27h24v3H5Z" fill="#5fa7bd"/></>,
 shield:<><path d="M4 7l12-5 12 5v12l-4 7-8 5-8-5-4-7Z" fill="#47583a"/><path d="M7 9l9-4 9 4v10l-4 6-5 3-5-3-4-6Z" fill="#dfc781"/><path d="M10 11l6-3 6 3v8l-6 6-6-6Z" fill="#6d9869"/><path d="M15 10h3v10h-3Zm-4 4h11v3H11Z" fill="#e9f1b8"/></>,
 dodge:<><path d="M10 4h11v12l7 5v8H5v-8l5-5Z" fill="#344638"/><path d="M12 5h7v13l7 5v3H8v-4l4-4Z" fill="#d9c981"/><path d="M8 27h19v3H7Z" fill="#8b9a61"/><path d="M2 9h7v3H2Zm-1 6h6v3H1Zm1 7h3v3H2Z" fill="#a7d6b6"/></>,
 recall:<><path d="M9 5h14v3h5v15h-5v5H9v-4H4V11h5Z" fill="#46395f"/><path d="M11 7h10v3h5v11h-5v5H11v-4H7v-9h4Z" fill="#9b80cb"/><path d="M13 11h8v3h-7v6h7v3H11v-3H9v-6h4Z" fill="#d0b9ef"/><path d="M2 8h9v9H8v-4H2Z" fill="#b4ead3"/></>,
 echo:<><path d="M10 3h12v3h5v20l-4 4-5-4-5 4-5-4H4V10h6Z" fill="#285746"/><path d="M11 6h10v3h4v16l-4-2-4 4-4-4-6 3V11h4Z" fill="#b1ebc1"/><path d="M11 12h3v5h-3Zm8 0h3v5h-3Z" fill="#306954"/><path d="M14 20h5v3h-5Z" fill="#70bb94"/><path d="M1 2h3v3H1Zm27 4h3v3h-3Z" fill="#d3f5ad"/></>,
 overdrive:<><path d="M14 2h11l-7 10h10L9 31l4-14H5Z" fill="#836a35"/><path d="M16 4h5l-7 11h9L13 26l4-12H9Z" fill="#f3d482"/></>
 };
 return <svg className="combat-pixel-icon" viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">{art[kind]}</svg>;
}
