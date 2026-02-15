export function loadJSON(key){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){
    return null;
  }
}

export function saveJSON(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
  }catch(e){
    // ignore
  }
}
