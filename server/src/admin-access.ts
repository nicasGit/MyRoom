export function adminAccess(token=process.env.ADMIN_TOKEN??'',allowDebug=process.env.DEBUG_WITHOUT_ADMIN_TOKEN==='true'){
  const debug=token.trim().length===0&&allowDebug;
  return {debug,configured:token.length>=16};
}
