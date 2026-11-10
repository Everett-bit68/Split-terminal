const ROOM_DATA = {
    title: "ROOM 01: SYNC TEST",
    size: 8,
    alphaMap: [
        [1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,1,1,0,1],
        [1,0,1,0,0,0,0,1],
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
let playerPos = { x:1, y:1};
let desyncCount = 0;
const gridAlphaEl = document.getElementById("grid-alpha");
const gridBetaEl = document.getElementById("grid-beta");
const statusEl = document.getElementById("sys-status");
const desyncEl = document.getElementById("desync-count");
function renderGrids(){
    gridAlphaEl.innerHTML ="";
    gridBetaEl.innerHTML = "";
    for (let y = 0; y<ROOM_DATA.size; y++){
        for (let x = 0; x < ROOM_DATA.size; x++){
            const cellAlpha = document.createElement("div");
            cellAlpha.classList.add("title");
            if (ROOM_DATA.alphaMap[y][x] === 1) cellAlpha.classList.add("wall");
            if (ROOM_DATA.alphaMap[y][x] === 9) cellAlpha.classList.add("exit");
            if (playerPos.x === x && playerPos.y === y) cellAlpha.classList.add("player");
            gridAlphaEl.appendChild(cellAlpha);
            const cellBeta = document.createElement("div");
            cellBeta.classList.add("title");
            if (ROOM_DATA.betaMap[y][x] === 1) cellBeta.classList.add("wall");
            if (ROOM_DATA.betaMap[y][x] === 4) cellBeta.classList.add("hazard");
            if (playerPos.x === x && playerPos.y === y) cellBeta.classList.add("player");
            gridBetaEl.appendChild(cellBeta);
        }
    }
}
function movePlayer(dx,dy){
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    const alphaTile = ROOM_DATA.alphaMap[newY][newX];
    const betaTile = ROOM_DATA.betaMap[newY][newX];
    if (alphaTile === 1 || betaTile === 1){
        triggerDesync("DESYNC: WALL DESTRUCTION");
        return;
    }
    if (betaTile === 4){
        triggerDesync("DESYNC: HAZARD BREACH");
        playerPos = {x:1,y:1};
        renderGrids();
        return;
    }
    playerPos.x = newX;
    playerPos.y = newY;
    statusEl.textContent = "SYNCHRONIZED";
    statusEl.className = "text-good";
    renderGrids();
    if (alphaTile === 9){
        setTimeout(()=> alert("SECTOR CLEANED | ESCAPE SUCCESSFUL"),50);
    }
}
function triggerDesync(msg){
    desyncCount++;
    desyncEl.textContent = desyncCount;
    statusEl.textContent = msg;
    statusEl.className = "text-warn";
}
window.addEventListener("keydown",(e)=>{
    switch (e.key.toLowerCase()){
        case "w": case "arrowup": movePlayer(0,-1); break;
        case "s": case "arrowdown": movePlayer(0,1); break;
        case "a": case "arrowleft": movePlayer(-1,0); break;
        case "d": case "arrowright": movePlayer(1,0); break;
        case "r":
            playerPos = {x:1,y:1};
            renderGrids();
            break;
    }
});
renderGrids();