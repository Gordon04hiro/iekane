/* ---------- 全ツール共通：数字の入力欄の使いやすさ ----------
   ・欄をタップ（クリック）したら中身を全選択 → そのまま打てば上書き（前の数字の後ろにつながらない）
   ・「万円」の欄に円のつもりの大きな数字が入ったら、欄の下に注意を出す */
(function(){
  let justFocused=null;
  document.addEventListener('focusin',e=>{const t=e.target;if(!(t instanceof HTMLInputElement)||t.type!=='number')return;
    justFocused=t;setTimeout(()=>{try{t.select()}catch(_){}},0)});
  // クリックで入ったとき、mouseup でカーソルが置かれて選択が外れるのを防ぐ（1回だけ）
  document.addEventListener('mouseup',e=>{if(justFocused&&e.target===justFocused){e.preventDefault()}justFocused=null},true);
  const LIM={'万円':100000,'万円/年':100000,'万円/月':10000};
  function check(t){
    const box=t.closest('.inp');if(!box)return;const u=(box.querySelector('.u')||{}).textContent||'';const lim=LIM[u.trim()];
    const fld=box.parentElement;let w=fld.querySelector('.unitwarn');
    const v=parseFloat(t.value),bad=lim&&v>=lim;
    if(bad&&!w){w=document.createElement('span');w.className='unitwarn';w.setAttribute('role','alert');box.after(w)}
    if(w){if(bad){const ex=u.trim()==='万円/月'?'月10万円なら「10」':'600万円なら「600」';w.textContent=`単位は「${u.trim()}」です。金額が大きすぎませんか？（${ex}と入れます）`}else w.remove()}
  }
  document.addEventListener('input',e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.type==='number')check(t)},true);
})();
