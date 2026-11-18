import './admin.css';
import { createPreview } from './model-view';
import { area,type RoomLibrary } from '../../server/src/scene-schema.js';
import { AdventureEditor } from './adventure-editor';
import type { AdventureState } from '../../server/src/adventure.js';
import type { AdventureManifest } from '../../server/src/engine/puzzle-types.js';
type Player = { id: string; slot: number; name:string;address?: string; userAgent?: string; connectedAt: string };
type State = { players: Player[];playerNames:string[];playerNamesRevision:number;adventures:AdventureManifest[];puzzle: { solved: boolean; revision: number }; uptimeSeconds: number; publicOrigin: string; logs: Record<string, unknown>[];library:RoomLibrary;adventure:AdventureState };
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let token = '';
let timer: ReturnType<typeof setTimeout> | undefined;
let busy = false;
let loading = false;
let session = 0;
let previousPlayers = '';
const notice = el('notice');
let library:RoomLibrary|undefined;
let libraryRevision=-1;
const preview=createPreview(el('admin-room-preview'));
const adventureEditor=new AdventureEditor(el('adventure-editor'),(room,revision)=>api('rooms/save',{room,revision}),()=>{void refresh();});
const startAdventure=document.createElement('button');startAdventure.textContent='Commencer les énigmes';startAdventure.id='adventure-start';el('adventure-reset').after(startAdventure);
startAdventure.onclick=()=>{if(adventureEditor.hasChanges()){notice.textContent='Enregistrez ou rechargez les placements avant de commencer.';return;}void action('adventure/start',{});};
const catalogPanel=document.createElement('section');catalogPanel.className='panel';
catalogPanel.innerHTML='<h2>Aventure et équipe</h2><label>Aventure <select id="adventure-catalog"></select></label><button id="adventure-select">Choisir cette aventure</button><button id="adventure-stop" class="secondary">Arrêter la partie</button><p id="adventure-description"></p><p id="adventure-progress"></p><form id="player-names"><h3>Noms des quatre places</h3><div id="player-name-fields" class="players"></div><button type="submit">Enregistrer les noms</button><button id="suggest-names" type="button" class="secondary">Utiliser les noms suggérés</button></form><p>Les noms restent attachés aux places pendant ce démarrage du serveur. Les identités et sauvegardes persistantes viendront en Phase 3.</p>';
el('dashboard').prepend(catalogPanel);
const testPanel=document.createElement('div');testPanel.innerHTML='<h3>Accès direct aux énigmes</h3><p>Activez le mode test PC ci-dessous, puis choisissez une énigme. Une session temporaire démarre pour tous les joueurs. Désactiver le mode test restaure la progression précédente. Réinitialiser ou changer de pièce efface cette sauvegarde temporaire.</p><select id="test-step" aria-label="Énigme à tester"></select><button id="test-step-open">Tester cette énigme</button><p id="test-step-status"></p>';catalogPanel.append(testPanel);
let testStepsKey='';
el('test-step-open').onclick=()=>{if(adventureEditor.hasChanges()){notice.textContent='Enregistrez les placements avant de tester.';return;}void action('adventure/test-step',{stepId:el<HTMLSelectElement>('test-step').value,revision:latestAdventureRevision});};
let latestAdventureRevision=0,namesRevision=0,namesDirty=false,catalogKey='';
let catalog:AdventureManifest[]=[];
const nameFields=Array.from({length:4},(_,index)=>{const label=document.createElement('label');label.textContent=`Place ${index+1} `;const input=document.createElement('input');input.id=`player-name-${index+1}`;input.maxLength=40;input.required=true;input.oninput=()=>{namesDirty=true;};label.append(input);el('player-name-fields').append(label);return input;});
el('player-names').onsubmit=event=>{event.preventDefault();void (async()=>{try{await api('players/names',{names:nameFields.map(input=>input.value),revision:namesRevision});namesDirty=false;await refresh();}catch(error){notice.textContent=String(error);}})();};
el('suggest-names').onclick=()=>{const manifest=catalog.find(m=>`${m.id}@${m.version}`===el<HTMLSelectElement>('adventure-catalog').value);nameFields.forEach((input,index)=>{input.value=manifest?.players.suggestedNames[index]??`Joueur ${index+1}`;});namesDirty=true;};
el('adventure-select').onclick=()=>{if(adventureEditor.hasChanges()){notice.textContent='Enregistrez ou rechargez les placements avant de changer d’aventure.';return;}const manifest=catalog.find(m=>`${m.id}@${m.version}`===el<HTMLSelectElement>('adventure-catalog').value);if(manifest&&confirm('Changer d’aventure et réinitialiser sa progression ?'))void action('adventure/select',{id:manifest.id,version:manifest.version,revision:latestAdventureRevision});};
el('adventure-stop').onclick=()=>{void action('adventure/stop',{});};
function logout() {
  namesDirty=false;namesRevision=0;catalogKey='';catalog=[];nameFields.forEach(input=>{input.value='';});
  session++; token = ''; clearTimeout(timer); el<HTMLInputElement>('token').value = '';
  previousPlayers = '';
  library=undefined;libraryRevision=-1;el('rooms').replaceChildren();preview(null);
  adventureEditor.receive(null,0);
  el('dashboard').hidden = true; el('login-panel').hidden = false;
  el('players').replaceChildren(); el('logs').replaceChildren();
  el('connection').textContent = 'Non connecté'; el('connection').className = 'badge';
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) logout();
    throw new Error(data.error ?? `Erreur HTTP ${response.status}`);
  }
  return data as T;
}
function node(tag: string, text: string, className?: string) {
  const value = document.createElement(tag); value.textContent = text;
  if (className) value.className = className;
  return value;
}
function render(state: State) {
  latestAdventureRevision=state.adventure.revision;catalog=state.adventures;
  const engine=state.adventure.engine,key=JSON.stringify(state.adventures);
  if(key!==catalogKey){catalogKey=key;el('adventure-catalog').replaceChildren(...catalog.map(m=>{const option=document.createElement('option');option.value=`${m.id}@${m.version}`;option.textContent=`${m.title} — ${m.version}`;return option;}));el<HTMLSelectElement>('adventure-catalog').value=`${engine.adventureId}@${engine.adventureVersion}`;}
  const manifest=catalog.find(m=>m.id===engine.adventureId&&m.version===engine.adventureVersion);
  const stepsKey=JSON.stringify([engine.adventureId,engine.adventureVersion,manifest?.steps]);
  if(stepsKey!==testStepsKey){testStepsKey=stepsKey;el('test-step').replaceChildren(...(manifest?.steps??[]).map(step=>{const option=document.createElement('option');option.value=step.id;option.textContent=step.title+(step.kind==='planned'?' — bientôt disponible':'');option.disabled=step.kind!=='puzzle';return option;}));}
  el<HTMLSelectElement>('test-step').disabled=!state.adventure.testMode;
  el<HTMLButtonElement>('test-step-open').disabled=!state.adventure.testMode||state.adventure.phase==='unconfigured'||!manifest?.steps.some(step=>step.kind==='puzzle');
  el('test-step-status').textContent=engine.testStartStepId?'Session de test temporaire active : les résultats seront abandonnés en quittant le mode test.':state.adventure.testMode?'Mode test actif : choisissez une énigme disponible.':'Accès direct désactivé : activez le mode test PC.';
  el('adventure-description').textContent=`Active : ${manifest?.title??engine.adventureId}. ${manifest?.description??''}`;
  el('adventure-progress').textContent=`Étape : ${engine.step.title} · Réussites : ${engine.completedSteps.length}/${manifest?.steps.length??0} · Inventaire : ${engine.inventory.map(r=>r.label).join(', ')||'vide'}`;
  el<HTMLButtonElement>('adventure-select').disabled=state.adventure.running||!!engine.testStartStepId;
  el<HTMLButtonElement>('adventure-stop').disabled=!state.adventure.running;
  if(!namesDirty){namesRevision=state.playerNamesRevision;nameFields.forEach((input,index)=>{input.value=state.playerNames[index];});}
  startAdventure.disabled=state.adventure.running||['unconfigured','pending','complete'].includes(state.adventure.phase);
  library=state.library;
  adventureEditor.receive(library.rooms.find(room=>room.id===library!.activeId)??null,library.revision);
  el('adventure-overview').textContent=`${state.adventure.running?'Partie en cours':'Préparation'} · ${state.adventure.phase} · ${state.adventure.message}`;
  el<HTMLInputElement>('adventure-test').checked=state.adventure.testMode;
  if(library.revision!==libraryRevision){
    libraryRevision=library.revision;
    const active=library.rooms.find(room=>room.id===library!.activeId)??null;
    el('rooms-summary').textContent=`${library.rooms.length} / 20 pièces enregistrées · Active : ${active?.name??'aucune'}`;
    el('rooms').replaceChildren(...library.rooms.map(room=>{
      const card=node('article','','player');
      card.append(node('h3',room.name+(room.id===library!.activeId?' · active':'')),node('p',`${area(room.floor).toFixed(1)} m² · hauteur ${room.height} m · ${room.obstacles.length} obstacles · ${(room.openings??[]).length} ouvertures`));
      const activate=node('button','Activer','secondary') as HTMLButtonElement;
      activate.disabled=room.id===library!.activeId;
      activate.onclick=()=>{if(confirm(`Activer ${room.name} ? Les joueurs devront refaire le calibrage A/B.`))void action('rooms/activate',{id:room.id,revision:library!.revision});};
      const remove=node('button','Supprimer','danger');
      remove.onclick=()=>{if(confirm(`Supprimer définitivement la pièce ${room.name} du serveur ?`))void action('rooms/delete',{id:room.id,revision:library!.revision});};
      card.append(activate,remove);return card;
    }));
    preview(active);
  }
  el('count').textContent = `${state.players.length} / 4`;
  el('puzzle').textContent = state.puzzle.solved ? 'Résolue' : 'À résoudre';
  el('revision').textContent = `Démo · révision ${state.puzzle.revision}`;
  el('uptime').textContent = `${Math.floor(state.uptimeSeconds / 3600)} h ${Math.floor(state.uptimeSeconds / 60) % 60} min`;
  el('origin').textContent = state.publicOrigin;
  const playerKey = JSON.stringify([state.players,state.playerNames]);
  if (playerKey !== previousPlayers) el('players').replaceChildren(...[1, 2, 3, 4].map(slot => {
    const player = state.players.find(p => p.slot === slot);
    const card = node('article', '', `player${player ? '' : ' empty'}`);
    card.append(node('h3', `${state.playerNames[slot-1]} · ${player ? 'connecté' : 'libre'}`));
    if (!player) { card.append(node('p', 'En attente d’un joueur')); return card; }
    card.append(node('code', player.id), node('p', player.address ?? 'Adresse indisponible'), node('p', player.userAgent ?? 'Navigateur inconnu'), node('p', `Depuis ${new Date(player.connectedAt).toLocaleTimeString('fr-CH')}`));
    const kick = node('button', 'Déconnecter', 'danger') as HTMLButtonElement;
    kick.onclick = () => { if (confirm(`Déconnecter le joueur ${slot} ? Il devra recharger sa page pour revenir.`)) void action('kick', { id: player.id }); };
    card.append(kick); return card;
  }));
  previousPlayers = playerKey;
  el('logs').replaceChildren(...state.logs.slice().reverse().map(entry => {
    const row = document.createElement('tr');
    const { timestamp, event, ...details } = entry;
    row.append(node('td', new Date(String(timestamp)).toLocaleTimeString('fr-CH')), node('td', String(event)), node('td', JSON.stringify(details)));
    return row;
  }));
}
async function refresh() {
  clearTimeout(timer);
  if (!token || loading) return;
  loading = true;
  const current = session;
  try {
    const state = await api<State>('state');
    if (current !== session) return;
    render(state); el('dashboard').hidden = false; el('login-panel').hidden = true;
    el('connection').textContent = '● Connecté'; el('connection').className = 'badge online';
    notice.textContent = '';
  } catch (error) {
    if (current === session || !token) notice.textContent = String(error);
    el('connection').textContent = 'Connexion indisponible'; el('connection').className = 'badge';
  } finally {
    loading = false;
    if (token && current === session) timer = setTimeout(() => { void refresh(); }, 2000);
  }
}
async function action(path: string, body: unknown) {
  if (busy) return;
  busy = true; el<HTMLButtonElement>('reset').disabled = true;
  try { await api(path, body); await refresh(); }
  catch (error) { notice.textContent = String(error); }
  finally { busy = false; el<HTMLButtonElement>('reset').disabled = false; }
}
el('login').onsubmit = event => {
  event.preventDefault(); if (loading) return;
  token = el<HTMLInputElement>('token').value; el<HTMLInputElement>('token').value = ''; session++; void refresh();
};
el('reset').onclick = () => { if (confirm('Réinitialiser l’énigme pour tous les joueurs ?')) void action('reset', {}); };
el('refresh').onclick = () => { void refresh(); };
el('logout').onclick = () => { logout(); notice.textContent = ''; };
el('adventure-reset').onclick=()=>{if(confirm('Recommencer le coffre et le blackjack pour toute l’équipe ?'))void action('adventure/reset',{});};
el<HTMLInputElement>('adventure-test').onchange=()=>{void action('adventure/test-mode',{enabled:el<HTMLInputElement>('adventure-test').checked});};
el('rooms-export').onclick=()=>{
  if(!library)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(library,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='myroom-rooms.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
