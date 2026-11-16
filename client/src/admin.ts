import './admin.css';
import { createPreview } from './model-view';
import { area,type RoomLibrary } from '../../server/src/scene-schema.js';
type Player = { id: string; slot: number; address?: string; userAgent?: string; connectedAt: string };
type State = { players: Player[]; puzzle: { solved: boolean; revision: number }; uptimeSeconds: number; publicOrigin: string; logs: Record<string, unknown>[];library:RoomLibrary };
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
function logout() {
  session++; token = ''; clearTimeout(timer); el<HTMLInputElement>('token').value = '';
  previousPlayers = '';
  library=undefined;libraryRevision=-1;el('rooms').replaceChildren();preview(null);
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
  library=state.library;
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
  const playerKey = JSON.stringify(state.players);
  if (playerKey !== previousPlayers) el('players').replaceChildren(...[1, 2, 3, 4].map(slot => {
    const player = state.players.find(p => p.slot === slot);
    const card = node('article', '', `player${player ? '' : ' empty'}`);
    card.append(node('h3', `Joueur ${slot} · ${player ? 'connecté' : 'libre'}`));
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
el('rooms-export').onclick=()=>{
  if(!library)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(library,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='myroom-rooms.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
