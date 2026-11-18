// Scenario data only. blackjack-hybrid remains a planned step until Phase 2 is approved.
export const menthe27={
  schemaVersion:1,id:'menthe27',version:'0.1.0',title:'Opération Menthe 27',description:'Prototype Phase 1 : le coffre ouvre l’accès à une étape de blackjack hybride encore indisponible. Cette version ne constitue pas l’aventure complète.',
  players:{min:4,max:4,suggestedNames:['Léon','Reno','Fabien','Nicolas']},targetMinutes:60,
  instances:[{id:'menthe-chest',type:'symbol-chest',schemaVersion:1,config:{order:['sun','tree','moon','star'],hints:['Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières.','Le soleil précède l’arbre, puis la lune précède l’étoile.'],rewards:[{id:'casino-access',label:'Accès au casino'}]}}],
  steps:[{id:'symbols',title:'Le coffre des quatre symboles',narrative:'Le coffre garde le premier accès d’Opération Menthe 27. Retrouvez les symboles pour avancer.',kind:'puzzle',instanceId:'menthe-chest',next:'casino'},
    {id:'casino',title:'Blackjack hybride — Phase 2 à valider',narrative:'Le coffre est ouvert. Les trois manches du casino seront ajoutées après validation de la Phase 1.',kind:'planned',puzzleType:'blackjack-hybrid',next:null}],
  objects:['chest','panel','sun','tree','moon','star'].map(id=>({instanceId:'menthe-chest',objectId:id,placementKey:id})),
  victory:{requiredSteps:['symbols','casino']},
};
