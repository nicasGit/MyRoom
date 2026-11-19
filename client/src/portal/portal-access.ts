import type { PortalPublic } from '../../../server/src/portal/portal-types.js';

/** A confirmed first grip unlocks the participant's view for this ritual. */
export function hasStaffAccess(state:PortalPublic|undefined,slot:number){
  return !!state?.active&&state.config.enabled&&!!state.players.find(player=>player.slot===slot)?.claimed;
}
