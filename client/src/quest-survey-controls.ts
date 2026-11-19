import type { MenuButton } from './portal/wall-menu-view';

export function useTouchOverlay(available:boolean,interactionMode:string|undefined){return available&&interactionMode!=='world-space';}

const targets=[['survey-new','Nouvelle pièce'],['survey-edit','Modifier la pièce'],['survey-close','Fermer le contour'],['survey-undo','Retirer le dernier point'],['survey-obstacle','Ajouter un obstacle'],['survey-save','Enregistrer et activer'],['survey-cancel','Annuler le brouillon']] as const;
export function surveyButtons(read:(id:string)=>{disabled:boolean},hasDraft:boolean):MenuButton[]{
  return [...targets.map(([id,title])=>({id,title,disabled:read(id).disabled})),
    {id:'return',title:hasDraft?'Annuler et revenir au jeu':'Revenir au jeu'},
    {id:'exit',title:'Quitter la réalité mixte'}];
}
export function runSurveyCommand(id:string,read:(id:string)=>{disabled:boolean;click:()=>void},back:()=>void,exit:()=>void){
  if(id==='exit'){exit();return;}
  if(id==='return'){const cancel=read('survey-cancel');if(cancel.disabled)return;cancel.click();back();return;}
  if(targets.some(([target])=>target===id)){const button=read(id);if(!button.disabled)button.click();}
}
