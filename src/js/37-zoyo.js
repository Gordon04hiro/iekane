/* ---------- 住宅資金の贈与税の目安（数値は content/rules.yml の zoyo） ---------- */
const ZY=CFG.zoyo;
function zoyoTax(amount,special){
  const t=Math.max(0,amount-ZY.basic);if(t<=0)return 0;
  const tbl=special?ZY.special:ZY.general;const r=tbl.find(x=>t<=x[0]);
  return Math.max(0,t*r[1]/100-r[2]);
}
function zoyoCalc(V){
  const a=Math.max(0,n(V.amount));
  const special=V.rel==='parent'&&V.adult==='yes';
  const canHouse=special&&V.use==='house';
  const limit=canHouse?ZY.houseLimit[V.htype==='eco'?'eco':'other']:0;
  const A=zoyoTax(a,special);
  const rest=Math.max(0,a-limit);
  const B=canHouse?zoyoTax(rest,true):null;
  const C=canHouse?Math.max(0,rest-ZY.seisan.basic-ZY.seisan.special)*ZY.seisan.rate/100:null;
  return {a,special,canHouse,limit,A,B,C,rest};
}
const CMAN=v=>(Math.round(v*10)/10).toLocaleString('ja-JP');
const ZOYODEF={id:'zoyo',title:'住宅資金の贈与税の目安',example:'親から1,000万円・省エネ等住宅の購入に使う',
  lead:'親や祖父母から、家を買うための資金を援助してもらうときの贈与税の目安を計算します。住宅取得等資金の非課税の特例や、相続時精算課税を使った場合とも比べられます。',
  base:()=>({amount:1000,rel:'parent',adult:'yes',use:'house',htype:'eco'}),
  groups:[
   {g:'援助してもらうお金',f:[
    {id:'amount',l:'今年もらう金額の合計',u:'万円',h:'同じ年に、ほかにもらったお金があれば合わせて入れます'},
    {id:'rel',l:'だれから',type:'sel',o:[['parent','父母・祖父母（直系尊属）'],['other','それ以外（配偶者の親・兄弟など）']],h:'配偶者の親は、養子縁組をしていなければ「それ以外」です'},
    {id:'adult',l:'もらう人の年齢（今年1月1日時点）',type:'sel',o:[['yes','18歳以上'],['no','18歳未満']]}]},
   {g:'使い道',f:[
    {id:'use',l:'何に使いますか',type:'sel',o:[['house','自分が住む家の購入・新築・増改築'],['other','それ以外']]},
    {id:'htype',l:'家の種類',type:'sel',o:[['eco','省エネ等住宅（省エネ・耐震・バリアフリーの基準を満たす）'],['other','それ以外の住宅']],show:V=>V.use==='house'}]}
  ],
  calc:V=>zoyoCalc(V),
  result(V,R){
    const card=(nm,v,sub)=>`<section class="panel"><div class="ph"><span class="nm">${nm}</span></div><div class="kv">${kvRow('贈与税の目安',CMAN(v)+'<small>万円</small>')}${sub||''}</div></section>`;
    const best=R.canHouse?Math.min(R.A,R.B,R.C):R.A;
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます（単位：万円）。</p>
    <div class="panels">
     ${card('特例を使わない場合（暦年課税）',R.A,kvRow('税率の区分',R.special?'特例税率':'一般税率'))}
     ${R.canHouse?card('住宅取得等資金の非課税を使う場合',R.B,kvRow('非課税になる額',CMAN(Math.min(R.a,R.limit))+'<small>万円</small>')):''}
     ${R.canHouse?card('非課税＋相続時精算課税を使う場合',R.C,kvRow('相続のときに足し戻される額',CMAN(Math.max(0,R.rest-ZY.seisan.basic))+'<small>万円</small>')):''}
    </div>
    <section class="advice"><h3>入力した条件で計算すると</h3><ul>
     ${R.canHouse?`<li>住宅取得等資金の非課税を使うと、<b>${CMAN(Math.min(R.a,R.limit))}万円までは贈与税がかかりません</b>。さらに暦年課税の基礎控除${ZY.basic}万円と合わせられます。</li>
     <li>この特例の対象は、<b>${ZY.houseUntil}までの贈与</b>です。それ以降の扱いは、毎年の税制改正で決まります。</li>
     <li>特例を使うには、税金が0円でも、<b>もらった年の翌年2月1日〜3月15日に贈与税の申告</b>が必要です。翌年3月15日までに家を取得して住むことなどの条件もあります。</li>
     <li>相続時精算課税は、一度選ぶと、その人からの贈与はずっと暦年課税に戻せません。もらった額（毎年の基礎控除${ZY.seisan.basic}万円を除く）は、贈与した人が亡くなったときに相続財産に足し戻されます。</li>`
     :`<li>贈与税は、1年間にもらった額から基礎控除${ZY.basic}万円を引いた残りにかかります。${R.special?'父母・祖父母から18歳以上の人へのお金なので、税率の低い「特例税率」で計算しています。':'「一般税率」で計算しています。'}</li>
     ${V.use==='house'&&!R.special?'<li>住宅取得等資金の非課税の特例は、父母・祖父母から、18歳以上の人がもらう場合だけ使えます。</li>':''}`}
     <li>生活費や教育費として、そのつど必要な分を払ってもらう場合は、贈与税はかかりません。</li>
    </ul></section>${ctaHTML()}
    <div class="taxnote">国税庁の速算表と特例の内容にもとづく、一般的な<b>計算例</b>です（同じ年のほかの贈与や、過去に特例を使った分は考えていません）。特例の条件（所得・床面積・入居時期など）を満たすかどうかや、実際の申告は、税務署や税理士にご確認ください。</div>`;
  },
  dock:(V,R)=>['贈与税の目安（いちばん少ない方法）',CMAN(R.canHouse?Math.min(R.A,R.B,R.C):R.A)+' 万円'],
  related:['loan','koujo','souzokuzei']
};
Object.assign(GDEF,{zoyo:ZOYODEF});
