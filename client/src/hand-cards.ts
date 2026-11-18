import * as THREE from 'three';
import type { GrabHand } from './object-grab';
import type { HybridAction,HybridPublicState } from '../../server/src/puzzles/blackjack-hybrid.js';
export class HandCards {
  private held:{card:string;side:string;requested:number;confirmed:boolean}|undefined;
  private previous=new Set<string>();
  private until=0;
  constructor(private actor:()=>string,private action:(action:HybridAction)=>void,private notify:(message:string)=>void){}
  blocksSelect(now=performance.now()){return !!this.held||now<this.until;}
  cancel(){if(this.held)this.action({action:'cancel_card'});this.held=undefined;}
  update(group:THREE.Group|undefined,hands:GrabHand[],state:HybridPublicState|undefined,enabled:boolean,now=performance.now()){
    if(!enabled||!group||!state||state.round===1||state.status!=='playing'){this.cancel();this.previous=new Set(hands.filter(h=>h.pressed).map(h=>h.side));return;}
    group.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
    const cards:THREE.Object3D[]=[],slots:THREE.Object3D[]=[];group.traverse(node=>{if(node.userData.hybridCard)cards.push(node);if(node.userData.hybridSlot!==undefined)slots.push(node);});
    const position=(node:THREE.Object3D)=>node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse);
    if(this.held){
      const held=this.held,hand=hands.find(h=>h.side===held.side),lease=state.locks.find(l=>l.owner===this.actor()&&l.card===held.card);
      if(!hand){this.cancel();this.notify('Suivi de main perdu : carte libérée.');return;}
      if(lease)held.confirmed=true;
      if(!lease){if(held.confirmed||now-held.requested>2000){this.held=undefined;this.until=now+600;}return;}
      const card=cards.find(c=>c.userData.hybridCard===held.card);
      if(!hand.pressed){
        const nearest=slots.filter(n=>state.slots[n.userData.hybridSlot]===null||state.slots[n.userData.hybridSlot]===held.card).map(node=>({slot:node.userData.hybridSlot as number,distance:node.parent!.localToWorld(new THREE.Vector3((node.userData.hybridSlot-1)*0.26,0.785,0.12)).applyMatrix4(inverse).distanceTo(hand.position)})).sort((a,b)=>a.distance-b.distance)[0];
        this.action(nearest&&nearest.distance<0.3?{action:'drop_card',slot:nearest.slot}:{action:'return_card'});this.held=undefined;this.until=now+600;
      }else if(card){const world=group.localToWorld(hand.position.clone());card.position.copy(card.parent!.worldToLocal(world));}
    }else {
      for(const hand of hands)if(hand.pressed&&!this.previous.has(hand.side)){
        const candidate=cards.map(node=>({card:node.userData.hybridCard as string,distance:position(node).distanceTo(hand.position)})).filter(c=>c.distance<0.16&&!state.locks.some(l=>l.card===c.card)).sort((a,b)=>a.distance-b.distance)[0];
        if(candidate){this.held={card:candidate.card,side:hand.side,requested:now,confirmed:false};this.action({action:'pick_card',card:candidate.card});this.notify('Carte saisie : déposez près d’un logement en moins de 15 secondes.');break;}
      }
    }
    this.previous=new Set(hands.filter(h=>h.pressed).map(h=>h.side));
  }
}
