import { DEFAULT_PORTAL } from '../portal/portal-types.js';
// Version 0.1.0 remains readable for existing snapshots; 0.2.0 is the playable Phase 2.
export const menthe27={
  schemaVersion:1,id:'menthe27',version:'0.1.0',title:'Opération Menthe 27',description:'Prototype Phase 1 : le coffre ouvre l’accès à une étape de blackjack hybride encore indisponible. Cette version ne constitue pas l’aventure complète.',
  players:{min:4,max:4,suggestedNames:['Léon','Reno','Fabien','Nicolas']},targetMinutes:60,
  instances:[{id:'menthe-chest',type:'symbol-chest',schemaVersion:1,config:{order:['sun','tree','moon','star'],hints:['Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières.','Le soleil précède l’arbre, puis la lune précède l’étoile.'],rewards:[{id:'casino-access',label:'Accès au casino'}]}}],
  steps:[{id:'symbols',title:'Le coffre des quatre symboles',narrative:'Le coffre garde le premier accès d’Opération Menthe 27. Retrouvez les symboles pour avancer.',kind:'puzzle',instanceId:'menthe-chest',next:'casino'},
    {id:'casino',title:'Blackjack hybride — Phase 2 à valider',narrative:'Le coffre est ouvert. Les trois manches du casino seront ajoutées après validation de la Phase 1.',kind:'planned',puzzleType:'blackjack-hybrid',next:null}],
  objects:['chest','panel','sun','tree','moon','star'].map(id=>({instanceId:'menthe-chest',objectId:id,placementKey:id})),
  victory:{requiredSteps:['symbols','casino']},
};
export const menthe27Hybrid={
  ...structuredClone(menthe27),version:'0.2.0',description:'Le coffre puis trois manches de blackjack coopératif. La suite de l’opération reste en préparation.',
  instances:[...structuredClone(menthe27.instances),{id:'menthe-blackjack',type:'blackjack-hybrid',schemaVersion:1,config:{
    rewards:[{id:'casino-club',label:'♣'},{id:'casino-heart',label:'♥'},{id:'casino-spade',label:'♠'}],
    hints:['Casino : l’As vaut 1 ou 11 ; le croupier reste à 17, même souple.','Après trois échecs, la main de rattrapage se gagne en restant à 19.','Double as : les trois cartes doivent occuper les trois logements.','Les deux As doivent avoir des valeurs différentes : 11 et 1.','Croupier impossible : trois cartes exactement, le croupier a 20.','Associez 10♥, 8♣ et 3♠ pour obtenir 21.'],
  }}],
  steps:[structuredClone(menthe27.steps[0]),{id:'casino',title:'Blackjack hybride — trois manches',narrative:'La table du casino attend l’équipe. Le capitaine distribue la main commune.',kind:'puzzle',instanceId:'menthe-blackjack',next:'videoclub'},
    {id:'videoclub',title:'Prochaine étape — Vidéoclub rétro',narrative:'♣ ♥ ♠ sont acquis. Le Vidéoclub rétro attend sa préparation ; l’opération n’est pas terminée.',kind:'planned',puzzleType:'retro-videoclub',next:null}],
  objects:[...structuredClone(menthe27.objects),{instanceId:'menthe-blackjack',objectId:'table',placementKey:'table'}],
  victory:{requiredSteps:['symbols','casino','videoclub']},
};

export const menthe27Portal={...structuredClone(menthe27Hybrid),version:'0.3.0',introduction:{type:'team-portal',schemaVersion:1,config:structuredClone(DEFAULT_PORTAL)}};
