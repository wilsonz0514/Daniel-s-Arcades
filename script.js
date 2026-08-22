const home=document.querySelector('#home'),gameView=document.querySelector('#gameView'),shopView=document.querySelector('#shopView');
const gameArea=document.querySelector('#gameArea'),scoreEl=document.querySelector('#score'),titleEl=document.querySelector('#gameTitle'),kickerEl=document.querySelector('#gameKicker');
const SAVE_KEY='danielsNumberArcadeSaveV1';
const defaultSave={points:0,skips:0,owned:{mergeShield:false,hunterLens:false,patternPrism:false}};
let save=loadSave(),score=0,currentGame=null,toastTimer,mergeShieldReady=false,sessionPoints=0,gameWon=false;
if(!save.testPackGranted){
  save.skips+=1;
  save.owned.mergeShield=true;
  save.owned.hunterLens=true;
  save.owned.patternPrism=true;
  save.testPackGranted=true;
  localStorage.setItem(SAVE_KEY,JSON.stringify(save));
}
if(!save.fivePackGranted){
  save.skips=Math.max(save.skips,5);
  save.owned.mergeShield=true;
  save.owned.hunterLens=true;
  save.owned.patternPrism=true;
  save.fivePackGranted=true;
  localStorage.setItem(SAVE_KEY,JSON.stringify(save));
}

function loadSave(){try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY));return{...defaultSave,...raw,owned:{...defaultSave.owned,...(raw?.owned||{})}}}catch{return{points:0,skips:0,owned:{mergeShield:false,hunterLens:false,patternPrism:false}}}}
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));updateWallet()}
function updateWallet(){document.querySelector('#pointBalance').textContent=save.points;document.querySelector('#shopBalance').textContent=save.points;document.querySelector('#skipCount').textContent=save.skips;document.querySelector('#accessoryCount').textContent=`${Object.values(save.owned).filter(Boolean).length} / 3`}
function awardPoints(amount,label){save.points+=amount;sessionPoints+=amount;persist();toast(`+${amount} POINTS · ${label}`)}

const games={
  merge:{title:'MERGE MAESTRO',kicker:'GAME 01 / QUICK MATH',start:startMerge},
  multiples:{title:'MULTIPLE HUNTER',kicker:'GAME 02 / NUMBER SENSE',start:startMultiples},
  pattern:{title:'PATTERN PULSE',kicker:'GAME 03 / LOGIC',start:startPattern}
};
const products=[
  {id:'skip',icon:'↠',type:'CONSUMABLE',name:'SKIP PASS',description:'Skip one question or round in any game. Buy as many as you want.',price:75},
  {id:'mergeShield',icon:'◇',type:'MERGE ACCESSORY',name:'TILE SHIELD',description:'Blocks the first highest-tile penalty in every Merge Maestro run.',price:250},
  {id:'hunterLens',icon:'◎',type:'HUNTER ACCESSORY',name:'NUMBER LENS',description:'Automatically selects one correct multiple at the start of every round.',price:300},
  {id:'patternPrism',icon:'△',type:'PATTERN ACCESSORY',name:'PATTERN PRISM',description:'Removes one wrong choice from every Pattern Pulse question.',price:350}
];

