import { bindPress } from './press';

// Keep essential controls outside the collapsible/scrollable diagnostic panel.
export class PhoneControls {
  readonly group=document.createElement('div');readonly take=document.createElement('button');
  readonly menu=document.createElement('button');readonly status=document.createElement('p');
  pressed=false;private unbind:(()=>void)[]=[];
  constructor(overlay:HTMLElement,select:()=>void,actions:{rooms?:()=>void;exit?:()=>void}={}){
    this.group.className='xr-phone-controls';this.group.hidden=true;this.group.setAttribute('aria-label','Commandes de la main virtuelle');
    this.take.type=this.menu.type='button';this.take.textContent='Prendre';this.take.setAttribute('aria-pressed','false');
    this.menu.textContent='Sélectionner au mur';
    const rooms=document.createElement('button'),exit=document.createElement('button');rooms.textContent='Pièces / Jeu';exit.textContent='Quitter AR';rooms.type=exit.type='button';
    this.status.setAttribute('role','status');this.group.append(this.take,this.menu,rooms,exit,this.status);overlay.append(this.group);
    this.unbind=[bindPress(this.take,()=>{if(this.take.disabled)return;this.pressed=!this.pressed;this.label();}),bindPress(this.menu,()=>{if(!this.menu.disabled)select();}),bindPress(rooms,()=>actions.rooms?.()),bindPress(exit,()=>actions.exit?.())];
  }
  private label(){this.take.textContent=this.pressed?'Relâcher':'Prendre';this.take.setAttribute('aria-pressed',String(this.pressed));}
  update(available:boolean,enabled:boolean,canSelect:boolean,message:string){
    this.group.hidden=!available;this.take.disabled=!enabled;this.menu.disabled=!canSelect;
    if(!enabled)this.pressed=false;this.label();if(this.status.textContent!==message)this.status.textContent=message;
  }
  dispose(){this.unbind.forEach(unbind=>unbind());this.group.remove();this.pressed=false;}
}
