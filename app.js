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
const gridAlphaEl = document.getElementById("grid-alpha");
const gridBetaEl = document.getElementById("grid-beta");
const statusEl = document.getElementById("sys-status");
const desyncEl = document.getElementById("desync-count");
const debriefModal = document.getElementById("debrief-modal");
const rebootBtn = document.getElementById("reboot-btn");
const roomTitleEl = document.getElementById("room-title");
const nextLevelBtn = document.getElementById("next-level-btn");
const replayLevelBtn = document.getElementById("replay-level-btn");
function renderGrids(){
    gridAlphaEl.innerHTML ="";
    gridBetaEl.innerHTML = "";
    const currentRoom = ROOM_DATA[currentLevelIndex];
    if (roomTitleEl) roomTitleEl.textContent = currentRoom.title;
    const alphaOnPlate = currentRoom.alphaMap[alphaPos.y][alphaPos.x] === 5;
    const betaOnPlate = currentRoom.betaMap[betaPos.y][betaPos.x] === 5;
    const prevUnlocked = exitUnlocked;
    exitUnlocked = exitUnlocked || alphaOnPlate || betaOnPlate;
    if (!prevUnlocked && exitUnlocked){
        playSound("unlock");
    }
    for (let y = 0; y<currentRoom.size; y++){
        for (let x = 0; x < currentRoom.size; x++){
            const cellAlpha = document.createElement("div");
            cellAlpha.classList.add("title");
            const aVal= currentRoom.alphaMap[y][x];
            if (aVal === 1) cellAlpha.classList.add("wall");
            if (aVal === 5) cellAlpha.classList.add("plate");
            if (aVal === 7) cellAlpha.classList.add("swap");
            if (aVal === 9){
                cellAlpha.classList.add("exit");
                if (exitUnlocked) cellAlpha.classList.add("unlocked");
            }
            if (alphaPos.x === x && alphaPos.y === y) cellAlpha.classList.add("player");
            gridAlphaEl.appendChild(cellAlpha);
            const cellBeta = document.createElement("div");
            cellBeta.classList.add("title");
            const bVal = currentRoom.betaMap[y][x];
            if (bVal === 1) cellBeta.classList.add("wall");
            if (bVal === 4) cellBeta.classList.add("hazard");
            if (bVal === 5) cellBeta.classList.add("plate");
            if (bVal === 7) cellBeta.classList.add("swap");
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
    const prevATile = currentRoom.alphaMap[alphaPos.y][alphaPos.x];
    const prevBTile = currentRoom.alphaMap[betaPos.y][betaPos.x];
    playSound("move");
    if (activeControl === "BOTH"|| activeControl === "ALPHA"){
        nextAlpha.x += dx;
        nextAlpha.y +=dy;
    }
    if (activeControl === "BOTH"|| activeControl === "BETA"){
        nextBeta.x += dx;
        nextBeta.y += dy;
    }
    const aTile = currentRoom.alphaMap[nextAlpha.y][nextAlpha.x];
    const bTile = currentRoom.betaMap[nextBeta.y][nextBeta.x];
    if ((activeControl!=="BETA" && aTile ===1)||(activeControl !== "ALPHA" && bTile ===1)){
        playSound("wall");
        triggerDesync("DESYNC: WALL OBSTRUCTION");
        return;
    }
    if (bTile === 4 && (activeControl === "BOTH"||activeControl === "BETA")){
        playSound("hazard");
        triggerDesync("DESYNC: HAZARD BREACH");
        resetPositions();
        return;
    }
    moveHistory.push({
        alphaPos: {...alphaPos},
        betaPos: {...betaPos},
        activeControl: activeControl,
        exitUnlocked: exitUnlocked,
        moveCount: moveCount,
        desyncCount: desyncCount
    });
    alphaPos = nextAlpha;
    betaPos = nextBeta;
    moveCount++;
    const justSteppedOnAlphaSwap = (prevATile !== 7 && aTile === 7);
    const justSteppedOnBetaSwap = (prevBTile !== 7 && bTile === 7); 
    if (justSteppedOnAlphaSwap || justSteppedOnBetaSwap){
        cycleControlFocus();
        playSound("unlock");
    }
    statusEl.textContent = `MODE: ${activeControl} CONTROL`;
    statusEl.className = "text-good";
    renderGrids();
    if ((aTile === 9 || bTile === 9) && exitUnlocked){
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
    if (fullReset){
        moveCount = 0;
        desyncCount = 0;
        startTime = Date.now();
        levelCleared = false;
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
    if (levelCleared || moveHistor.length === 0) return;
    const previousState = moveHistory.pop();
    alphaPos = previousState.alphaPos;
    betaPos = previousState.betaPos;
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
renderGrids();