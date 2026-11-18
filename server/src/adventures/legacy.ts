export const legacyAdventure={
  schemaVersion:1,id:'myroom-classic',version:'1.0.0',title:'MyRoom — Démonstration classique',description:'Le coffre existant suivi du blackjack historique à une carte.',
  players:{min:1,max:4,suggestedNames:[]},targetMinutes:15,
  instances:[
    {id:'chest',type:'symbol-chest',schemaVersion:1,config:{order:['sun','tree','moon','star'],hints:['Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières.','Pensez au soleil, à la forêt, à la nuit puis au ciel étoilé.'],rewards:[{id:'chest-opened',label:'Coffre ouvert'}]}},
    {id:'blackjack',type:'blackjack-legacy',schemaVersion:1,config:{}},
  ],
  steps:[{id:'symbols',title:'Le coffre des quatre symboles',narrative:'Retrouvez les quatre balises, puis entrez les symboles au panneau mural.',kind:'puzzle',instanceId:'chest',next:'blackjack'},
    {id:'blackjack',title:'La table du dernier As',narrative:'Complétez As + 6 avec une seule carte.',kind:'puzzle',instanceId:'blackjack',next:null}],
  objects:[...['chest','panel','sun','tree','moon','star'].map(id=>({instanceId:'chest',objectId:id,placementKey:id})),...['table','four','eight','king'].map(id=>({instanceId:'blackjack',objectId:id,placementKey:id}))],
  victory:{requiredSteps:['symbols','blackjack']},
};
