type MenuItem={id:string;label:string;selector:string};
export function setupPanelMenu(host:HTMLElement,items:MenuItem[],initial=items[0]?.id){
  const menu=document.createElement('nav');menu.className='panel-menu';menu.setAttribute('aria-label','Navigation des panneaux');
  const buttons=new Map<string,HTMLButtonElement>();
  for(const item of items){const button=document.createElement('button');button.type='button';button.textContent=item.label;button.dataset.panel=item.id;button.onclick=()=>select(item.id);menu.append(button);buttons.set(item.id,button);}
  host.prepend(menu);
  function select(id:string){for(const item of items){const panel=document.querySelector<HTMLElement>(item.selector);if(panel)panel.hidden=item.id!==id;buttons.get(item.id)?.setAttribute('aria-current',item.id===id?'page':'false');}history.replaceState(null,'',`#${id}`);}
  select(initial??'');
  const hash=location.hash.slice(1);if(items.some(item=>item.id===hash))select(hash);
}
