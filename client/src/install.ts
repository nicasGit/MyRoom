export {};
interface InstallPrompt extends Event {
  prompt():Promise<void>;
  userChoice:Promise<{outcome:'accepted'|'dismissed'}>;
}
const button=document.getElementById('install-app') as HTMLButtonElement;
const status=document.getElementById('install-status')!;
const standalone=window.matchMedia('(display-mode: standalone)');
let pending:InstallPrompt|undefined;
let installed=false;
const inApp=()=>standalone.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
function refresh(){
  button.hidden=!pending||installed||inApp();
  if(inApp())status.textContent='MyRoom est ouverte en mode application. Le serveur reste nécessaire.';
  else if(installed)status.textContent='MyRoom est installée. Ouvrez-la depuis son icône sur votre téléphone.';
  else if(!window.isSecureContext)status.textContent='Pour installer MyRoom sur le téléphone, ouvrez son adresse HTTPS avec un certificat reconnu.';
  else if(pending)status.textContent='MyRoom peut être installée sur cet appareil.';
  else status.textContent='Dans Chrome Android : menu ⋮ → Installer l’application ou Ajouter à l’écran d’accueil, si proposé. Si MyRoom est déjà installée, ouvrez son icône.';
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();pending=event as InstallPrompt;refresh();
});
window.addEventListener('appinstalled',()=>{installed=true;pending=undefined;refresh();});
standalone.addEventListener('change',refresh);
button.onclick=async()=>{
  const request=pending;if(!request)return;
  pending=undefined;button.hidden=true;
  try{
    await request.prompt();
    const choice=await request.userChoice;
    // Acceptance is not confirmation that installation has completed.
    if(!installed&&!inApp())status.textContent=choice.outcome==='accepted'?'Installation demandée. Attendez la confirmation de Chrome.':'Installation annulée. Vous pouvez la relancer depuis le menu Chrome.';
  }catch{
    if(!installed&&!inApp())status.textContent='Installation indisponible pour le moment. Essayez depuis le menu Chrome.';
  }
};
refresh();
