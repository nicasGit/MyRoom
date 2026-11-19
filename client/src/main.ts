import { ObstacleEditor } from './obstacle-editor';
import { MenuMover,MenuPointers,type MenuHand } from './xr-menu-interactions';
import { WallMenuView } from './portal/wall-menu-view';
import { surveyButtons,runSurveyCommand,useTouchOverlay } from './quest-survey-controls';
import { SimulatorScene } from './modes/simulator-scene';
import { DisplayClient } from './modes/display-client';
import { Virtual3D,CameraAR,QuestWebXR } from './modes/adapters';
import * as THREE from 'three';
import './install';
import { makeCalibration, toRoom, projectToFloor,nudgeCalibration } from './calibration';
import './style.css';
import { bindPress } from './press';
import { PlacementRequest } from './placement';
import { Survey } from './survey';
import { modelGroup, disposeGroup } from './model-view';
import { capturePlanes,captureMeshes,importSurfaces,QuestButtons } from './quest-scan';
import { AdventureClient } from './adventure-client';
import { adventureGroup,animateAdventure,applyObjectPoses } from './adventure-view';
import { GrabInputs,ObjectGrabber,nearGrabbable } from './object-grab';
import { HandCards } from './hand-cards';
import { InfoPanelAnchor } from './xr-info-panel';
import { PortalClient } from './portal/portal-client';
import { portalView } from './portal/portal-view';
import { XRHandsView } from './xr-hands-view';
import { phoneHand,usePhoneHand } from './phone-hand';
import { WallLobby } from './portal/wall-lobby';
import { handPreview } from './hand-preview';
import { PhoneControls } from './phone-controls';

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
diagnostic('Version client', '0.10.3');
handPreview(document.querySelector('main')!);
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
let baseCalibration: ReturnType<typeof makeCalibration> | undefined;
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
let currentXRSession:XRSession|undefined;
let resetScene = () => {};
let updateSurveyScene = () => {};
let updateAdventureScene = () => {};
const survey = new Survey(()=>calibration, message=>{feedback.textContent=message;}, ()=>updateSurveyScene(), ()=>{if(calibration)resetCalibration();}, (event,reason)=>xrEvent(event,{reason:reason.slice(0,160)}));
function calibrationMessage(text: string) {
  updateAdventureScene();
  calibrationStatus.textContent = text; instruction.textContent = text;
}
function resetCalibration() {
  grabber.cancel();handCards.cancel();
  firstPoint = undefined; calibration = undefined;baseCalibration=undefined;
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
const alignmentButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-align]'));
for(const button of alignmentButtons)button.onclick=()=>{
  if(!calibration||!baseCalibration||survey.hasDraft())return;
  const action=button.dataset.align!;
  if(action==='reset')calibration={...baseCalibration,origin:baseCalibration.origin.clone()};
  else{
    const offset=new THREE.Vector3(),step=action.endsWith('+')?0.05:-0.05;
    if(action.startsWith('x'))offset.x=step;
    else if(action.startsWith('y'))offset.y=step;
    else if(action.startsWith('z'))offset.z=step;
    calibration=nudgeCalibration(calibration,offset,action.startsWith('rotate')?(step>0?1:-1)*Math.PI/180:0);
  }
  survey.refresh();feedback.textContent='Alignement local ajusté. La pièce enregistrée reste inchangée.';
  xrEvent('calibration_adjusted',{reason:action});
};
overlay.addEventListener('beforexrselect', event => {
  // Touching a DOM control must not also place a point through the XR select event.
  if (event.target instanceof Element && event.target.closest('.xr-panel, .xr-phone-controls')) event.preventDefault();
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
      requiredFeatures: ['local-floor'], optionalFeatures: ['dom-overlay','plane-detection','mesh-detection','hand-tracking'], domOverlay: { root: overlay },
    });
    currentXRSession=session;
    const touchOverlay = useTouchOverlay(!!session.domOverlayState,session.interactionMode);
    adventure.setXRActive(true);
    xrEvent('session_started', { overlay: touchOverlay });
    diagnostic('Commandes tactiles DOM dans cette session', touchOverlay ? 'disponibles' : 'indisponibles ; sélection XR native si proposée par le navigateur');
    overlay.hidden = !touchOverlay;
    element('xr-exit').onclick = () => { void session?.end().catch(error => calibrationMessage(String(error))); };
    session.addEventListener('end', () => {
      grabber.cancel();handCards.cancel();
      adventure.setXRActive(false);
      xrEvent('session_ended');currentXRSession=undefined;
      renderer?.setAnimationLoop(null); resetCalibration(); enter.disabled = false;
      overlay.hidden = true; disposeScene(); resetScene = () => {};
      element('xr-exit').onclick = null; place.onclick = null;
      status.textContent = 'Session XR terminée.';displayClient.questEnded();
    });
    await renderer.xr.setSession(session);
    const reference = renderer.xr.getReferenceSpace();
    if (!reference) throw new Error('Référentiel XR indisponible');
    const scene = new THREE.Scene();
    scene.add(wallLobby.view.group);
    let gameGroup:THREE.Group|undefined;
    let gameKey='';
    updateAdventureScene=()=>{
      const view=adventure.viewState(),key=JSON.stringify([view?.model,view?.state.revision,portal.state?.revision,calibration,survey.hasDraft()]);
      if(key===gameKey&&gameGroup){applyObjectPoses(gameGroup,view?.state.objects);return;}
      const previousLid=gameGroup?.userData.lid as THREE.Group|undefined;
      const previousAngle=previousLid?.rotation.x,previousTarget=previousLid?.userData.targetAngle;
      if(gameGroup){disposeGroup(gameGroup);gameGroup=undefined;}
      if(!calibration||!view||survey.hasDraft()){gameKey='';return;}gameKey=key;
      gameGroup=portal.visible()&&portal.state?portalView(portal.state,ownSlot):adventureGroup(view.model,view.state,ownId);
      applyObjectPoses(gameGroup,view.state.objects);
      const lid=gameGroup.userData.lid as THREE.Group|undefined;
      if(lid&&previousAngle!==undefined&&previousTarget===lid.userData.targetAngle)lid.rotation.x=previousAngle;
      gameGroup.position.copy(calibration.origin);gameGroup.rotation.y=-calibration.yaw;scene.add(gameGroup);
    };
    const camera = new THREE.PerspectiveCamera();
    const grabInputs=new GrabInputs();
    const squeezeStart=(event:XRInputSourceEvent)=>grabInputs.squeeze(event.inputSource,true),squeezeEnd=(event:XRInputSourceEvent)=>grabInputs.squeeze(event.inputSource,false);
    const selectStart=(event:XRInputSourceEvent)=>grabInputs.select(event.inputSource,true),selectEnd=(event:XRInputSourceEvent)=>grabInputs.select(event.inputSource,false);
    session.addEventListener('selectstart',selectStart);session.addEventListener('selectend',selectEnd);
    session.addEventListener('squeezestart',squeezeStart);session.addEventListener('squeezeend',squeezeEnd);
    const rays:THREE.Line[]=[];
    for(let index=0;index<2;index++){
      const controller=renderer.xr.getController(index);
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-3)]),new THREE.LineBasicMaterial({color:0x67e8f9,depthTest:false,depthWrite:false}));
      line.renderOrder=2001;controller.add(line);scene.add(controller);rays.push(line);
    }
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
    const hudMaterial=new THREE.MeshBasicMaterial({map:hudTexture,side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false});
    const hud=new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.55),hudMaterial);hud.renderOrder=1000;hud.visible=!touchOverlay;scene.add(hud);
    const hudAnchor=new InfoPanelAnchor();
    const obstacleEditor=new ObstacleEditor((index,value)=>survey.updateObstacle(index,value),message=>{feedback.textContent=message;});scene.add(obstacleEditor.group);
    const menuMover=new MenuMover(),menuPointers=new MenuPointers();scene.add(menuPointers.group);
    const surveyMenu=new WallMenuView(true),surveyAnchor=new InfoPanelAnchor(-.95);surveyMenu.group.visible=false;scene.add(surveyMenu.group);let surveyMenuKey='';
    const handsView=new XRHandsView();scene.add(handsView.group);
    let menuRequested=false;
    const phoneControls=new PhoneControls(overlay,()=>{menuRequested=true;},{rooms:()=>wallLobby.setRoomMode(!wallLobby.roomMode),exit:()=>{void session?.end();}});
    const handDots=[0,1].map(()=>{const dot=new THREE.Mesh(new THREE.SphereGeometry(0.025,12,8),new THREE.MeshBasicMaterial({color:0x67e8f9,depthTest:false}));dot.renderOrder=1001;dot.visible=false;scene.add(dot);return dot;});
    let handStatus='';
    let hudKey='',lastScanUpdate=-Infinity;
    const questButtons=new QuestButtons();
    const updateScan=(frame:XRFrame,pose:XRViewerPose|null)=>{
      surveyMenu.group.visible=!touchOverlay&&!!calibration&&wallLobby.roomMode;
      if(surveyMenu.group.visible&&pose){
        surveyAnchor.place(surveyMenu.group,new THREE.Vector3().copy(pose.transform.position),new THREE.Quaternion().copy(pose.transform.orientation));
        const buttons=surveyButtons(id=>element(id) as HTMLButtonElement,survey.hasDraft()),lines=[survey.instruction,(element('survey-save-status').textContent??'').slice(0,72),(feedback.textContent??scanStatus.textContent??'').slice(0,150),'Viser un bouton puis utiliser la gâchette.'];
        const key=JSON.stringify([buttons,lines]);if(key!==surveyMenuKey){surveyMenuKey=key;surveyMenu.draw('Création de pièces',lines,buttons);}
      }
      if(!wallLobby.roomMode&&calibration){hud.visible=false;return;}
      for(const action of questButtons.poll(session!.inputSources)){
        if(action==='import')requestImport();
        else if(action==='save')survey.saveDraft();
        else survey.cancel();
      }
      if(performance.now()-lastScanUpdate>1000){
        lastScanUpdate=performance.now();
        const planes=frame.detectedPlanes,meshes=frame.detectedMeshes;
        const message=`${planes?.size??0} plans, ${meshes?.size??0} maillages expos\u00e9s. Configurez l'espace Quest ; import puis correction des meubles avant sauvegarde.`;
        if(scanStatus.textContent!==message){scanStatus.textContent=message;xrEvent('scan_status',{reason:message.slice(0,160)});}
        importButton.disabled=!calibration||!planes?.size;
      }
      if(importRequested){
        importRequested=false;clearTimeout(importTimeout);
        try{
          if(!calibration||!pose)throw new Error('Suivi ou calibrage indisponible. Réessayez sans vous recentrer.');
          const result=importSurfaces([...capturePlanes(frame,reference),...captureMeshes(frame,reference)],calibration,crypto.randomUUID());
          survey.importRoom(result.room);
          feedback.textContent=`Import : ${result.room.floor.length} coins, ${result.room.obstacles.length} meubles. ${result.warnings.join(' ')} Vérifiez avant d’enregistrer.`;
          xrEvent('scan_imported',{reason:feedback.textContent.slice(0,160)});
        }catch(error){feedback.textContent=String(error);xrEvent('scan_error',{reason:String(error).slice(0,160)});}
      }
      hud.visible=!touchOverlay&&!calibration;
      if(!touchOverlay&&pose){
        hudAnchor.place(hud,new THREE.Vector3().copy(pose.transform.position),new THREE.Quaternion().copy(pose.transform.orientation));
        const text=`MyRoom | ${calibration?'A/X importer · B enregistrer · Y annuler':'Gâchette : placer '+(firstPoint?'B':'A')+' au sol'}\n${handStatus}\n${(feedback.textContent??'').slice(0,180)}\n${(portal.story()||adventure.story()||scanStatus.textContent||'').slice(0,240)}`;
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
      updateAdventureScene();
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
    resetScene = () => { obstacleEditor.reset();hudAnchor.reset();surveyAnchor.reset();menuMover.reset();wallLobby.view.resetPlacement();surveyMenu.resetPlacement();markerA.visible = markerB.visible = target.visible = false; placement.cancel(); clearTimeout(placementTimer);importRequested=false;clearTimeout(importTimeout); };
    disposeScene = () => { obstacleEditor.dispose();menuMover.reset();menuPointers.dispose();surveyMenu.dispose();phoneControls.dispose();wallLobby.view.group.removeFromParent();overlay.classList.remove('xr-lobby-ready','xr-room-mode');grabber.cancel();handCards.cancel();session?.removeEventListener('selectstart',selectStart);session?.removeEventListener('selectend',selectEnd);session?.removeEventListener('squeezestart',squeezeStart);session?.removeEventListener('squeezeend',squeezeEnd);clearTimeout(placementTimer);clearTimeout(importTimeout);importButton.onclick=null;importButton.disabled=true;handsView.dispose();for(const dot of handDots){dot.geometry.dispose();dot.material.dispose();dot.removeFromParent();}hud.removeFromParent();hudTexture.dispose();hudMaterial.dispose();hud.geometry.dispose(); unbindPlace(); reference.removeEventListener('reset', resetCalibration); geometry.dispose(); target.geometry.dispose(); materialA.dispose(); materialB.dispose(); if(surveyGroup)disposeGroup(surveyGroup);if(gameGroup)disposeGroup(gameGroup);for(const ray of rays){ray.geometry.dispose();(ray.material as THREE.Material).dispose();ray.removeFromParent();}updateSurveyScene=()=>{};updateAdventureScene=()=>{}; };
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
          baseCalibration={...calibration,origin:calibration.origin.clone()};
          markerB.position.copy(point); markerB.visible = true;
          const roomPoint = toRoom(point, calibration);
          place.textContent = 'Calibrage terminé'; place.disabled = true;
          feedback.textContent = '✓ B placé. Calibrage terminé.';
          xrEvent('placement_accepted', { step: 'B', x: point.x, y: point.y, z: point.z });
          xrEvent('calibration_completed', { distance: calibration.distance });
          survey.refresh();if(!survey.current())wallLobby.setRoomMode(true);
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
      if(menuMover.blocksSelect()||obstacleEditor.holding)return;
      if(surveyMenu.group.visible){const ray=event.frame.getPose(event.inputSource.targetRaySpace,reference);if(ray){const origin=new THREE.Vector3().copy(ray.transform.position),direction=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation));if(surveyMenu.intersects(origin,direction)){const id=surveyMenu.pick(origin,direction);if(id)runSurveyCommand(id,key=>element(key) as HTMLButtonElement,()=>wallLobby.setRoomMode(false),()=>{void session?.end();});return;}}}
      if(calibration&&wallLobby.view.group.visible){const ray=event.frame.getPose(event.inputSource.targetRaySpace,reference);
        if(ray){const origin=new THREE.Vector3().copy(ray.transform.position),direction=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation));if(wallLobby.view.intersects(origin,direction)){wallLobby.pick(origin,direction);return;}}
      }
      if(grabber.blocksSelect()||handCards.blocksSelect())return;
      if(calibration&&!survey.collecting){
        if(gameGroup&&!survey.hasDraft()){
          const ray=event.frame.getPose(event.inputSource.targetRaySpace,reference),viewer=event.frame.getViewerPose(reference);
          adventure.updatePosition(viewer?new THREE.Vector3().copy(viewer.transform.position):undefined);
          if(ray&&portal.state?.active)portal.raycast(gameGroup,new THREE.Vector3().copy(ray.transform.position),new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation)),renderer!.xr.getCamera());
          else if(ray)adventure.raycast(gameGroup,new THREE.Vector3().copy(ray.transform.position),new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation)),renderer!.xr.getCamera());
        }
        return;
      }
      // Native screen selection is a fallback outside the panel; suppress duplicates.
      if (placement.pending || (event.inputSource.targetRayMode === 'screen' && performance.now() - lastPlacementPress < 700)) return;
      xrEvent('placement_requested', { step: firstPoint ? 'B' : 'A', reason: `xr_select_${event.inputSource.targetRayMode}` });
      const pose = event.frame.getPose(event.inputSource.targetRaySpace, reference);
      const point = pose && floorFromPose(pose);
      if (point) selectPoint(point);
      else rejectPlacement('Visez un repère au sol, à moins de 10 mètres.');
    });
    renderer.setAnimationLoop((_time, frame) => {
      const pose = frame?.getViewerPose(reference);
      if(!gameGroup&&calibration&&!survey.hasDraft())updateAdventureScene();
      adventure.updatePosition(pose&&!survey.hasDraft()?new THREE.Vector3().copy(pose.transform.position):undefined);
      if(gameGroup)applyObjectPoses(gameGroup,adventure.viewState()?.state.objects);
      portal.update(pose&&!survey.hasDraft()?new THREE.Vector3().copy(pose.transform.position):undefined);
      gameGroup?.userData.animatePortal?.(Date.now());
      const screenInput=session!.interactionMode==='screen-space';
      const hands=frame&&calibration&&!screenInput?grabInputs.read(frame,reference,session!.inputSources,calibration,portal.visible()&&!!portal.state?.active):[];
      const phoneAvailable=usePhoneHand(touchOverlay,session!.interactionMode,session!.inputSources);
      const phoneEnabled=phoneAvailable&&!!calibration&&!!pose&&!wallLobby.roomMode&&!survey.hasDraft()&&!hands.length;
      const context=!calibration?'Terminez le calibrage A/B.':socket?.readyState!==WebSocket.OPEN?'Serveur de jeu déconnecté : vérifiez la connexion.':!adventure.viewState()?'Aucune pièce active : ouvrez Pièces / Jeu.':wallLobby.roomMode?'Mode pièces actif : la prise est désactivée.':!pose?'Suivi AR indisponible.':!phoneAvailable?'Entrées suivies actives : utilisez la pince ou la poignée.':portal.visible()?'Accueil Vortex : regardez autour de vous pour trouver le panneau mural et votre bâton.':'Partie active : approchez la main de l’objet avant de prendre.';
      phoneControls.update(touchOverlay,phoneEnabled,!!calibration&&!!pose&&portal.visible(),context);
      wallLobby.tick(performance.now());
      if(calibration){wallLobby.view.group.position.copy(calibration.origin);wallLobby.view.group.rotation.y=-calibration.yaw;}
      wallLobby.view.group.visible=wallLobby.placed&&!!calibration&&portal.visible()&&!wallLobby.roomMode;
      overlay.classList.toggle('xr-lobby-ready',!!calibration);overlay.classList.toggle('xr-room-mode',wallLobby.roomMode);
      element('survey-panel').hidden=!calibration||!wallLobby.roomMode;if(surveyGroup)surveyGroup.visible=wallLobby.roomMode;if(gameGroup)gameGroup.visible=!wallLobby.roomMode;
      if(menuRequested&&pose){menuRequested=false;wallLobby.pick(new THREE.Vector3().copy(pose.transform.position),new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(pose.transform.orientation)));}
      handsView.update(frame,reference,session!.inputSources,hands.filter(h=>h.pressed).map(h=>h.side));
      if(phoneEnabled&&pose&&calibration){
        const orientation=new THREE.Quaternion().copy(pose.transform.orientation);
        const simulated=phoneHand(new THREE.Vector3().copy(pose.transform.position),orientation,calibration,phoneControls.pressed);
        hands.push(simulated.hand);handsView.simulateRight(simulated.local,orientation,phoneControls.pressed);
      }
      handStatus=calibration?`Prises : ${hands.length}/2 suivies, ${hands.filter(h=>h.pressed).length} fermées. Pince ou poignée latérale.`:'';
      handDots.forEach((dot,index)=>{const hand=hands[index];dot.visible=!!hand&&!!calibration&&!phoneEnabled;if(hand&&calibration){dot.position.copy(hand.position).applyAxisAngle(new THREE.Vector3(0,1,0),-calibration.yaw).add(calibration.origin);dot.material.color.setHex(hand.pressed?0xffd54f:0x67e8f9);}});
      const menuHands:MenuHand[]=[];
      if(frame&&calibration)for(const hand of hands){const source=hand.source??Array.from(session!.inputSources).find(source=>source.handedness===hand.side);if(!source)continue;const joint=source.hand?.get('wrist')??source.hand?.get('index-finger-tip');const grip=joint?frame.getJointPose?.(joint,reference):source.gripSpace?frame.getPose(source.gripSpace,reference):undefined;const ray=frame.getPose(source.targetRaySpace,reference);if(grip)menuHands.push({ray:ray&&!nearGrabbable(gameGroup,hand.position)?{origin:new THREE.Vector3().copy(ray.transform.position),direction:new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation))}:undefined,side:hand.side,pressed:grabInputs.isGripping(source),position:hand.position.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-calibration.yaw).add(calibration.origin),orientation:new THREE.Quaternion().copy(grip.transform.orientation)});}
      menuMover.update([wallLobby.view,surveyMenu],menuMover.holding||(!obstacleEditor.holding&&!grabber.blocksSelect()&&!handCards.blocksSelect())?menuHands:[]);
      if(calibration){obstacleEditor.group.position.copy(calibration.origin);obstacleEditor.group.rotation.y=-calibration.yaw;}
      obstacleEditor.update(wallLobby.roomMode&&pose&&!menuMover.holding?survey.editableObstacles:undefined,hands.map(h=>({...h,pressed:menuHands.some(m=>m.side===h.side&&m.pressed)})));
      surveyGroup?.traverse(node=>{if(Number.isInteger(node.userData.obstacleIndex))node.visible=node.userData.obstacleIndex!==obstacleEditor.index;});
      handCards.update(gameGroup,hands,adventure.viewState()?.state.hybrid,!!calibration&&!survey.hasDraft()&&!!pose&&!grabber.blocksSelect()&&!menuMover.holding);
      if(portal.visible()&&!portal.state?.active&&hands.some(hand=>hand.pressed))wallLobby.interactionNotice('Rituel arrêté : Accueil > Commencer le rituel, puis prenez votre bâton.');
      grabber.update(gameGroup,hands,!!calibration&&!survey.hasDraft()&&!!pose&&!menuMover.holding&&!handCards.blocksSelect()&&(!portal.visible()||!!portal.state?.active));
      adventure.updatePosition(pose&&!survey.hasDraft()?new THREE.Vector3().copy(pose.transform.position):undefined);
      if(gameGroup)animateAdventure(gameGroup,_time);
      if(frame)updateScan(frame,pose??null);
      const menuRays:{origin:THREE.Vector3;direction:THREE.Vector3}[]=[];if(frame)for(const source of Array.from(session!.inputSources)){const ray=frame.getPose(source.targetRaySpace,reference);if(ray)menuRays.push({origin:new THREE.Vector3().copy(ray.transform.position),direction:new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(ray.transform.orientation))});}menuPointers.update([wallLobby.view,surveyMenu],menuRays);
      if (frame) frameReceived = true;
      const point = pose && floorFromPose(pose);
      adventure.updateAim(point??undefined);
      const canPlace=!calibration||survey.collecting;
      element('xr-alignment').hidden=!calibration||!survey.current()||!wallLobby.roomMode;
      for(const button of alignmentButtons)button.disabled=survey.hasDraft();
      element('alignment-status').textContent=survey.hasDraft()?'Enregistrez ou annulez le brouillon avant de modifier l’alignement.':'Réglage fin local ; pour une dérive du suivi, refaites le calibrage A/B.';
      const preparing=!!adventure.viewState()?.model.puzzles&&!adventure.viewState()?.state.running&&!survey.hasDraft();
      const valid = !!point && (canPlace||preparing);
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
      target.visible = valid&&(canPlace||wallLobby.roomMode)&&!menuPointers.aiming;
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
    adventure.setXRActive(false);
    overlay.hidden = true;
    status.textContent = `Démarrage XR impossible : ${String(error)}`; enter.disabled = false;
  }
};

