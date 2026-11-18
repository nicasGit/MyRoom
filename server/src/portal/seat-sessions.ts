import { randomBytes,createHash } from 'node:crypto';
export class SeatSessions {
  private seats=new Map<number,{hash:string;connection?:string}>();
  acquire(connection:string,resume:string|undefined,reserve:boolean){
    const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
    if(resume){const found=[...this.seats].find(([,s])=>s.hash===hash(resume));if(!found||found[1].connection)throw Error('Reprise de place refusée.');found[1].connection=connection;return {slot:found[0],token:resume};}
    if(!reserve)for(const [slot,seat] of this.seats)if(!seat.connection)this.seats.delete(slot);
    const slot=[1,2,3,4].find(slot=>!this.seats.has(slot));if(!slot)throw Error('Salle complète ou places réservées aux reconnexions.');
    const token=randomBytes(32).toString('hex');this.seats.set(slot,{hash:hash(token),connection});return {slot,token};
  }
  disconnect(connection:string,reserve:boolean){for(const [slot,seat] of this.seats)if(seat.connection===connection){seat.connection=undefined;}}
  release(slot:number){const seat=this.seats.get(slot);if(seat?.connection)throw Error('Déconnectez ce joueur avant de libérer sa place.');this.seats.delete(slot);}
}