document.querySelectorAll('[data-game]').forEach(btn=>btn.addEventListener('click',()=>openGame(btn.dataset.game)));
document.querySelectorAll('[data-home]').forEach(btn=>btn.addEventListener('click',goHome));
document.querySelector('#shopBtn').addEventListener('click',openShop);
function showView(view){[home,gameView,shopView].forEach(v=>v.classList.remove('active'));view.classList.add('active');window.scrollTo(0,0)}
function openGame(id){document.querySelector('.victory-overlay')?.remove();currentGame=id;score=0;sessionPoints=0;gameWon=false;updateScore();showView(gameView);titleEl.textContent=games[id].title;kickerEl.textContent=games[id].kicker;games[id].start()}
function goHome(){currentGame=null;gameArea.innerHTML='';showView(home)}
function openShop(){currentGame=null;gameArea.innerHTML='';renderShop();showView(shopView)}
function updateScore(){scoreEl.textContent=score}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2100)}
function shell(instruction,body){gameArea.innerHTML=`<div class="game-shell"><div class="instructions"><b>i</b><span>${instruction}</span></div>${body}</div>`}
function showVictory(gameName,achievement){
  if(gameWon)return;gameWon=true;currentGame=null;
  const colors=['#eaf238','#ff6534','#5e80ff','#9be073','#f4f0e7'];
  const confetti=Array.from({length:55},(_,i)=>`<i class="confetti-piece" style="left:${(i*37)%100}%;--delay:-${(i%12)*.23}s;--fall:${2.7+(i%7)*.22}s;--color:${colors[i%colors.length]};--spin:${i*29}deg"></i>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="victory-overlay">${confetti}<section class="victory-bubble" role="dialog" aria-modal="true" aria-label="You win"><span class="victory-kicker">${gameName} COMPLETE</span><h2>YOU WIN!</h2><p>${achievement}</p><div class="victory-stats"><span><small>FINAL SCORE</small><b>${score}</b></span><span><small>POINTS EARNED</small><b>★ ${sessionPoints}</b></span></div><div class="victory-actions"><button id="viewVictory">VIEW VICTORY</button><button id="victoryHome">GAME ROOM</button></div><div class="victory-details" id="victoryDetails" hidden>You conquered ${gameName} and earned ${sessionPoints} arcade points. Your victory and rewards are saved on this device.</div></section></div>`);
  document.querySelector('#viewVictory').onclick=()=>{const d=document.querySelector('#victoryDetails');d.hidden=!d.hidden;document.querySelector('#viewVictory').textContent=d.hidden?'VIEW VICTORY':'HIDE DETAILS'};
  document.querySelector('#victoryHome').onclick=()=>{document.querySelector('.victory-overlay')?.remove();goHome()};
}

function renderShop(){
  updateWallet();
  document.querySelector('#shopGrid').innerHTML=products.map(p=>{const owned=p.id!=='skip'&&save.owned[p.id];const canBuy=save.points>=p.price&&!owned;return `<article class="shop-card"><div class="item-icon">${p.icon}</div><div class="item-copy"><span class="item-type">${p.type}</span><h3>${p.name}</h3><p>${p.description}</p>${owned?'<b class="owned-stamp">✓ OWNED & EQUIPPED</b>':`<button class="buy-btn" data-buy="${p.id}" ${canBuy?'':'disabled'}>★ ${p.price} · ${p.id==='skip'?'BUY ONE':'UNLOCK'}</button>`}</div></article>`}).join('');
  document.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>buyItem(btn.dataset.buy));
}
function buyItem(id){const p=products.find(x=>x.id===id);if(!p||save.points<p.price)return;if(id!=='skip'&&save.owned[id])return;save.points-=p.price;if(id==='skip')save.skips++;else save.owned[id]=true;persist();renderShop();toast(id==='skip'?'SKIP ADDED TO INVENTORY':`${p.name} EQUIPPED`)}
function gameTools(perk=''){return `<div class="game-tools">${perk?`<span class="perk-note">★ ${perk}</span>`:''}<button class="skip-use" id="useSkip" ${save.skips?'':'disabled'}>USE SKIP (${save.skips})</button></div>`}
function bindSkip(){const b=document.querySelector('#useSkip');if(b)b.onclick=useSkip}
function useSkip(){if(!save.skips||!currentGame)return;save.skips--;persist();if(currentGame==='merge'){selected=[];mergeTyped='';spawnMergeTiles(1);renderMerge()}else if(currentGame==='multiples'){if(multipleLevel>=10)showVictory('MULTIPLE HUNTER','You cleared all 10 number hunts!');else{multipleLevel++;newMultipleRound()}}else if(currentGame==='pattern'){if(patternLevel>=25)showVictory('PATTERN PULSE','You solved all 25 pattern levels!');else{patternLevel++;newPattern()}}toast('SKIP USED · NO POINTS EARNED')}