let ownId = '';
let revision = 0;
let socket: WebSocket;
const adventure=new AdventureClient(message=>{if(socket?.readyState!==WebSocket.OPEN)return false;socket.send(JSON.stringify(message));return true;},()=>calibration,()=>updateAdventureScene(),message=>{feedback.textContent=message;});
const grabber=new ObjectGrabber(()=>ownId,()=>adventure.viewState()?.state.objects,message=>{if(socket?.readyState!==WebSocket.OPEN)return false;socket.send(JSON.stringify(message));return true;},message=>{feedback.textContent=message;wallLobby.interactionNotice(message);});
const handCards=new HandCards(()=>ownId,action=>adventure.handAction(action),message=>{feedback.textContent=message;});
const portal=new PortalClient(message=>{if(socket?.readyState!==WebSocket.OPEN)return false;socket.send(JSON.stringify(message));return true;},()=>calibration,()=>updateAdventureScene(),message=>{feedback.textContent=message;});
const wallLobby=new WallLobby(message=>{feedback.textContent=message;},()=>{grabber.cancel();handCards.cancel();survey.refresh();},token=>survey.authorize(token));
document.addEventListener('myroom-portal-confirm',()=>portal.confirm());
const startQuest=enter.onclick!;
const simulator=new SimulatorScene(document.querySelector('main')!,{
  intro:()=>portal.visible(),wall:wallLobby.view.group,wallPick:(origin,direction)=>wallLobby.pick(origin,direction),
  position:position=>{adventure.updateVirtualPosition(position);portal.updateVirtual(position);wallLobby.tick(performance.now());},
  select:(group,origin,direction,camera)=>{if(portal.visible())portal.raycast(group,origin,direction,camera);else adventure.raycast(group,origin,direction,camera);},
  grab:(group,hands,enabled)=>grabber.update(group,hands,enabled),notify:message=>{status.textContent=message;},
});
const quest=new QuestWebXR(async()=>{await startQuest.call(enter,new PointerEvent('click'));if(!currentXRSession)throw Error('WebXR non actif.');},async()=>{if(currentXRSession)await currentXRSession.end();},()=>{status.textContent='Pour recentrer le Quest, refaites le calibrage A/B.';});
const cameraAR=new CameraAR(simulator,simulator.video,constraints=>{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera indisponible dans ce contexte HTTPS.');return navigator.mediaDevices.getUserMedia(constraints);},()=>displayClient.fallback('camera-failed'));
const displayClient=new DisplayClient(document.querySelector('main')!,{'virtual-3d':new Virtual3D(simulator),'camera-ar':cameraAR,'quest-webxr':quest},message=>{if(socket?.readyState!==WebSocket.OPEN)return false;socket.send(JSON.stringify(message));return true;},mode=>{grabber.cancel();handCards.cancel();adventure.setExternalActive(mode!=='quest-webxr');});
enter.onclick=async event=>{if(displayClient.current!=='quest-webxr'){displayClient.choose('quest-webxr');status.textContent='Choisissez WebXR, puis appuyez de nouveau pour entrer.';return;}await displayClient.activate();};
let ownSlot=0;
let retry: ReturnType<typeof setTimeout>;
function showPlayers(players: { id: string; slot: number;name?:string }[]) {
  element('players').replaceChildren(...[1, 2, 3, 4].map(slot => {
    const li = document.createElement('li');
    const player = players.find(p => p.slot === slot);
    li.textContent = player ? `${player.name??`Joueur ${slot}`} connecté${player.id === ownId ? ' (vous)' : ''}` : `Place ${slot} libre`;
    return li;
  }));
}
showPlayers([]);
const forgetSeat=document.createElement('button');forgetSeat.textContent='Rejoindre avec une nouvelle place';forgetSeat.hidden=true;status.after(forgetSeat);
forgetSeat.onclick=()=>{try{sessionStorage.removeItem('myroom-seat');}catch{}location.reload();};
function connect() {
  let resume='';try{resume=sessionStorage.getItem('myroom-seat')??'';}catch{}
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,resume?['myroom-resume.'+resume]:[]);
  socket.onopen = () => {
    adventure.setConnected(true);
    status.textContent = 'Connecté à la salle.';
    logStatus.textContent = 'Journal serveur connecté.';
    for (const message of xrQueue.splice(0)) socket.send(message);
  };
  socket.onmessage = event => {
    try {
      const message = JSON.parse(String(event.data));
      if (message.type === 'display_mode_result')displayClient.receive(message);
      if (message.type === 'welcome') {ownId = message.id;void displayClient.hello();adventure.setIdentity(message.id);try{if(message.resumeToken)sessionStorage.setItem('myroom-seat',message.resumeToken);}catch{}}
      if (message.type === 'adventure_result'||message.type==='puzzle_result') adventure.result(message.message);
      if(message.type==='object_result'&&!message.changed)grabber.reject(message.message);
      if (message.type === 'xr_ack') logStatus.textContent = `Journal serveur : ${message.event} reçu.`;
      if (message.type === 'state') {
        const debug=!!message.adminAccess?.debug;wallLobby.setDebug(debug);survey.setDebug(debug);survey.setSaveAccess(!!message.adminAccess?.roomSaveWithoutToken);adventure.setDebug(debug);
        ownSlot=message.players.find((p:{id:string;slot:number})=>p.id===ownId)?.slot??0;if(message.portal)portal.receive(message.portal,ownSlot,message.model??null,!!message.adventure?.engine.testStartStepId);
        showPlayers(message.players); revision = message.puzzle.revision;
        survey.receive(message.model??null,message.libraryRevision??0);
        if(message.adventure)adventure.receive(message.model??null,message.adventure,message.libraryRevision??0);
        if(message.lobby&&message.portal&&message.adventure)wallLobby.receive(message.model??null,message.portal,message.adventure,message.lobby);
        if(message.display)displayClient.receivePolicy(message.display.policy);
        if(message.portal&&message.adventure)simulator.receive({model:message.model??null,portal:message.portal,adventure:message.adventure,slot:ownSlot,actor:ownId});
        element('puzzle').textContent = `Démo : ${message.puzzle.solved ? 'résolue' : 'à résoudre'} · révision ${revision}`;
        solve.disabled = message.puzzle.solved;
      }
      if(message.type==='portal_result'&&!message.accepted)feedback.textContent=message.message;
      if (message.type === 'error') status.textContent = message.message;
    } catch { status.textContent = 'Réponse serveur invalide.'; }
  };
  socket.onclose = event => {
    displayClient.disconnect();
      portal.update(undefined);grabber.cancel();handCards.cancel();
    adventure.setConnected(false);
    solve.disabled = true; showPlayers([]);
    logStatus.textContent = 'Journal serveur déconnecté. Les prochains événements restent en attente.';
    forgetSeat.hidden=event.code!==1008;
    status.textContent = event.code === 1008 ? event.reason : 'Déconnecté. Reconnexion dans 2 secondes…';
    if (event.code !== 1008) retry = setTimeout(connect, 2000);
  };
  socket.onerror = () => { status.textContent = 'Connexion WebSocket indisponible.'; };
}
solve.onclick = () => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'solve', revision })); };
window.addEventListener('pagehide', () => { clearTimeout(retry); socket.onclose = null; socket.close(); });
connect();
