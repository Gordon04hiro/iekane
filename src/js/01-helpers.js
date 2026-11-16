const isPast=d=>{const x=new Date(d+'T23:59:59');return Date.now()>x.getTime()};
const jd=d=>{const [y,m,dd]=d.split('-').map(Number);return `${y}年${m}月${dd}日`};
function expNote(key,label){return isPast(CFG[key])?`<div class="taxnote" style="border-left-color:var(--bad)"><b>${label}の期限（${jd(CFG[key])}）を過ぎています。</b>延長や見直しがされている可能性があります。最新の情報をご確認ください。</div>`:''}
