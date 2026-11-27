import { DEFAULT_PORTAL } from '../portal/portal-types.js';

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
  instances:[{...structuredClone(menthe27.instances[0]),config:{...structuredClone(menthe27.instances[0].config),clues:[{id:'clue-sun',text:'Le fragment doré indique le premier symbole.',truth:true},{id:'clue-tree',text:'Le fragment gravé indique le deuxième symbole.',truth:true},{id:'clue-moon',text:'Le fragment argenté indique le troisième symbole.',truth:true},{id:'clue-star',text:'Le fragment brillant indique le dernier symbole.',truth:true},{id:'clue-false',text:'Fausse piste : commencez par la dernière lumière.',truth:false}]}},{id:'menthe-blackjack',type:'blackjack-hybrid',schemaVersion:1,config:{hints:['Casino : l’As vaut 1 ou 11 ; le croupier reste à 17, même souple.','Après trois échecs, la main de rattrapage se gagne en restant à 19.','Double as : les trois cartes doivent occuper les trois logements.','Les deux As doivent avoir des valeurs différentes : 11 et 1.','Croupier impossible : trois cartes exactement, le croupier a 20.','Associez 10♥, 8♣ et 3♠ pour obtenir 21.'],rewards:[{id:'casino-club',label:'♣'},{id:'casino-heart',label:'♥'},{id:'casino-spade',label:'♠'}]}}],
  steps:[structuredClone(menthe27.steps[0]),{id:'casino',title:'Blackjack hybride — trois manches',narrative:'La table du casino attend l’équipe. Le capitaine distribue la main commune.',kind:'puzzle',instanceId:'menthe-blackjack',next:'videoclub'},
    {id:'videoclub',title:'Prochaine étape — Vidéoclub rétro',narrative:'Les trois symboles sont acquis. Le Vidéoclub rétro attend sa préparation ; l’opération n’est pas terminée.',kind:'planned',puzzleType:'retro-videoclub',next:null}],
  objects:[...structuredClone(menthe27.objects),{instanceId:'menthe-blackjack',objectId:'table',placementKey:'table'}],
  victory:{requiredSteps:['symbols','casino','videoclub']},
};

export const menthe27Videoclub={
  ...structuredClone(menthe27Hybrid),version:'0.4.0',description:'Le coffre, le blackjack hybride et le Vidéoclub rétro de l’opération Menthe 27.',
  instances:[...structuredClone(menthe27Hybrid.instances),{id:'menthe-videoclub',type:'retro-videoclub',schemaVersion:1,config:{order:['tape-red','tape-blue','tape-gold'],hints:['Les jaquettes portent trois années : commencez par la plus ancienne.','Le projecteur accepte une cassette par logement.','Une erreur éjecte tout le montage.'],rewards:[{id:'videoclub-access',label:'Accès à la salle de projection'}]}}],
  steps:[structuredClone(menthe27Hybrid.steps[0]),{...structuredClone(menthe27Hybrid.steps[1]),next:'videoclub'},{id:'videoclub',title:'Le Vidéoclub rétro',narrative:'Les trois symboles ouvrent une salle de projection. Retrouvez les cassettes et remettez-les dans l’ordre.',kind:'puzzle',instanceId:'menthe-videoclub',next:'after-videoclub'},{id:'after-videoclub',title:'Prochaine étape — en préparation',narrative:'Le Vidéoclub est ouvert. La suite de l’opération attend sa préparation.',kind:'planned',puzzleType:'radio-menthe',next:null}],
  objects:[...structuredClone(menthe27Hybrid.objects),{instanceId:'menthe-videoclub',objectId:'tape-red',placementKey:'four'},{instanceId:'menthe-videoclub',objectId:'tape-blue',placementKey:'eight'},{instanceId:'menthe-videoclub',objectId:'tape-gold',placementKey:'king'}],
  victory:{requiredSteps:['symbols','casino','videoclub','after-videoclub']},
};

export const menthe27Portal={...structuredClone(menthe27Hybrid),version:'0.3.0',introduction:{type:'team-portal',schemaVersion:1,config:structuredClone(DEFAULT_PORTAL)}};

