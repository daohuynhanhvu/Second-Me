import {useCallback,useEffect,useRef,useState} from 'react';
/** Give nested game dialogs a short, cancellable exit before removing them. */
export function useDialogClose(onClose:()=>void){
 const callback=useRef(onClose);callback.current=onClose;const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const [closing,setClosing]=useState(false);
 const close=useCallback(()=>{if(timer.current!==null)return;if(document.body.classList.contains('reduced-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches){callback.current();return;}setClosing(true);timer.current=setTimeout(()=>{timer.current=null;callback.current();},150);},[]);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 return {closing,close};
}