let mergeBoard,selected,mergeTyped='';
const mergeSeeds=[3,5,7,9];
function startMerge(){mergeBoard=Array(16).fill(0);selected=[];mergeTyped='';mergeShieldReady=save.owned.mergeShield;[0,1,2,4,5,6,8,9,10,12,13,15].forEach((p,i)=>mergeBoard[p]=[3,3,5,5,7,7,9,9,3,3,5,5][i]);renderMerge()}
function spawnMergeTiles(count=2){const empty=mergeBoard.map((n,i)=>n===0?i:-1).filter(i=>i>=0).sort(()=>Math.random()-.5);empty.slice(0,count).forEach(i=>mergeBoard[i]=mergeSeeds[Math.floor(Math.random()*mergeSeeds.length)])}
function renderMerge(){const highest=Math.max(...mergeBoard),progress=Math.min(100,Math.round(highest/72*100));const perk=save.owned.mergeShield?(mergeShieldReady?'TILE SHIELD READY':'TILE SHIELD USED'):'';shell('Merge matching numbers until you create a tile worth 72 or more.',`${gameTools(perk)}<div class="game-status"><h3>HIGHEST TILE: ${highest}</h3><p>SELECT 2 MATCHING</p></div><div class="run-progress"><div class="run-progress-head"><span>START</span><b>${progress}% TO VICTORY</b><span>72+</span></div><div class="run-progress-track"><div class="run-progress-fill" style="--progress:${progress}%"></div></div></div><div class="merge-board">${mergeBoard.map((n,i)=>`<button class="tile ${n?'filled':''} ${selected.includes(i)?'selected':''}" data-value="${n}" data-tile="${i}" ${!n?'disabled':''}>${n||''}</button>`).join('')}</div><div class="keyboard-answer"><span>Your answer:</span><strong id="typedAnswer">${mergeTyped||''}</strong></div>`);document.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{const i=+b.dataset.tile;if(selected.includes(i))selected=selected.filter(x=>x!==i);else if(selected.length<2)selected.push(i);renderMerge()});bindSkip()}
document.addEventListener('keydown',e=>{if(currentGame!=='merge')return;if(/^\d$/.test(e.key)){e.preventDefault();if(mergeTyped.length<5)mergeTyped+=e.key}else if(e.key==='Backspace'){e.preventDefault();mergeTyped=mergeTyped.slice(0,-1)}else if(e.key==='Enter'){e.preventDefault();if(mergeTyped){const answer=+mergeTyped;mergeTyped='';checkMerge(answer)}else toast('TYPE THE SUM FIRST');return}else return;const readout=document.querySelector('#typedAnswer');if(readout)readout.textContent=mergeTyped});
function checkMerge(answer){if(selected.length!==2||mergeBoard[selected[0]]!==mergeBoard[selected[1]]){toast('PICK TWO MATCHING TILES');return}const value=mergeBoard[selected[0]],highest=Math.max(...mergeBoard);if(answer===value*2){const merged=value*2;mergeBoard[selected[0]]=merged;mergeBoard[selected[1]]=0;score+=merged;updateScore();awardPoints(Math.max(3,Math.round(value/2)),'CLEAN MERGE');if(merged>=72){setTimeout(()=>currentGame==='merge'&&showVictory('MERGE MAESTRO',`You forged a ${merged} tile!`),350);return}spawnMergeTiles(2)}else if(mergeShieldReady){mergeShieldReady=false;toast('TILE SHIELD BLOCKED THE PENALTY')}else{const hi=mergeBoard.indexOf(highest);mergeBoard[hi]=highest>9?Math.max(3,Math.floor(highest/2)):mergeSeeds[Math.floor(Math.random()*mergeSeeds.length)];toast('WRONG SUM — HIGHEST TILE DROPPED')}selected=[];mergeTyped='';updateScore();renderMerge()}