export const menthe27Videoclub80s={
  ...structuredClone(menthe27Videoclub),version:'0.5.0',description:'Le coffre, le blackjack et quatre classiques du videoclub des annees 80.',
  instances:[...structuredClone(menthe27Hybrid.instances),{id:'menthe-videoclub-80s',type:'retro-videoclub',schemaVersion:1,config:{order:['tape-indiana','tape-gremlins','tape-backfuture','tape-goonies'],hints:['Les annees sont cachees sur les jaquettes : commencez par la plus ancienne.','La boite des Gremlins contient la cassette de Gremlins. Manipulez-la avec precaution.','Les quatre films forment une chronologie 1981, 1984, 1985, 1985.','Les deux films de 1985 se departagent avec le nombre inscrit sur leur indice.'],rewards:[{id:'videoclub-access-80s',label:'Acces a la salle de projection'}]}}],
  steps:[structuredClone(menthe27Hybrid.steps[0]),{...structuredClone(menthe27Hybrid.steps[1]),next:'videoclub'},{id:'videoclub',title:'Le Vidéoclub des années 80',narrative:'Retrouvez les quatre jaquettes dans leurs cachettes, puis classez les films par année de sortie.',kind:'puzzle',instanceId:'menthe-videoclub-80s',next:'after-videoclub'},{id:'after-videoclub',title:'Prochaine étape — en préparation',narrative:'Le vidéoclub est ouvert. La suite de l’opération attend sa préparation.',kind:'planned',puzzleType:'radio-menthe',next:null}],
  objects:[...structuredClone(menthe27Hybrid.objects),{instanceId:'menthe-videoclub-80s',objectId:'tape-indiana',placementKey:'king'},{instanceId:'menthe-videoclub-80s',objectId:'tape-gremlins',placementKey:'chest'},{instanceId:'menthe-videoclub-80s',objectId:'tape-backfuture',placementKey:'four'},{instanceId:'menthe-videoclub-80s',objectId:'tape-goonies',placementKey:'eight'}],
  victory:{requiredSteps:['symbols','casino','videoclub','after-videoclub']},
};

// Version immersive du coffre : les anciennes versions restent disponibles pour
// les pièces et sessions déjà enregistrées. Les fragments sont de vrais indices
// progressifs ; aucun ordre n'est donné directement par le panneau mural.
const immersiveChestConfig={
  ...structuredClone(menthe27Hybrid.instances[0].config),
  hints:[
    'Cherchez quatre morceaux de lettre, chacun caché près d’un sceau.',
    'Alignez les fragments : le message parle du jour, du bois, de la nuit puis des étoiles.',
    'La feuille froissée sous le coffre est une fausse piste.',
  ],
  clues:[
    {id:'clue-sun',text:'Fragment A — « Quand le jour se lève, le premier sceau est déjà allumé. »',truth:true},
    {id:'clue-tree',text:'Fragment B — « Le bois pousse après la lumière et garde le deuxième sceau. »',truth:true},
    {id:'clue-moon',text:'Fragment C — « Quand le soleil disparaît, la lune prend sa place. »',truth:true},
    {id:'clue-star',text:'Fragment D — « Enfin, les premières étoiles ferment la marche. »',truth:true},
    {id:'clue-false',text:'Papier froissé sous le coffre — « Commencez par la dernière lumière… »',truth:false},
  ],
};
export const menthe27Immersive={
  ...structuredClone(menthe27Videoclub80s),
  version:'0.6.0',
  title:'Opération Menthe 27 — Coffre immersif',
  description:'Le coffre se découvre avec quatre fragments de lettre cachés dans la pièce, puis le blackjack et le vidéoclub des années 80.',
  instances:structuredClone(menthe27Videoclub80s.instances).map(instance=>instance.id==='menthe-chest'?{...instance,config:immersiveChestConfig}:instance),
  steps:structuredClone(menthe27Videoclub80s.steps).map(step=>step.id==='symbols'?{...step,title:'Le coffre aux fragments',narrative:'Les symboles ne sont pas affichés : rassemblez les fragments de lettre pour comprendre l’ordre des sceaux.'}:step),
};
