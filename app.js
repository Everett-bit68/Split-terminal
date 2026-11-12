const ROOM_DATA = {
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
        [1,0,0,0,1,0,0,1],
        [1,1,1,1,1,1,1,1]
    ]
};
let alphaPos = {x:1,y:1};
let betaPos = {x:1,y:1};
let activeControl = "BOTH";
let exitUnlocked = false;
let desyncCount = 0;
let audioCtx = null;
const gridAlphaEl = document.getElementById("grid-alpha");
const gridBetaEl = document.getElementById("grid-beta");
const statusEl = document.getElementById("sys-status");
const desyncEl = document.getElementById("desync-count");
function renderGrids(){
    gridAlphaEl.innerHTML ="";
    gridBetaEl.innerHTML = "";
    const alphaOnPlate = ROOM_DATA.alphaMap[alphaPos.y][alphaPos.x] === 5;
    const betaOnPlate = ROOM_DATA.betaMap[betaPos.y][betaPos.x] === 5;
    exitUnlocked = alphaOnPlate || betaOnPlate;
    for (let y = 0; y<ROOM_DATA.size; y++){
        for (let x = 0; x < ROOM_DATA.size; x++){
            const cellAlpha = document.createElement("div");
            cellAlpha.classList.add("title");
            const aVal= ROOM_DATA.alphaMap[y][x];
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
            const bVal = ROOM_DATA.betaMap[y][x];
            if (bVal === 1) cellBeta.classList.add("wall");
            if (bVal === 4) cellBeta.classList.add("hazard");
            if (bVal === 5) cellBeta.classList.add("plate");
            if (bVal === 7) cellBeta.classList.add("swap");
            if (betaPos.x === x && betaPos.y === y) cellBeta.classList.add("player");
            gridBetaEl.appendChild(cellBeta);
            const newlyUnlocked = !exitUnlocked && (alphaOnPlate || betaOnPlate);
            exitUnlocked = alphaOnPlate || betaOnPlate;
            if (newlyUnlocked){
                playSound("unlock");
            }
        }
    }
}
function movePlayer(dx,dy){
    let nextAlpha = {...alphaPos};
    let nextBeta = {...betaPos};
    playSound("move");
    if (activeControl === "BOTH"|| activeControl === "ALPHA"){
        nextAlpha.x += dx;
        nextAlpha.y +=dy;
    }
    if (activeControl === "BOTH"|| activeControl === "BETA"){
        nextBeta.x += dx;
        nextBeta.y += dy;
    }
    const aTile = ROOM_DATA.alphaMap[nextAlpha.y][nextAlpha.x];
    const bTile = ROOM_DATA.betaMap[nextBeta.y][nextBeta.x];
    if ((activeControl!=="BETA" && aTile ===1)||(activeControl !== "ALPHA" && bTile ===1)){
        playSound("wall");
        triggerDesync("DESYNC: WALL OBSTRUCTION");
        return;
    }
    if (bTile === 4 && (activeControl === "BOTH"||activeControl === "BETA")){
        triggerDesync("DESYNC: HAZARD BREACH");
        resetPositions();
        return;
    }
    alphaPos = nextAlpha;
    betaPos = nextBeta;
    if (aTile === 7||bTile === 7){
        cycleControlFocus();
    }
    statusEl.textContent = `MODE: ${activeControl} CONTROL`;
    statusEl.className = "text-good";
    renderGrids();
    if (aTile === 9 && exitUnlocked){
        setTimeout(()=> alert("SECTOR CLEARED: ESCAPE SUCCESSFUL"),50);
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
function resetPositions(){
    alphaPos = {x:1,y:1};
    betaPos = {x:1,y:1};
    activeControl = "BOTH";
    renderGrids();
}
window.addEventListener("keydown",(e)=>{
    switch (e.key.toLowerCase()){
        case "w": case "arrowup": movePlayer(0,-1); break;
        case "s": case "arrowdown": movePlayer(0,1); break;
        case "a": case "arrowleft": movePlayer(-1,0); break;
        case "d": case "arrowright": movePlayer(1,0); break;
        case "tab":
            e.preventDefault();
            cycleControlFocus();
            statusEl.textContent = `MANUAL FOCUS: ${activeControl}`;
            renderGrids();
            break;
        case "r":
            resetPositions();
            break;
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
        osc.frequeny.linearRampToValue(40, now + 0.1);
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
renderGrids();