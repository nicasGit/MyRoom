import type { MenuButton } from './portal/wall-menu-view';

/** Small headset keyboard; the draft is persisted only by the existing save flow. */
export class RoomNameEditor {
  value:string;private numbers=false;
  constructor(initial:string){this.value=initial;}
  buttons():MenuButton[]{
    const letters=this.numbers?"0123456789ÉÈÀÇÙ-'":'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return [...Array.from(letters,letter=>({id:'room-name:key:'+letter,title:letter})),
      ...[['space','Espace'],['erase','Effacer'],['clear','Vider'],['page',this.numbers?'ABC':'123 É'],['save','Valider'],['cancel','Annuler'],['exit','Quitter XR']].map(([id,title])=>({id:'room-name:'+id,title,disabled:id==='save'&&!this.value.trim()}))];
  }
  press(id:string){
    const key=id.slice('room-name:'.length);
    if(key==='save')return this.value.trim()?'save':undefined;
    if(key==='cancel'||key==='exit')return key;
    if(key==='page')this.numbers=!this.numbers;
    else if(key==='clear')this.value='';
    else if(key==='erase')this.value=this.value.slice(0,-1);
    else if(key==='space')this.value=(this.value+' ').slice(0,64);
    else if(key.startsWith('key:')&&Array.from(key.slice(4)).length===1)this.value=(this.value+key.slice(4)).slice(0,64);
    return undefined;
  }
}
