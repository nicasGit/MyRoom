import * as THREE from 'three';
import './install';
import { makeCalibration, toRoom, projectToFloor } from './calibration';
import './style.css';
import { bindPress } from './press';
import { PlacementRequest } from './placement';
import { Survey } from './survey';
import { modelGroup, disposeGroup } from './model-view';
import { capturePlanes,importSurfaces,QuestButtons } from './quest-scan';

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
diagnostic('Version client', '0.3.2');
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
const overlay = element('xr-overlay');
const instruction = element('xr-instruction');
const place = element<HTMLButtonElement>('xr-place');
const feedback = element('xr-feedback');
const logStatus = element('xr-log-status');
const xrQueue: string[] = [];
function xrEvent(event: string, details: Record<string, unknown> = {}) {
  const message = JSON.stringify({ type: 'xr_event', event, details });
  console.info('[MyRoom XR]', event, details);
  if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
    socket.send(message); logStatus.textContent = `Journal serveur : envoi de ${event}…`;
  } else {
    if (xrQueue.length === 20) xrQueue.shift();
    xrQueue.push(message); logStatus.textContent = 'Journal serveur hors ligne : événements en attente de connexion.';
  }
}
function rejectPlacement(reason: string, details: Record<string, unknown> = {}) {
  feedback.textContent = reason;
  xrEvent('placement_rejected', { step: firstPoint ? 'B' : 'A', reason: reason.slice(0, 160), ...details });
}
let resetScene = () => {};
let updateSurveyScene = () => {};
const survey = new Survey(()=>calibration, message=>{feedback.textContent=message;}, ()=>updateSurveyScene(), ()=>{if(calibration)resetCalibration();});
function calibrationMessage(text: string) {
  calibrationStatus.textContent = text; instruction.textContent = text;
}
function resetCalibration() {
  firstPoint = undefined; calibration = undefined;
  place.textContent = 'Placer A'; place.disabled = false;
  resetScene();
  survey.cancel(); survey.refresh();
  overlay.classList.remove('xr-tracking-valid');
  place.hidden = false;
  feedback.textContent = 'En attente d’un appui sur Placer A.';
  xrEvent('calibration_reset');
  calibrationMessage('Visez le repère A au sol : centre de l’écran + bouton Placer A, ou gâchette du contrôleur.');
}
element('reset').onclick = resetCalibration;
element('xr-reset').onclick = resetCalibration;
overlay.addEventListener('beforexrselect', event => {
  // Touching a DOM control must not also place a point through the XR select event.
  if (event.target instanceof Element && event.target.closest('.xr-panel')) event.preventDefault();
});
enter.onclick = async () => {
  if (!navigator.xr) return;
  enter.disabled = true;
  xrEvent('session_requested');
  let session: XRSession | undefined;
  let disposeScene = () => {};
  try {
    renderer ??= new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setSize(640, 360);
    if (!renderer.domElement.isConnected) document.body.append(renderer.domElement);
    overlay.hidden = false;
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor'], optionalFeatures: ['dom-overlay','plane-detection'], domOverlay: { root: overlay },
    });
    const touchOverlay = !!session.domOverlayState;
    xrEvent('session_started', { overlay: touchOverlay });
    diagnostic('Commandes tactiles DOM dans cette session', touchOverlay ? 'disponibles' : 'indisponibles ; sélection XR native si proposée par le navigateur');
    overlay.hidden = !touchOverlay;
    element('xr-exit').onclick = () => { void session?.end().catch(error => calibrationMessage(String(error))); };
    session.addEventListener('end', () => {
      xrEvent('session_ended');
      renderer?.setAnimationLoop(null); resetCalibration(); enter.disabled = false;
      overlay.hidden = true; disposeScene(); resetScene = () => {};
      element('xr-exit').onclick = null; place.onclick = null;
      status.textContent = 'Session XR terminée.';
    });
    await renderer.xr.setSession(session);
    const reference = renderer.xr.getReferenceSpace();
    if (!reference) throw new Error('Référentiel XR indisponible');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const scanStatus=element('quest-scan-status'),importButton=element<HTMLButtonElement>('quest-import');
    let importRequested=false,importTimeout:ReturnType<typeof setTimeout>|undefined;
    const requestImport=()=>{
      if(!calibration){feedback.textContent='Terminez A/B avant l’import.';return;}
      if(importRequested)return;
      importRequested=true;feedback.textContent='Lecture des surfaces dans la prochaine image XR…';
      importTimeout=setTimeout(()=>{if(importRequested){importRequested=false;feedback.textContent='Import annulé : aucune image XR active. Revenez à la session et réessayez.';}},3000);
    };
    importButton.onclick=requestImport;
    // Headset-readable feedback also works when DOM Overlay is unavailable.
    const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=512;
    const hudContext=hudCanvas.getContext('2d')!;
    const hudTexture=new THREE.CanvasTexture(hudCanvas);
    const hudMaterial=new THREE.SpriteMaterial({map:hudTexture,depthTest:false,depthWrite:false});
    const hud=new THREE.Sprite(hudMaterial);hud.scale.set(0.9,0.45,1);hud.renderOrder=1000;hud.visible=!touchOverlay;scene.add(hud);
    let hudKey='',lastScanUpdate=-Infinity;
    const questButtons=new QuestButtons();
    const updateScan=(frame:XRFrame,pose:XRViewerPose|null)=>{
      for(const action of questButtons.poll(session!.inputSources)){
        if(action==='import')requestImport();
        else if(action==='save')survey.saveDraft();
        else survey.cancel();
      }
      if(performance.now()-lastScanUpdate>1000){
        lastScanUpdate=performance.now();
        const planes=frame.detectedPlanes;
        const message=planes===undefined?'Plans WebXR indisponibles dans cette session : relevé manuel disponible.':`${planes.size} surface(s) détectée(s). Configurez l’espace du Quest si la liste reste vide.`;
        if(scanStatus.textContent!==message){scanStatus.textContent=message;xrEvent('scan_status',{reason:message.slice(0,160)});}
        importButton.disabled=!calibration||!planes?.size;
      }
      if(importRequested){
        importRequested=false;clearTimeout(importTimeout);
        try{
          if(!calibration||!pose)throw new Error('Suivi ou calibrage indisponible. Réessayez sans vous recentrer.');
          const result=importSurfaces(capturePlanes(frame,reference),calibration,crypto.randomUUID());
          survey.importRoom(result.room);
          feedback.textContent=`Import : ${result.room.floor.length} coins, ${result.room.obstacles.length} meubles. ${result.warnings.join(' ')} Vérifiez avant d’enregistrer.`;
          xrEvent('scan_imported',{reason:feedback.textContent.slice(0,160)});
        }catch(error){feedback.textContent=String(error);xrEvent('scan_error',{reason:String(error).slice(0,160)});}
      }
      if(!touchOverlay&&pose){
        hud.position.set(0,0.32,-1.2).applyQuaternion(new THREE.Quaternion().copy(pose.transform.orientation)).add(new THREE.Vector3().copy(pose.transform.position));
        const text=`MyRoom | ${calibration?'A/X importer · B enregistrer · Y annuler':'Gâchette : placer '+(firstPoint?'B':'A')+' au sol'}\n${scanStatus.textContent}\n${feedback.textContent}`;
        if(text!==hudKey){
          hudKey=text;hudContext.fillStyle='rgba(9,20,34,0.94)';hudContext.fillRect(0,0,1024,512);hudContext.fillStyle='#ffffff';hudContext.font='30px sans-serif';
          let y=42;for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(' ')){if(hudContext.measureText(line+word).width>970){hudContext.fillText(line,24,y);y+=38;line='';}line+=word+' ';}hudContext.fillText(line,24,y);y+=45;}
          hudTexture.needsUpdate=true;
        }
      }
    };
    const geometry = new THREE.SphereGeometry(0.04);
    const materialA = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const materialB = new THREE.MeshBasicMaterial({ color: 0xa7f3a0 });
    const markerA = new THREE.Mesh(geometry, materialA);
    const markerB = new THREE.Mesh(geometry, materialB);
    const target = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.055, 24), materialA);
    target.rotation.x = -Math.PI / 2;
    scene.add(markerA, markerB, target);
    let surveyGroup:THREE.Group|undefined;
    let surveyKey='';
    updateSurveyScene=()=> {
      const model=survey.current();
      const key=JSON.stringify({model,calibration,closed:survey.closed(),corner:survey.pendingCorner()});
      if(key===surveyKey)return;surveyKey=key;
      if(surveyGroup){disposeGroup(surveyGroup);surveyGroup=undefined;}
      if(!calibration||!model)return;
      surveyGroup=modelGroup(model,survey.closed());
      const corner=survey.pendingCorner();
      if(corner){
        const marker=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),new THREE.MeshBasicMaterial({color:0xffbd73}));
        marker.position.set(corner.x,0.05,corner.z);surveyGroup.add(marker);
      }
      surveyGroup.position.copy(calibration.origin);surveyGroup.rotation.y=-calibration.yaw;scene.add(surveyGroup);
    };
    const placement = new PlacementRequest<THREE.Vector3>();
    let lastPlacementPress = -Infinity;
    let lastTrackingReason = 'Aucune position XR reçue.';
    let frameReceived = false;
    let placementTimer: ReturnType<typeof setTimeout> | undefined;
    let unbindPlace = () => {};
    resetScene = () => { markerA.visible = markerB.visible = target.visible = false; placement.cancel(); clearTimeout(placementTimer);importRequested=false;clearTimeout(importTimeout); };
    disposeScene = () => { clearTimeout(placementTimer);clearTimeout(importTimeout);importButton.onclick=null;importButton.disabled=true;hudTexture.dispose();hudMaterial.dispose();hud.geometry.dispose(); unbindPlace(); reference.removeEventListener('reset', resetCalibration); geometry.dispose(); target.geometry.dispose(); materialA.dispose(); materialB.dispose(); if(surveyGroup)disposeGroup(surveyGroup);updateSurveyScene=()=>{}; };
    reference.addEventListener('reset', resetCalibration);
    resetCalibration();
    function selectPoint(point: THREE.Vector3) {
      if (calibration) {survey.add(point);return;}
      if (!firstPoint) {
        firstPoint = point.clone(); markerA.position.copy(point); markerA.visible = true;
        place.textContent = 'Placer B';
        feedback.textContent = '✓ A placé. Passez au repère B.';
        xrEvent('placement_accepted', { step: 'A', x: point.x, y: point.y, z: point.z });
        calibrationMessage('A enregistré (bleu). Visez le repère B au sol, à au moins 50 cm, puis placez B.');
      } else {
        try {
          calibration = makeCalibration(firstPoint, point);
          markerB.position.copy(point); markerB.visible = true;
          const roomPoint = toRoom(point, calibration);
          place.textContent = 'Calibrage terminé'; place.disabled = true;
          feedback.textContent = '✓ B placé. Calibrage terminé.';
          xrEvent('placement_accepted', { step: 'B', x: point.x, y: point.y, z: point.z });
          xrEvent('calibration_completed', { distance: calibration.distance });
          survey.refresh();
          calibrationMessage(`Calibré : A → B = ${calibration.distance.toFixed(2)} m ; B dans la pièce = (${roomPoint.x.toFixed(2)}, ${roomPoint.z.toFixed(2)}). Recommencez pour changer les repères.`);
        } catch (error) { rejectPlacement(`${String(error)} Visez B plus loin de A.`); }
      }
    }
    function floorFromPose(pose: XRPose) {
      return projectToFloor(new THREE.Vector3().copy(pose.transform.position), new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().copy(pose.transform.orientation)));
    }
    unbindPlace = bindPress(place, () => {
      if ((calibration&&!survey.collecting) || placement.pending) return;
      lastPlacementPress = performance.now();
      feedback.textContent = `Appui reçu : ${calibration?survey.label:firstPoint?'B':'A'}. Maintenez la visée (1,5 s)…`;
      xrEvent('placement_requested', { step: firstPoint ? 'B' : 'A', reason:calibration?survey.label:'calibration' });
      frameReceived = false;
      const immediate = placement.request();
      if (immediate) { selectPoint(immediate); return; }
      placementTimer = setTimeout(() => {
        if (!placement.pending) return;
        placement.cancel();
        feedback.textContent = frameReceived ? `Placement annulé : ${lastTrackingReason} Réessayez lorsque le viseur est vert.` : 'Aucune image XR reçue. Revenez à la session AR active et réessayez.';
        xrEvent('placement_timeout', { step: firstPoint ? 'B' : 'A', reason: frameReceived ? lastTrackingReason.slice(0, 160) : 'no_xr_frame' });
      }, 1500);
    });
    session.addEventListener('select', event => {
      if (calibration&&!survey.collecting) return;
      // Native screen selection is a fallback outside the panel; suppress duplicates.
      if (placement.pending || (event.inputSource.targetRayMode === 'screen' && performance.now() - lastPlacementPress < 700)) return;
      xrEvent('placement_requested', { step: firstPoint ? 'B' : 'A', reason: `xr_select_${event.inputSource.targetRayMode}` });
      const pose = event.frame.getPose(event.inputSource.targetRaySpace, reference);
      const point = pose && floorFromPose(pose);
      if (point) selectPoint(point);
      else rejectPlacement('Visez un repère au sol, à moins de 10 mètres.');
    });
    let trackingReason = '';
    let trackingLoggedAt = -Infinity;
    renderer.setAnimationLoop((_time, frame) => {
      const pose = frame?.getViewerPose(reference);
      if(frame)updateScan(frame,pose??null);
      if (frame) frameReceived = true;
      const point = pose && floorFromPose(pose);
      const canPlace=!calibration||survey.collecting;
      const valid = !!point && canPlace;
      // Invalid tracking must still allow a press and an explanation.
      // Keep the touched button in the layout through pointerup. Removing it after
      // pointerdown on B can move the exit button underneath the finger.
      place.hidden = false; place.disabled = !canPlace;
      if(calibration)place.textContent=survey.collecting?survey.label:'Calibrage terminé';
      const reason = !pose ? 'Suivi AR indisponible. Déplacez doucement le téléphone.'
        : pose.transform.position.y <= 0 ? 'La caméra est au niveau ou sous le sol (hauteur ≤ 0). Recommencez la session pour rétablir le sol local.'
        : !point ? 'Visez vers le sol, à moins de 10 mètres ; évitez de viser à l’horizontale.' : 'Visée valide : vous pouvez placer le repère.';
      lastTrackingReason = reason;
      overlay.classList.toggle('xr-tracking-valid', valid);
      if (reason !== trackingReason && performance.now() - trackingLoggedAt >= 2000) {
        trackingReason = reason; trackingLoggedAt = performance.now();
        xrEvent('tracking_changed', { reason: reason.slice(0, 160), ...(pose ? { viewerHeight: pose.transform.position.y } : {}) });
      }
      target.visible = valid;
      if (point) target.position.copy(point).setY(0.005);
      const ready = placement.update(point?.clone());
      if (ready && canPlace) {
        clearTimeout(placementTimer);
        selectPoint(ready);
      }
      if (!point && !calibration) instruction.textContent = reason;
      else instruction.textContent = calibration?survey.instruction:calibrationStatus.textContent;
      renderer!.render(scene, camera);
    });
    status.textContent = touchOverlay ? 'Session AR active : visez au centre puis utilisez Placer A / Placer B.' : 'Session AR active : gâchette ou sélection tactile XR native si disponible. Commandes DOM indisponibles.';
  } catch (error) {
    xrEvent('session_error', { reason: String(error).slice(0, 160) });
    if (session) await session.end().catch(() => {});
    overlay.hidden = true;
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
  socket.onopen = () => {
    status.textContent = 'Connecté à la salle.';
    logStatus.textContent = 'Journal serveur connecté.';
    for (const message of xrQueue.splice(0)) socket.send(message);
  };
  socket.onmessage = event => {
    try {
      const message = JSON.parse(String(event.data));
      if (message.type === 'welcome') ownId = message.id;
      if (message.type === 'xr_ack') logStatus.textContent = `Journal serveur : ${message.event} reçu.`;
      if (message.type === 'state') {
        showPlayers(message.players); revision = message.puzzle.revision;
        survey.receive(message.model??null,message.libraryRevision??0);
        element('puzzle').textContent = `Démo : ${message.puzzle.solved ? 'résolue' : 'à résoudre'} · révision ${revision}`;
        solve.disabled = message.puzzle.solved;
      }
      if (message.type === 'error') status.textContent = message.message;
    } catch { status.textContent = 'Réponse serveur invalide.'; }
  };
  socket.onclose = event => {
    solve.disabled = true; showPlayers([]);
    logStatus.textContent = 'Journal serveur déconnecté. Les prochains événements restent en attente.';
    status.textContent = event.code === 1008 ? event.reason : 'Déconnecté. Reconnexion dans 2 secondes…';
    if (event.code !== 1008) retry = setTimeout(connect, 2000);
  };
  socket.onerror = () => { status.textContent = 'Connexion WebSocket indisponible.'; };
}
solve.onclick = () => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'solve', revision })); };
window.addEventListener('pagehide', () => { clearTimeout(retry); socket.onclose = null; socket.close(); });
connect();
