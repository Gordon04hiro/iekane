/* ---------- 入口ツール：家賃と同じ返済で買える家／繰上げ返済／相続税がかかるか ---------- */
const man1=v=>(Math.round(v*10)/10).toLocaleString('ja-JP');

/* 家賃と同じ返済で買える家 */
const RENT2BUYDEF={id:'rent2buy',title:'家賃と同じ返済で買える家',example:'家賃9万円・頭金300万円・35歳',
  lead:'今の家賃と同じ月々の負担で、いくらの家が買えるかを計算します。家を持つと、ローンのほかに管理費・修繕費・固定資産税もかかるので、その分を差し引いて考えます。',
  base:()=>({rent:9,upkeep:2,down:300,costRate:7,rate:CFG.loanRates.hendo,term:35,age:35,income:600}),
  groups:[
   {g:'今の家賃',f:[{id:'rent',l:'家賃（管理費込み）',u:'万円/月'},{id:'income',l:'世帯の年収（額面）',u:'万円',h:'返済負担率の確認に使います。わからなければ0'}]},
   {g:'買う場合',f:[
    {id:'upkeep',l:'ローン以外にかかるお金',u:'万円/月',st:.1,h:'固定資産税・修繕費・マンションなら管理費と修繕積立金。戸建てで月1.5〜2万円、マンションで月3〜4万円が目安'},
    {id:'down',l:'頭金',u:'万円'},{id:'costRate',l:'諸費用',u:'%',st:.5,h:'物件価格に対する割合。6〜9%が目安'},
    {id:'rate',l:'借入金利',u:'%',st:.01},{id:'term',l:'返済期間',u:'年'},{id:'age',l:'借りる人の年齢',u:'歳',h:'完済時80歳までで返済期間を調整します'}]}
  ],
  calc(V){
    const term=Math.max(1,Math.min(n(V.term),80-n(V.age)));
    const m=Math.max(0,n(V.rent)-n(V.upkeep));
    const price=(r,mm)=>(pv(mm,r,term)+n(V.down))/(1+n(V.costRate)/100);
    const borrow=pv(m,V.rate,term);
    const grid=[-1,0,1].map(dr=>({rent:n(V.rent)+dr,vals:[0,0.5,1].map(di=>price(n(V.rate)+di,Math.max(0,n(V.rent)+dr-n(V.upkeep))))}));
    const ratio=n(V.income)>0?m*12/n(V.income)*100:0;
    return{term,m,borrow,price:price(n(V.rate),m),grid,ratio};
  },
  result(V,R){
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます（単位：万円）。</p>
    <div class="panels"><section class="panel"><div class="ph"><span class="nm">家賃${man1(n(V.rent))}万円と同じ負担で買える家</span></div>
     <div class="kv">${kvRow('物件価格の目安',man(R.price))}${kvRow('借りる額',man(R.borrow))}${kvRow('毎月のローン返済',man1(R.m)+'<small>万円</small>')}${R.ratio?kvRow('返済負担率',R.ratio.toFixed(1)+'<small>%</small>',R.ratio>35):''}</div></section></div>
    <section class="advice"><h3>入力した条件で計算すると</h3><ul>
     <li>家賃${man1(n(V.rent))}万円のうち、${man1(n(V.upkeep))}万円は家を持ったあとの管理費・修繕費・税金にあてる前提です。ローンに回せるのは毎月${man1(R.m)}万円です。</li>
     <li>頭金${fmt(n(V.down))}万円と諸費用${n(V.costRate)}%を考えると、物件価格の目安は約${fmt(R.price)}万円です。</li>
     ${R.term<n(V.term)?`<li>完済時80歳までとすると、返済期間は${R.term}年になります。</li>`:''}
     <li>変動金利なら、金利が上がると同じ返済額で買える価格は下がります。下の表で確かめておきましょう。</li></ul></section>${ctaHTML()}
    <div class="cfhead"><h3>家賃と金利を変えたときの物件価格の目安</h3></div>
    <div class="cfwrap"><table class="cf"><tbody><tr class="hd"><th>家賃</th>${[0,0.5,1].map(di=>`<td>金利${(n(V.rate)+di).toFixed(2)}%</td>`).join('')}</tr>
     ${R.grid.map(g=>`<tr${g.rent===n(V.rent)?' class="tot"':''}><th>${man1(g.rent)}万円/月</th>${g.vals.map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="unit">元利均等返済、ボーナス返済なしで計算しています。家賃と同じ負担で「返せる」ことと、教育費や老後まで「大丈夫」かは別の話です。家計全体はライフプラン診断で確かめられます。</p>`;
  },
  dock:(V,R)=>['買える家の目安',fmt(R.price)+' 万円'],
  related:['loan','vs','lifeplan']
};

/* 繰上げ返済シミュレーター */
const PREPAYDEF={id:'prepay',title:'繰上げ返済シミュレーター',example:`残り2,500万円・金利${CFG.loanRates.hendo}%・残り28年に200万円`,
  lead:'住宅ローンを繰上げ返済すると、利息がいくら減るかを計算します。返済期間を短くする「期間短縮型」と、毎月の返済を減らす「返済額軽減型」を並べて比べます。',
  base:()=>({bal:2500,rate:CFG.loanRates.hendo,years:28,amount:200}),
  groups:[{g:'今のローン',f:[{id:'bal',l:'ローンの残り',u:'万円',h:'返済予定表で確認できます'},{id:'rate',l:'金利',u:'%',st:.01},{id:'years',l:'残りの返済期間',u:'年'}]},
   {g:'繰上げ返済',f:[{id:'amount',l:'繰上げ返済する額',u:'万円'}]}],
  calc(V){
    const B=n(V.bal),N=Math.max(1,Math.round(n(V.years)*12)),i=n(V.rate)/100/12,A=Math.min(n(V.amount),B);
    const M=pmt(B,V.rate,n(V.years)), int0=M*N-B, B2=B-A;
    let n2=0;if(B2>0){n2=i>0?-Math.log(1-B2*i/M)/Math.log(1+i):B2/M}
    const int2=M*n2-B2;
    const M3=pmt(B2,V.rate,n(V.years)), int3=M3*N-B2;
    return{M,int0,A,short:{months:N-n2,saved:int0-int2},light:{down:M-M3,saved:int0-int3,M3}};
  },
  result(V,R){
    const ym=m=>{const t=Math.round(m);return Math.floor(t/12)+'年'+(t%12?t%12+'か月':'')};
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます（単位：万円）。今の毎月の返済は約${man1(R.M)}万円、このまま返した場合の利息の合計は約${fmt(R.int0)}万円です。</p>
    <div class="panels">
     <section class="panel"><div class="ph"><span class="nm">期間短縮型</span><span class="chip good">利息が減りやすい</span></div><div class="kv">${kvRow('減る利息',man(R.short.saved))}${kvRow('短くなる期間',ym(R.short.months))}${kvRow('毎月の返済',man1(R.M)+'<small>万円（変わらない）</small>')}</div></section>
     <section class="panel"><div class="ph"><span class="nm">返済額軽減型</span><span class="chip muted">毎月が楽になる</span></div><div class="kv">${kvRow('減る利息',man(R.light.saved))}${kvRow('毎月の返済',man1(R.light.M3)+'<small>万円</small>')}${kvRow('毎月減る額',man1(R.light.down)+'<small>万円</small>')}</div></section>
    </div>
    <section class="advice"><h3>入力した条件で計算すると</h3><ul>
     <li>${fmt(R.A)}万円を繰上げ返済すると、期間短縮型では利息が約${fmt(R.short.saved)}万円、返済額軽減型では約${fmt(R.light.saved)}万円減る計算です。</li>
     <li>期間短縮型のほうが利息は減りますが、毎月の返済は変わりません。教育費がかかる時期など、毎月の余裕を増やしたいときは返済額軽減型も選択肢です。</li>
     <li>手元のお金を減らしすぎると、急な出費に困ることがあります。生活費の半年〜1年分は残しておくのが安心です。</li>
     <li>住宅ローン控除を受けている間は、年末のローン残高が減ると控除額も減ることがあります。控除の扱いは税務署や税理士にご確認ください。</li></ul></section>${ctaHTML()}
    <p class="unit">元利均等返済、ボーナス返済なし、金利は残りの期間ずっと同じとして計算しています。繰上げ返済の手数料は含めていません。</p>`;
  },
  dock:(V,R)=>['期間短縮で減る利息',fmt(R.short.saved)+' 万円'],
  related:['loan','lifeplan']
};

/* 相続税がかかるかチェック */
/* 法定相続人の数（配偶者＋第1〜3順位のいずれか） */
function zeiHeirs(V){if(V.sp==null&&V.heirs!=null)return Math.round(n(V.heirs));const k=Math.max(0,Math.round(n(V.kids))),p=Math.max(0,Math.min(2,Math.round(n(V.parents)))),b=Math.max(0,Math.round(n(V.sibs)));return (V.sp==='yes'?1:0)+(k>0?k:p>0?p:b)}
const ZEIDEF={id:'souzokuzei',title:'相続税がかかるかチェック',example:'配偶者と子ども2人・預貯金2,000万円・自宅2,500万円',
  lead:'財産の合計が、相続税の基礎控除（3,000万円＋600万円×法定相続人の数）を超えそうかを確かめます。税額は計算しません。超えそうな場合は、早めに税理士に相談するきっかけにしてください。',
  base:()=>({sp:'yes',kids:2,parents:0,sibs:0,cash:2000,home:2500,land:1500,small:'no',other:0,stock:300,ins:1000,debt:200}),
  fix:V=>{if(V.sp==null&&V.heirs!=null){const h=Math.max(1,Math.round(n(V.heirs)));Object.assign(V,{sp:'yes',kids:Math.max(0,h-1),parents:0,sibs:0})}},
  groups:[{g:'家族',s:'亡くなる方（財産を遺す方）から見た家族。法定相続人の数を自動で数えます',f:[
    {id:'sp',l:'配偶者',type:'sel',o:[['yes','いる'],['no','いない']]},
    {id:'kids',l:'子どもの人数',u:'人',h:'養子も含みます（実子がいる場合、数えられる養子は1人まで）。亡くなった子に子（孫）がいれば、その孫の人数で'},
    {id:'parents',l:'健在の親の人数',u:'人',h:'子どもがいない場合に相続人になります',show:V=>!(n(V.kids)>0)},
    {id:'sibs',l:'兄弟姉妹の人数',u:'人',h:'子どもも親もいない場合に相続人になります',show:V=>!(n(V.kids)>0)&&!(n(V.parents)>0)}]},
   {g:'財産',s:'金額は評価額の目安で入れます',f:[
    {id:'cash',l:'預貯金',u:'万円'},{id:'stock',l:'株・投資信託など',u:'万円'},
    {id:'home',l:'自宅（土地＋建物）',u:'万円',h:'土地は路線価、建物は固定資産税評価額が目安。売れる値段より低くなることが多い'},
    {id:'land',l:'うち自宅の土地',u:'万円'},
    {id:'small',l:'自宅の土地の特例',type:'sel',o:[['no','考えない'],['yes','小規模宅地等の特例を使う前提で計算する']],h:'配偶者や同居の家族が自宅を相続する場合などに、土地の評価額が最大80%減る特例があります。使えるかは要件しだいです'},
    {id:'other',l:'その他の不動産',u:'万円'},{id:'ins',l:'生命保険金（受け取る額）',u:'万円',h:'500万円×法定相続人の数までは非課税として計算します'},
    {id:'debt',l:'借入・葬式費用',u:'万円',h:'財産から差し引けます'}]}],
  calc(V){
    const h=Math.max(1,zeiHeirs(V));
    const insTax=Math.max(0,n(V.ins)-500*h);
    const smallCut=V.small==='yes'?Math.min(n(V.land),n(V.home))*0.8:0;
    const total=n(V.cash)+n(V.stock)+n(V.home)+n(V.other)+insTax-smallCut-n(V.debt);
    const basic=3000+600*h;
    return{h,insTax,smallCut,total,basic,over:total>basic};
  },
  result(V,R){
    const st=R.over?['warn','基礎控除を超える可能性']:['good','基礎控除の範囲内の見込み'];
    return `<h2>チェック結果</h2><p class="unit">入力するたびに自動で更新されます（単位：万円）。</p>
    <div class="panels"><section class="panel"><div class="ph"><span class="nm">財産の合計と基礎控除</span><span class="chip ${st[0]}">${st[1]}</span></div>
     <div class="kv">${kvRow('財産の合計（目安）',man(R.total))}${kvRow('基礎控除（3,000万円＋600万円×'+R.h+'人）',man(R.basic))}${kvRow(R.over?'超える額':'まだ余裕がある額',man(Math.abs(R.total-R.basic)),R.over)}</div></section></div>
    <section class="chartcard">${bars([{l:'財産の合計（目安）',v:R.total,c:R.over?'var(--coin)':'var(--accent)'},{l:'基礎控除',v:R.basic,c:'var(--muted)'}],'万円')}</section>
    <section class="advice"><h3>入力した条件では</h3><ul>
     ${R.over?`<li>財産の合計が基礎控除を約${fmt(R.total-R.basic)}万円上回る計算です。相続税の申告が必要になる可能性があります。生前の対策や特例の使い方で変わるので、早めに税理士への相談をおすすめします。</li>`:`<li>財産の合計は基礎控除を下回る計算です。ただし評価額の考え方で金額は変わります。財産が増えたときや、不動産の評価がはっきりしないときは、あらためて確かめましょう。</li>`}
     ${R.insTax<n(V.ins)?`<li>生命保険金のうち${fmt(n(V.ins)-R.insTax)}万円（500万円×${R.h}人）は非課税として差し引いています。</li>`:''}
     ${R.smallCut?`<li>小規模宅地等の特例を使う前提で、自宅の土地の評価額から${fmt(R.smallCut)}万円を差し引いています。この特例は、相続税がかからない場合でも申告しないと使えません。</li>`:''}</ul></section>
    <div class="taxnote">このチェックは、一般的な計算式で財産の合計と基礎控除を比べるだけのものです。相続税の額や、特例が使えるかどうかの判断はしていません。実際の申告が必要かどうかは、税理士または税務署にご確認ください。国税庁のサイトにも「相続税の申告要否判定コーナー」があります。当サイトでは個別の税務相談にはお答えしていません。</div>`;
  },
  dock:(V,R)=>[R.over?'基礎控除を超える額':'基礎控除まで',fmt(Math.abs(R.total-R.basic))+' 万円',R.over],
  related:['souzoku','souzoku2','akiya']
};
Object.assign(GDEF,{rent2buy:RENT2BUYDEF,prepay:PREPAYDEF,souzokuzei:ZEIDEF});