let multipleTarget,multipleNums,multipleSelected,multipleStreak=0,multipleLevel=1;
function startMultiples(){multipleLevel=1;multipleStreak=0;newMultipleRound()}
function newMultipleRound(){const min=2+(multipleLevel-1)*5;multipleTarget=min+Math.floor(Math.random()*5);multipleSelected=[];const correct=Array.from({length:6},(_,i)=>multipleTarget*(i+1));const decoys=[];while(decoys.length<9){const n=Math.max(2,Math.floor(multipleTarget*.6)+Math.floor(Math.random()*multipleTarget*6));if(n%multipleTarget!==0&&!decoys.includes(n))decoys.push(n)}multipleNums=[...correct,...decoys].sort(()=>Math.random()-.5);if(save.owned.hunterLens){const first=multipleNums.findIndex(n=>n%multipleTarget===0);if(first>=0)multipleSelected=[first]}renderMultiples()}
function renderMultiples(){const perk=save.owned.hunterLens?'NUMBER LENS FOUND 1 ANSWER':'',progress=multipleLevel*10;shell('Clear 10 rounds. Each round uses a larger randomized target.',`${gameTools(perk)}<div class="game-status"><h3>FIND MULTIPLES OF <span style="color:var(--orange)">${multipleTarget}</span></h3><p>${multipleSelected.length} SELECTED</p></div><div class="run-progress"><div class="run-progress-head"><span>LEVEL ${multipleLevel}</span><b>${progress}% COMPLETE</b><span>LEVEL 10</span></div><div class="run-progress-track"><div class="run-progress-fill" style="--progress:${progress}%"></div></div></div><div class="number-grid">${multipleNums.map((n,i)=>`<button class="number-choice ${multipleSelected.includes(i)?'selected':''}" data-num="${i}">${n}</button>`).join('')}</div><div style="text-align:center;margin-top:20px"><button id="checkMultiples" class="primary">CHECK PICKS</button></div>`);document.querySelectorAll('[data-num]').forEach(b=>b.onclick=()=>{const i=+b.dataset.num;multipleSelected=multipleSelected.includes(i)?multipleSelected.filter(x=>x!==i):[...multipleSelected,i];renderMultiples()});document.querySelector('#checkMultiples').onclick=checkMultiples;bindSkip()}
function checkMultiples(){const right=multipleNums.map((n,i)=>n%multipleTarget===0?i:-1).filter(i=>i>=0);const perfect=right.length===multipleSelected.length&&right.every(i=>multipleSelected.includes(i));if(perfect){multipleStreak++;score+=right.length*10+multipleLevel*5;updateScore();awardPoints(20+multipleLevel*4+multipleStreak*2,`LEVEL ${multipleLevel} CLEARED`);if(multipleLevel>=10){setTimeout(()=>currentGame==='multiples'&&showVictory('MULTIPLE HUNTER','You cleared all 10 increasingly difficult hunts!'),400)}else{multipleLevel++;setTimeout(()=>currentGame==='multiples'&&newMultipleRound(),650)}}else{multipleStreak=0;score=Math.max(0,score-5);updateScore();toast('NOT QUITE — TRY THIS LEVEL AGAIN')}}

