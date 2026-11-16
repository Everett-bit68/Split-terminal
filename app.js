const ROOM_DATA = [
    {
        title: "ROOM 01: SYNC TEST",
        size: 8,
        alphaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,5,0,0,0,1],
            [1,0,1,1,0,1,0,1],
            [1,0,1,0,0,1,0,1],
            [1,0,0,0,1,1,0,1],
            [1,0,1,0,7,0,0,1],
            [1,0,0,0,1,0,9,1],
            [1,1,1,1,1,1,1,1]
        ],
        betaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,4,0,0,0,1],
            [1,0,1,1,0,1,0,1],
            [1,0,1,0,0,1,0,1],
            [1,0,4,0,1,1,0,1],
            [1,0,1,0,0,0,0,1],
            [1,0,0,0,1,0,9,1],
            [1,1,1,1,1,1,1,1]
        ]
    },
    {
        title: "ROOM 02: DUAL_PARADOX",
        size: 8,
        alphaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,9,1],
            [1,0,1,1,0,1,0,1],
            [1,0,7,0,5,1,0,1],
            [1,1,0,0,0,0,1,1],
            [1,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1],
            [1,1,1,1,1,1,1,1]
        ],
        betaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,4,0,0,9,1],
            [1,0,1,1,0,1,0,1],
            [1,0,7,4,5,1,0,1],
            [1,1,0,4,0,0,1,1],
            [1,0,0,0,4,0,0,1],
            [1,0,1,1,1,1,0,1],
            [1,1,1,1,1,1,1,1]
        ]
    },
    {
        title: "ROOM 03: DEADLOCK",
        size: 8,
        alphaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,3,0,0,9,1],
            [1,0,1,1,1,3,1,1],
            [1,0,7,0,0,0,0,1],
            [1,1,1,0,1,1,3,1],
            [1,0,5,0,0,0,6,1],
            [1,0,0,0,1,1,1,1],
            [1,1,1,1,1,1,1,1]
        ],
        betaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,0,3,0,0,9,1],
            [1,0,1,1,1,3,1,1],
            [1,0,7,4,4,0,0,1],
            [1,1,1,0,1,1,3,1],
            [1,0,5,0,4,4,0,1],
            [1,0,0,0,1,1,1,1],
            [1,1,1,1,1,1,1,1]
        ]
    },
    {
        title: "ROOM 04: ASYMMETRY",
        size: 8,
        alphaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,7,0,1,0,9,1],
            [1,0,0,0,1,0,1,1],
            [1,0,0,0,0,0,0,1],
            [1,1,1,1,1,0,1,1],
            [1,0,5,0,8,0,6,1],
            [1,0,0,0,1,1,1,1],
            [1,1,1,1,1,1,1,1]
        ],
        betaMap: [
            [1,1,1,1,1,1,1,1],
            [1,0,7,0,1,0,9,1],
            [1,0,3,3,1,0,1,1],
            [1,0,3,2,3,3,0,5],
            [1,1,1,1,1,0,1,1],
            [1,0,5,0,8,0,6,1],
            [1,0,0,0,1,1,1,1],
            [1,1,1,1,1,1,1,1]
        ]
    }
];
let currentLevelIndex = 0;
let alphaPos = {x:1,y:1};
let betaPos = {x:1,y:1};
let activeControl = "BOTH";
let exitUnlocked = false;
let desyncCount = 0;
let audioCtx = null;
let moveCount = 0;
let startTime = Date.now();
let levelCleared = false;
let moveHistory = [];
let maxUnlockedlevel = parseInt(localStorage.getItem("split-terminal-max"));
let levelBests = JSON.parse(localStorage.getItem("split-terminal-bests")) || {};
let lasersActive = true;
let activeAlphaMap = [];
let activeBetaMap = [];
function loadCurrentRoom(){
    const room = ROOM_DATA[currentLevelIndex];
    activeAlphaMap = room.alphaMap.map(row => [...row]);
    activeBetaMap = room.betaMap.map(row => [...row]);
}
if (isNaN(maxUnlockedlevel)){
    maxUnlockedlevel = 0;
    localStorage.setItem("split-terminal-max",0);
}
const gridAlphaEl = document.getElementById("grid-alpha");
const gridBetaEl = document.getElementById("grid-beta");
const statusEl = document.getElementById("sys-status");
const desyncEl = document.getElementById("desync-count");
const debriefModal = document.getElementById("debrief-modal");
const rebootBtn = document.getElementById("reboot-btn");
const roomTitleEl = document.getElementById("room-title");
const nextLevelBtn = document.getElementById("next-level-btn");
const replayLevelBtn = document.getElementById("replay-level-btn");
const levelSelectBtn = document.getElementById("level-select-btn");
const closelevelSelectBtn = document.getElementById("close-level-select");
const levelListContainer = document.getElementById("level-list-container");
const levelSelectModal = document.getElementById("level-select-modal");
function renderGrids(){
    gridAlphaEl.innerHTML ="";
    gridBetaEl.innerHTML = "";
    const currentRoom = ROOM_DATA[currentLevelIndex];
    if (roomTitleEl) roomTitleEl.textContent = currentRoom.title;
    for (let y = 0; y<currentRoom.size; y++){
        for (let x = 0; x < currentRoom.size; x++){
            const cellAlpha = document.createElement("div");
            cellAlpha.classList.add("title");
            const aVal= activeAlphaMap[y][x];
            if (aVal === 1) cellAlpha.classList.add("wall");
            if (aVal === 2) cellAlpha.classList.add("box");
            if (aVal === 3 && lasersActive) cellAlpha.classList.add("laser");
            if (aVal === 5) cellAlpha.classList.add("plate");
            if (aVal === 6) cellAlpha.classList.add("switch");
            if (aVal === 7) cellAlpha.classList.add("swap");
            if (aVal === 8){
                const topPlateCovered = (alphaPos.x === 7 && alphaPos.y === 3)||(betaPos.x === 7 && betaPos.y === 3)|| activeAlphaMap[3][7] === 2 || activeBetaMap[3][7] === 2;
                if (topPlateCovered){
                    cellAlpha.classList.add("gate-open");
                } else {
                    cellAlpha.classList.add("wall");
                }
            }
            if (aVal === 9){
                cellAlpha.classList.add("exit");
                if (exitUnlocked) cellAlpha.classList.add("unlocked");
            }
            if (alphaPos.x === x && alphaPos.y === y) cellAlpha.classList.add("player");
            gridAlphaEl.appendChild(cellAlpha);
            const cellBeta = document.createElement("div");
            cellBeta.classList.add("title");
            const bVal = activeBetaMap[y][x];
            if (bVal === 1) cellBeta.classList.add("wall");
            if (bVal === 2) cellBeta.classList.add("box");
            if (bVal === 3 && lasersActive) cellBeta.classList.add("laser");
            if (bVal === 4) cellBeta.classList.add("hazard");
            if (bVal === 5) cellBeta.classList.add("plate");
            if (bVal === 6) cellBeta.classList.add("switch");
            if (bVal === 7) cellBeta.classList.add("swap");
            if (bVal === 8) {
                const isGateOpen = (alphaPos.x === 7 && alphaPos.y === 3)|| (betaPos.x === 7 && betaPos.y === 3)|| activeAlphaMap[3][7] === 2 || activeBetaMap[3][7] === 2;
                if (isGateOpen){
                    cellBeta.classList.add("gate-open");
                } else {
                    cellBeta.classList.add("wall");
                }
            }
            if (bVal === 9) {
                cellBeta.classList.add("exit");
                if (exitUnlocked) cellBeta.classList.add("unlocked");
            }
            if (betaPos.x === x && betaPos.y === y) cellBeta.classList.add("player");
            gridBetaEl.appendChild(cellBeta);
        }
    }
}
function movePlayer(dx,dy){
    let nextAlpha = {...alphaPos};
    let nextBeta = {...betaPos};
    const currentRoom = ROOM_DATA[currentLevelIndex];
    const prevATile = activeAlphaMap[alphaPos.y][alphaPos.x];
    const prevBTile = activeBetaMap[betaPos.y][betaPos.x];
    playSound("move");
    if (activeControl === "BOTH"|| activeControl === "ALPHA"){
        nextAlpha.x += dx;
        nextAlpha.y +=dy;
    }
    if (activeControl === "BOTH"|| activeControl === "BETA"){
        nextBeta.x += dx;
        nextBeta.y += dy;
    }
    let aTile = activeAlphaMap[nextAlpha.y][nextAlpha.x];
    let bTile = activeBetaMap[nextBeta.y][nextBeta.x];
    if (!lasersActive){
        if (aTile === 3) aTile = 0;
        if (bTile === 3) bTile = 0;
    }
    if (aTile === 2 &&(activeControl === "BOTH" || activeControl === "ALPHA")){
        let boxNextX = nextAlpha.x + dx;
        let boxNextY = nextAlpha.y + dy;
        let targetTile = activeAlphaMap[boxNextY][boxNextX];
        if (targetTile === 3 && !lasersActive) targetTile = 0;
        if (targetTile === 0 || targetTile === 5){
            activeAlphaMap[boxNextY][boxNextX] = 2;
            activeAlphaMap[nextAlpha.y][nextAlpha.x] = 0;
            aTile = 0;
        } else {
            playSound("wall");
            triggerDesync("DESYNC: BLOCK DESTRUCTION");
            return;
        }
    }
    if (bTile === 2 && (activeControl === "BOTH" || activeControl === "BETA")){
        let boxNextX = nextBeta.x + dx;
        let boxNextY = nextBeta.y + dy;
        let targetTile = activeBetaMap[boxNextY][boxNextX];
        if (targetTile === 3 && !lasersActive) targetTile = 0;
        if (targetTile === 0 || targetTile === 5){
            activeBetaMap[boxNextY][boxNextX] = 2;
            activeBetaMap[nextBeta.y][nextBeta.x] = 0;
            bTile = 0;
        } else {
            playSound("wall");
            triggerDesync("DESYNC: BLOCK DESTRUCTION");
            return;
        }
    }
    const topPlateCovered = (alphaPos.x === 7 && alphaPos.y === 3) || (betaPos.x === 7 && betaPos.y === 3) || activeAlphaMap[3][7] === 2 || activeBetaMap[3][7] === 2;
    let gateOpen = topPlateCovered;
    if (!lasersActive){
        if (aTile === 3) aTile = 0;
        if (bTile === 3) bTile = 0;
    }
    let effectiveATile = aTile;
    let effectiveBTile = bTile;
    if (effectiveATile === 8 && !gateOpen) effectiveATile = 1;
    if (effectiveBTile === 8 && !gateOpen) effectiveBTile = 1;
    if ((activeControl!=="BETA" && aTile ===1)||(activeControl !== "ALPHA" && bTile ===1)){
        playSound("wall");
        triggerDesync("DESYNC: WALL OBSTRUCTION");
        return;
    }
    const alphaHitLaser = (aTile === 3||aTile === 4);
    const betaHitLaser = (bTile === 3 || bTile === 4);
    if (((activeControl !== "BETA"&&alphaHitLaser)||(activeControl !=="ALPHA" && betaHitLaser)) && lasersActive){
        playSound("laser-hit");
        triggerDesync("DESYNC: LASER BEAM BREACH");
        resetPositions();
        return;
    }
    moveHistory.push({
        alphaPos: {...alphaPos},
        betaPos: {...betaPos},
        alphaMapCopy: activeAlphaMap.map(row => [...row]),
        betaMapCopy: activeBetaMap.map(row => [...row]),
        activeControl: activeControl,
        exitUnlocked: exitUnlocked,
        moveCount: moveCount,
        desyncCount: desyncCount
    });
    alphaPos = nextAlpha;
    betaPos = nextBeta;
    moveCount++;
    const justSteppedOnAlphaSwitch = (currentRoom.alphaMap[nextAlpha.y][nextAlpha.x]===6);
    const justSteppedOnBetaSwitch = (currentRoom.betaMap[nextBeta.y][nextBeta.x]===6);
    if (justSteppedOnAlphaSwitch || justSteppedOnBetaSwitch){
        lasersActive = !lasersActive;
        playSound("laser-switch");
        statusEl.textContent = lasersActive ? "WARNING: LASER GRID ENGAGED":"SYSTEM: LASER GRID DEACTIVATED";
        statusEl.className = lasersActive ? "text-warn":"text-good";
    }
    const justSteppedOnAlphaSwap = (prevATile !== 7 && aTile === 7);
    const justSteppedOnBetaSwap = (prevBTile !== 7 && bTile === 7); 
    if (justSteppedOnAlphaSwap || justSteppedOnBetaSwap){
        cycleControlFocus();
        playSound("unlock");
    }
    const bottomPlateCovered = (alphaPos.x === 2 && alphaPos.y === 5) || (betaPos.x === 2 && betaPos.y === 5) || activeAlphaMap[5][2] === 2 || activeBetaMap [5][2] === 2;
    const prevUnlocked = exitUnlocked;
    exitUnlocked = exitUnlocked || bottomPlateCovered;
    if (!prevUnlocked && exitUnlocked){
        playSound("unlock");
    }
    statusEl.textContent = `MODE: ${activeControl} CONTROL`;
    statusEl.className = "text-good";
    renderGrids();
    if ((activeAlphaMap[alphaPos.y][alphaPos.x] === 9 || activeBetaMap[betaPos.y][betaPos.x] === 9)&& exitUnlocked){
        showDebrief();
        playSound("unlock");
    }
}
function cycleControlFocus(){
    if (activeControl === "BOTH") activeControl = "ALPHA";
    else if (activeControl === "ALPHA") activeControl = "BETA";
    else activeControl = "BOTH"
}
function triggerDesync(msg){
    desyncCount++;
    desyncEl.textContent = desyncCount;
    statusEl.textContent = msg;
    statusEl.className = "text-warn";
}
function resetPositions(fullReset = false){
    alphaPos = {x:1,y:1};
    betaPos = {x:1,y:1};
    activeControl = "BOTH";
    exitUnlocked = false;
    moveHistory = [];
    loadCurrentRoom();
    if (fullReset){
        moveCount = 0;
        desyncCount = 0;
        startTime = Date.now();
        levelCleared = false;
        lasersActive = true;
        desyncEl.textContent = "0";
        statusEl.textContent = "SYNCHRONIZED";
        statusEl.className= "text-good";
        const modal = document.getElementById("debrief-modal");
        if (modal) modal.classList.add("hidden");
    }
    renderGrids();
}
window.addEventListener("keydown",(e)=>{
    switch (e.key.toLowerCase()){
        case "w": case "arrowup": movePlayer(0,-1); break;
        case "s": case "arrowdown": movePlayer(0,1); break;
        case "a": case "arrowleft": movePlayer(-1,0); break;
        case "d": case "arrowright": movePlayer(1,0); break;
        case "r": resetPositions(); break;
        case "z": undoMove(); break;
    }
});
function initAudio(){
    if (!audioCtx){
        audioCtx = new (window.AudioContext|| window.webkitAudioContext)();
    }
}
function playSound(type){
    initAudio();
    if (!audioCtx) return;
    const osc=audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === "move"){
        osc.type = "sine";
        osc.frequency.setValueAtTime(440,now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
        gainNode.gain.setValueAtTime(0.05,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }
    else if(type === "wall"){
        osc.type="sawtooth";
        osc.frequency.setValueAtTime(120,now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.1);
        gainNode.gain.setValueAtTime(0.1,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type==="hazard"|| type==="desync"){
        osc.type="square";
        osc.frequency.setValueAtTime(150,now);
        osc.frequency.setValueAtTime(300, now + 0.08);
        gainNode.gain.setValueAtTime(0.12,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    else if (type === "unlock"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.08,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    else if (type === "laser-hit"){
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800,now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.15,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    else if (type === "laser-switch"){
        osc.type = "square";
        osc.frequency.setValueAtTime(200,now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.1,now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}
function showDebrief(){
    levelCleared = true;
    playSound ("unlock");
    const elapsedSec = Math.floor((Date.now()-startTime)/1000);
    const mins = String(Math.floor(elapsedSec/60)).padStart(2, "0");
    const secs = String(elapsedSec % 60).padStart(2,"0");
    let rank = "S-RANK";
    if (desyncCount > 3) rank = "B-RANK";
    else if (desyncCount > 0 || moveCount > 35) rank = "A-RANK";
    if (!levelBests[currentLevelIndex]||moveCount < levelBests[currentLevelIndex].moves){
        levelBests[currentLevelIndex] = {
            moves: moveCount,
            rank: rank,
            desyncs: desyncCount
        };
        localStorage.setItem("split-terminal-bests",JSON.stringify(levelBests));
    }
    document.getElementById("final-moves").textContent = moveCount;
    document.getElementById("final-desyncs").textContent = desyncCount;
    document.getElementById("final-time").textContent = `${mins}:${secs}`;
    document.getElementById("final-rank").textContent = rank;
    debriefModal.classList.remove("hidden");
}
const crtToggleBtn = document.getElementById("crt-toggle-btn");
let crtEnabled = true;
if (crtToggleBtn){
    crtToggleBtn.addEventListener("click",()=>{
        crtEnabled = !crtEnabled;
        document.body.classList.toggle("crt-disabled",!crtEnabled);
        crtToggleBtn.textContent = crtEnabled ? "[CRT: ON]" : "[CRT: OFF]";
        playSound("move");
    });
}
function loadNextLevel(){
    currentLevelIndex++;
    if (currentLevelIndex >= ROOM_DATA.length){
        currentLevelIndex = 0;
    }
    resetPositions(true);
}
if (nextLevelBtn){
    nextLevelBtn.addEventListener("click", loadNextLevel);
}
if (replayLevelBtn){
    replayLevelBtn.addEventListener("click", ()=>resetPositions(true));
}
function undoMove(){
    if (levelCleared || moveHistory.length === 0) return;
    const previousState = moveHistory.pop();
    alphaPos = previousState.alphaPos;
    betaPos = previousState.betaPos;
    activeAlphaMap = previousState.alphaMapCopy;
    activeBetaMap = previousState.betaMapCopy;
    activeControl = previousState.activeControl;
    exitUnlocked = previousState.exitUnlocked;
    moveCount = previousState.moveCount;
    desyncCount = previousState.desyncCount;
    desyncEl.textContent = desyncCount;
    statusEl.textContent = `MODE: ${activeControl} CONTROL (UNDO)`;
    statusEl.className = "text-good";
    playSound("move");
    renderGrids();
}
function openLevelSelect(){
    levelListContainer.innerHTML = "";
    ROOM_DATA.forEach((room, index)=>{
        const btn = document.createElement("button");
        btn.className = "terminal-btn";
        const isUnlocked = index <= maxUnlockedlevel;
        if (isUnlocked){
            const best = levelBests[index];
            const recordText = best ? ` - ${best.moves} CYCLES (${best.rank})`: "- NO DATA";
            btn.textContent = `[ ${room.title}${recordText} ]`;
            btn.addEventListener("click",()=>{
                currentLevelIndex = index;
                levelSelectModal.classList.add("hidden");
                resetPositions(true);
            });
        } else {
            btn.textContent = `[🔒 ${room.title} (LOCKED) ]`;
            btn.classList.add("locked");
        }
        levelListContainer.appendChild(btn);
    });
    levelSelectModal.classList.remove("hidden");
}
if (levelSelectBtn){
    levelSelectBtn.addEventListener("click", openLevelSelect);
}
if (closelevelSelectBtn){
    closelevelSelectBtn.addEventListener("click",()=>{
        levelSelectModal.classList.add("hidden");
    });
}
function loadNextLevel(){
    currentLevelIndex++;
    if (currentLevelIndex >= ROOM_DATA.length){
        currentLevelIndex = 0;
    }
    if (currentLevelIndex > maxUnlockedlevel){
        maxUnlockedlevel = currentLevelIndex;
        localStorage.setItem("split-terminal-max", maxUnlockedlevel);
    }
    resetPositions(true);
}
if (nextLevelBtn){
    nextLevelBtn.replaceWith(nextLevelBtn.cloneNode(true));
    document.getElementById("next-level-btn").addEventListener("click",loadNextLevel);
}
loadCurrentRoom();
renderGrids();