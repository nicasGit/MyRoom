import * as THREE from 'three';
import { makeCalibration, toRoom } from './calibration';
import './style.css';

function element<T extends HTMLElement>(id: string) { return document.getElementById(id) as T; }
const enter = element<HTMLButtonElement>('enter');
const solve = element<HTMLButtonElement>('solve');
const status = element('status');
const diagnostics = element('diagnostics');
function diagnostic(label: string, value: string) {
  const li = document.createElement('li'); li.textContent = `${label} : ${value}`; diagnostics.append(li);
}
diagnostic('Contexte sécurisé HTTPS / localhost', String(window.isSecureContext));
diagnostic('API WebXR', navigator.xr ? 'disponible' : 'absente');
async function checkXR() {
  try {
    const supported = await navigator.xr?.isSessionSupported('immersive-ar') ?? false;
    diagnostic('immersive-ar', supported ? 'disponible' : 'indisponible');
    enter.disabled = !supported;
  } catch (error) { diagnostic('Erreur de détection', String(error)); }
}
void checkXR();
navigator.xr?.addEventListener('devicechange', () => { void checkXR(); });

let renderer: THREE.WebGLRenderer | undefined;
let calibration: ReturnType<typeof makeCalibration> | undefined;
let firstPoint: THREE.Vector3 | undefined;
const calibrationStatus = element('calibration');
function resetCalibration() {
  firstPoint = undefined; calibration = undefined;
  calibrationStatus.textContent = 'Non calibré : sélectionner A puis B avec la gâchette.';
}
element('reset').onclick = resetCalibration;
enter.onclick = async () => {
  if (!navigator.xr) return;
  enter.disabled = true;
  let session: XRSession | undefined;
  try {
    renderer ??= new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setSize(640, 360);
    if (!renderer.domElement.isConnected) document.body.append(renderer.domElement);
    session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor'] });
    session.addEventListener('end', () => {
      renderer?.setAnimationLoop(null); resetCalibration(); enter.disabled = false;
      status.textContent = 'Session XR terminée.';
    });
    await renderer.xr.setSession(session);
    const reference = renderer.xr.getReferenceSpace();
    if (!reference) throw new Error('Référentiel XR indisponible');
    reference.addEventListener('reset', resetCalibration);
    resetCalibration();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    marker.visible = false; scene.add(marker);
    session.addEventListener('select', event => {
      const pose = event.frame.getPose(event.inputSource.targetRaySpace, reference);
      if (!pose) return;
      const origin = new THREE.Vector3().copy(pose.transform.position);
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().copy(pose.transform.orientation));
      if (direction.y >= -0.05) { calibrationStatus.textContent = 'Visez un repère au sol.'; return; }
      const point = origin.clone().addScaledVector(direction, -origin.y / direction.y);
      if (origin.y <= 0 || origin.distanceTo(point) > 10) return;
      marker.position.copy(point); marker.visible = true;
      if (!firstPoint || calibration) {
        calibration = undefined; firstPoint = point;
        calibrationStatus.textContent = 'A enregistré. Sélectionnez B.';
      } else {
        try {
          calibration = makeCalibration(firstPoint, point);
          const roomPoint = toRoom(point, calibration);
          calibrationStatus.textContent = `Calibré : A → B = ${calibration.distance.toFixed(2)} m ; B dans la pièce = (${roomPoint.x.toFixed(2)}, ${roomPoint.z.toFixed(2)}).`;
        } catch (error) { calibrationStatus.textContent = String(error); }
      }
    });
    renderer.setAnimationLoop(() => renderer!.render(scene, camera));
    status.textContent = 'Session immersive-ar active. Utilisez la gâchette pour calibrer.';
  } catch (error) {
    if (session) await session.end().catch(() => {});
    status.textContent = `Démarrage XR impossible : ${String(error)}`; enter.disabled = false;
  }
};

let ownId = '';
let revision = 0;
let socket: WebSocket;
let retry: ReturnType<typeof setTimeout>;
function showPlayers(players: { id: string; slot: number }[]) {
  element('players').replaceChildren(...[1, 2, 3, 4].map(slot => {
    const li = document.createElement('li');
    const player = players.find(p => p.slot === slot);
    li.textContent = player ? `Joueur ${slot} connecté${player.id === ownId ? ' (vous)' : ''}` : `Place ${slot} libre`;
    return li;
  }));
}
showPlayers([]);
function connect() {
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  socket.onopen = () => { status.textContent = 'Connecté à la salle.'; };
  socket.onmessage = event => {
    try {
      const message = JSON.parse(String(event.data));
      if (message.type === 'welcome') ownId = message.id;
      if (message.type === 'state') {
        showPlayers(message.players); revision = message.puzzle.revision;
        element('puzzle').textContent = `Démo : ${message.puzzle.solved ? 'résolue' : 'à résoudre'} · révision ${revision}`;
        solve.disabled = message.puzzle.solved;
      }
      if (message.type === 'error') status.textContent = message.message;
    } catch { status.textContent = 'Réponse serveur invalide.'; }
  };
  socket.onclose = event => {
    solve.disabled = true; showPlayers([]);
    status.textContent = event.code === 1008 ? event.reason : 'Déconnecté. Reconnexion dans 2 secondes…';
    if (event.code !== 1008) retry = setTimeout(connect, 2000);
  };
  socket.onerror = () => { status.textContent = 'Connexion WebSocket indisponible.'; };
}
solve.onclick = () => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'solve', revision })); };
window.addEventListener('pagehide', () => { clearTimeout(retry); socket.onclose = null; socket.close(); });
connect();