let patternLevel=1,patternAnswer,patternOptions=[];
const symbols=['●','▲','■','◆','★','✚'],patternColors=['#151515','#ff6534','#5e80ff','#70b94d','#8c43c7'];
function startPattern(){patternLevel=1;newPattern()}
function patternToken(shape,color='#151515',rotation=0,size=1){return{shape,color,rotation,size}}
function tokenKey(t){return`${t.shape}|${t.color}|${t.rotation}|${t.size}`}
function tokenHTML(t,tag='span',extra='',attrs=''){return`<${tag} class="pattern-symbol ${extra}" ${attrs} style="color:${t.color};transform:rotate(${t.rotation}deg) scale(${t.size})">${t.shape}</${tag}>`}
function buildPattern(level){
  const length=level<=5?5+Math.floor(level/2):level<=10?7+Math.floor((level-6)/2):level<=15?8+Math.floor((level-11)/2):level<=20?9+Math.floor((level-16)/2):11+Math.floor((level-21)/2);
  const a=symbols[level%symbols.length],b=symbols[(level+2)%symbols.length],c=symbols[(level+4)%symbols.length];const seq=[];
  for(let i=0;i<length;i++){
    if(level<=5)seq.push(patternToken(i%2?a:b));
    else if(level<=10)seq.push(patternToken([a,b,c][i%3]));
    else if(level<=15)seq.push(patternToken(i%2?a:b,patternColors[i%3]));
    else if(level<=20)seq.push(patternToken([a,b,c][i%3],patternColors[i%2],(i%4)*45));
    else seq.push(patternToken([a,b,c][i%3],patternColors[(i*2)%patternColors.length],(i%4)*45,i%2?.78:1.05));
  }
  return seq;
}
function makeDistractor(answer,n){return patternToken(symbols[(symbols.indexOf(answer.shape)+n+1)%symbols.length],patternColors[(patternColors.indexOf(answer.color)+n+1+patternColors.length)%patternColors.length],(answer.rotation+(n+1)*45)%360,answer.size===1.05?.78:1.05)}
function newPattern(){const seq=buildPattern(patternLevel);patternAnswer=seq[seq.length-1];const shown=seq.slice(0,-1);const wrongCount=save.owned.patternPrism?2:3,progress=patternLevel*4;patternOptions=[patternAnswer,...Array.from({length:wrongCount},(_,i)=>makeDistractor(patternAnswer,i))].sort(()=>Math.random()-.5);const perk=save.owned.patternPrism?'PATTERN PRISM REMOVED 1 CHOICE':'';shell('Patterns get longer and add color, rotation, and size changes as you approach level 25.',`${gameTools(perk)}<div class="game-status"><h3>LEVEL ${patternLevel} / 25</h3><p>WHAT COMES NEXT?</p></div><div class="run-progress"><div class="run-progress-head"><span>LEVEL ${patternLevel}</span><b>${progress}% COMPLETE</b><span>LEVEL 25</span></div><div class="run-progress-track"><div class="run-progress-fill" style="--progress:${progress}%"></div></div></div><div class="pattern-sequence">${shown.map(x=>tokenHTML(x)).join('')}<span class="pattern-symbol missing">?</span></div><div class="pattern-options">${patternOptions.map((x,i)=>tokenHTML(x,'button','pattern-option-choice',`data-option="${i}"`)).join('')}</div>`);document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>checkPattern(+b.dataset.option));bindSkip()}
function checkPattern(choice){if(tokenKey(patternOptions[choice])===tokenKey(patternAnswer)){const completed=patternLevel,reward=8+completed*3;score+=completed*10;updateScore();awardPoints(reward,`LEVEL ${completed} SOLVED`);if(completed>=25){setTimeout(()=>currentGame==='pattern'&&showVictory('PATTERN PULSE','You mastered all 25 visual patterns!'),400)}else{patternLevel++;setTimeout(()=>currentGame==='pattern'&&newPattern(),500)}}else{score=Math.max(0,score-5);updateScore();toast('LOOK AGAIN — CHECK EVERY PROPERTY')}}

updateWallet();
setTimeout(()=>{
  if(!save.victoryPreviewShown&&currentGame===null&&!gameWon){
    save.victoryPreviewShown=true;
    persist();
    showVictory('VICTORY PREVIEW','This is the celebration you will see after finishing a game!');
  }
},450);
