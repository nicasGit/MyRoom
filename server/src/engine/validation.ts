export function record(value:unknown,keys:readonly string[]){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key)))throw new Error('Objet invalide ou champ inconnu.');
  return value as Record<string,unknown>;
}
export function text(value:unknown,max=160){if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw new Error('Texte invalide.');return value.trim();}
export function identifier(value:unknown){const id=text(value,64);if(!/^[a-z0-9][a-z0-9_-]*$/.test(id))throw new Error('Identifiant invalide.');return id;}
export function integer(value:unknown,min=0,max=Number.MAX_SAFE_INTEGER){if(!Number.isSafeInteger(value)||Number(value)<min||Number(value)>max)throw new Error('Entier invalide.');return value as number;}
export function list(value:unknown,max=64):unknown[]{if(!Array.isArray(value)||value.length>max)throw new Error('Liste invalide.');return value;}
export function unique<T>(values:T[]):T[]{if(new Set(values).size!==values.length)throw new Error('Doublon interdit.');return values;}
export function bool(value:unknown){if(typeof value!=='boolean')throw new Error('Booléen attendu.');return value;}
