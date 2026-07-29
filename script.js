const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');

const btnLoadDeck = document.getElementById('btn-load-deck');
const deckElement = document.getElementById('deck');
const deckCountText = document.getElementById('deck-count');
const handArea = document.getElementById('hand-area');
const discardCountText = document.getElementById('discard-count');

const btnLoadRhino = document.getElementById('btn-load-rhino');
const encounterDeckElement = document.getElementById('encounter-deck');
const encounterDeckCountText = document.getElementById('encounter-deck-count');
const encounterDiscardCountText = document.getElementById('encounter-discard-count');

const zoomImg = document.getElementById('zoom-img');
const zoomTitle = document.getElementById('zoom-title');
const zoomTraits = document.getElementById('zoom-traits');
const zoomDesc = document.getElementById('zoom-desc');

let topZIndex = 10; 
let myDeck = [], discardPile = []; 
let encounterDeck = [], encounterDiscardPile = [];

const CENTER_X = 2000;
const CENTER_Y = 2000;

let scale = 1;
let boardX = -CENTER_X + window.innerWidth / 2; 
let boardY = -CENTER_Y + window.innerHeight / 2;
updateCamera();

// --- 1. MENU CONTEXTUEL & TOKENS ---
const contextMenu = document.getElementById('context-menu');
let targetCard = null; 

document.addEventListener('click', (e) => { if (!e.target.closest('#context-menu')) contextMenu.classList.add('hidden'); });

document.getElementById('menu-exhaust').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) targetCard.classList.toggle('exhausted');
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-flip').addEventListener('click', () => {
    if (targetCard) {
        const isFlipped = targetCard.dataset.flipped === 'true';
        targetCard.dataset.flipped = !isFlipped;
        targetCard.querySelector('.card-front').src = !isFlipped ? targetCard.dataset.backUrl : targetCard.dataset.frontUrl;
        updateSidePanel(targetCard.dataset.cardData, targetCard.querySelector('.card-front').src);
    }
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-dmg-plus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'damage', 1); contextMenu.classList.add('hidden'); });
document.getElementById('menu-dmg-minus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'damage', -1); contextMenu.classList.add('hidden'); });
document.getElementById('menu-thrt-plus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'threat', 1); contextMenu.classList.add('hidden'); });
document.getElementById('menu-thrt-minus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'threat', -1); contextMenu.classList.add('hidden'); });

document.getElementById('menu-discard').addEventListener('click', () => {
    if (targetCard) discardCard(targetCard);
    contextMenu.classList.add('hidden');
});

function updateToken(card, type, amount) {
    if (card.classList.contains('in-hand')) return;
    let val = parseInt(card.dataset[type]) + amount;
    val = Math.max(0, val); 
    card.dataset[type] = val;
    const tokenDisplay = card.querySelector(`.${type}-token`); 
    tokenDisplay.innerText = val;
    val > 0 ? tokenDisplay.classList.remove('hidden') : tokenDisplay.classList.add('hidden');
}

// --- 2. CAMÉRA ---
boardWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08; const wheel = e.deltaY < 0 ? 1 : -1;
    const rect = boardWrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const targetX = (mouseX - boardX) / scale; const targetY = (mouseY - boardY) / scale;
    scale += wheel * zoomIntensity; scale = Math.max(0.3, Math.min(scale, 2.5)); 
    boardX = mouseX - (targetX * scale); boardY = mouseY - (targetY * scale); updateCamera();
});

let isPanning = false, startPanX = 0, startPanY = 0, hasPanned = false;
boardWrapper.addEventListener('mousedown', (e) => {
    if (e.target === boardWrapper || e.target === board) {
        isPanning = true; hasPanned = false; startPanX = e.clientX - boardX; startPanY = e.clientY - boardY;
    }
});
window.addEventListener('mousemove', (e) => {
    if (!isPanning) return; hasPanned = true; boardX = e.clientX - startPanX; boardY = e.clientY - startPanY; updateCamera();
});
window.addEventListener('mouseup', () => { if (isPanning && !hasPanned) clearSidePanel(); isPanning = false; });

function updateCamera() { board.style.transform = `translate(${boardX}px, ${boardY}px) scale(${scale})`; }

function clearSidePanel() {
    zoomImg.src = "https://placehold.co/300x420/2c3e50/FFF?text=Clique+sur+une+carte";
    zoomTitle.innerText = "---"; zoomTraits.innerText = ""; zoomDesc.innerText = "Sélectionne une carte.";
}

// --- 3. CHARGEMENT DES DECKS ---

// Le VRAI deck Spidey
const fullSpideyDeck = [
    '01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009',
    '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065',
    '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'
];

const rhinoEncounterDeck = [
    '01098', '01099', '01099', '01100', '01100', '01101', '01101', '01102', '01102',
    '01103', '01104', '01104', '01105', '01105', '01106', '01107', '01108', '01109', '01110', 
    '01111', '01112', '01113', '01114', '01115'
];

btnLoadDeck.addEventListener('click', async () => {
    btnLoadDeck.disabled = true; myDeck = [...fullSpideyDeck];
    const heroIndex = myDeck.indexOf('01001a');
    if (heroIndex !== -1) {
        myDeck.splice(heroIndex, 1);
        const heroData = await fetchAPI('01001a');
        if (heroData) putOnBoardAt(buildCardDOM(heroData), CENTER_X, CENTER_Y + 150); 
    }
    myDeck.sort(() => Math.random() - 0.5); deckElement.classList.remove('hidden'); updateDeckCounter();
});

deckElement.addEventListener('click', async () => {
    if (myDeck.length === 0) return;
    const data = await fetchAPI(myDeck.pop()); updateDeckCounter();
    if(data) putInHand(buildCardDOM(data));
});

// INITIALISATION RHINO (Empilement corrigé)
btnLoadRhino.addEventListener('click', async () => {
    btnLoadRhino.disabled = true; encounterDeck = [...rhinoEncounterDeck];
    
    // 1. On charge d'abord Rhino II, pour qu'il soit "en dessous" dans le DOM
    const rhino2Data = await fetchAPI('01095');
    // On le décale de 5 pixels pour faire un "effet de pile"
    if (rhino2Data) putOnBoardAt(buildCardDOM(rhino2Data), CENTER_X + 5, CENTER_Y - 145);

    // 2. On charge Rhino I par-dessus
    const rhino1Data = await fetchAPI('01094');
    if (rhino1Data) putOnBoardAt(buildCardDOM(rhino1Data), CENTER_X, CENTER_Y - 150);

    // 3. Charger La Manigance (ATTENTION : l'API demande 01097 et non 01097a)
    const schemeData = await fetchAPI('01097'); 
    if (schemeData) putOnBoardAt(buildCardDOM(schemeData), CENTER_X - 250, CENTER_Y - 150);

    encounterDeck.sort(() => Math.random() - 0.5);
    encounterDeckElement.classList.remove('hidden'); updateDeckCounter();
});

encounterDeckElement.addEventListener('click', async () => {
    if (encounterDeck.length === 0) return;
    const data = await fetchAPI(encounterDeck.pop()); updateDeckCounter();
    if(data) putOnBoardAt(buildCardDOM(data), CENTER_X, CENTER_Y);
});

function updateDeckCounter() {
    deckCountText.innerText = myDeck.length;
    if (myDeck.length === 0) deckElement.classList.add('hidden');
    encounterDeckCountText.innerText = encounterDeck.length;
    if (encounterDeck.length === 0) encounterDeckElement.classList.add('hidden');
}

// --- 4. API & DOM ---

async function fetchAPI(cardCode) {
    try {
        const res = await fetch(`https://fr.marvelcdb.com/api/public/card/${cardCode}`);
        return await res.json();
    } catch (error) { return null; }
}

function buildCardDOM(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    // Si c'est une Manigance, on ajoute la classe Paysage !
    if (cardData.type_code === 'main_scheme' || cardData.type_code === 'side_scheme') {
        card.classList.add('landscape');
    }

    card.dataset.damage = 0; card.dataset.threat = 0;
    card.dataset.code = cardData.code; card.dataset.faction = cardData.faction_code; 
    card.dataset.flipped = "false"; card.dataset.cardData = JSON.stringify(cardData); 

    const frontUrl = cardData.imagesrc ? `https://marvelcdb.com${cardData.imagesrc}` : `https://marvelcdb.com/bundles/cards/${cardData.code}.png`;
    let backUrl = cardData.faction_code === 'encounter' ? "https://placehold.co/300x420/c0392b/FFF?text=RENCONTRE" : "https://placehold.co/300x420/2980b9/FFF?text=MARVEL+CHAMPIONS"; 

    // Les Manigances (ex: 01097) utilisent la logique de double face classique (A et B)
    if (cardData.code.endsWith('a') || cardData.code.endsWith('A') || cardData.type_code === 'main_scheme') {
        backUrl = frontUrl.replace('a.png', 'b.png').replace('A.png', 'B.png').replace(cardData.code+'.png', cardData.code+'b.png');
    }

    card.dataset.frontUrl = frontUrl; card.dataset.backUrl = backUrl;

    card.innerHTML = `
        <img src="${frontUrl}" class="card-front" alt="${cardData.name}"/>
        <div class="token damage-token hidden">0</div>
        <div class="token threat-token hidden">0</div>
    `;

    setupCardInteractions(card, cardData, frontUrl);
    makeDraggable(card, cardData, frontUrl);
    return card;
}

// --- 5. INTERACTIONS & DRAG ---

function updateSidePanel(cardDataString, imageUrl) {
    if(!cardDataString) return;
    const cardData = JSON.parse(cardDataString);
    let cleanText = cardData.text ? cardData.text.replace(/\[.*?\]/g, '') : "Aucun texte.";
    zoomImg.src = imageUrl; zoomTitle.innerText = cardData.name;
    zoomTraits.innerText = cardData.traits || ''; zoomDesc.innerHTML = cleanText.replace(/\n/g, '<br>');
}

function setupCardInteractions(card, cardData, imageUrl) {
    card.addEventListener('dblclick', () => { if (!card.classList.contains('in-hand')) card.classList.toggle('exhausted'); });
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation(); targetCard = card;
        contextMenu.style.left = e.clientX + 'px'; contextMenu.style.top = e.clientY + 'px';
        contextMenu.classList.remove('hidden');
    });
}

function makeDraggable(element, cardData, imageUrl) {
    let isDragging = false, startX, startY;

    element.onmousedown = (e) => {
        if (e.button === 2) return; 
        e.preventDefault(); e.stopPropagation();
        isDragging = false; startX = e.clientX; startY = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    };

    function elementDrag(e) {
        e.preventDefault();
        if (!isDragging && (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3)) {
            isDragging = true; element.classList.remove('in-hand'); element.style.zIndex = topZIndex++;
        }
        if (isDragging) {
            const isOverHUD = e.clientY > window.innerHeight - 180;
            // On calcule l'offset pour centrer la souris selon si la carte est paysage ou non
            const isLandscape = element.classList.contains('landscape');
            
            if (isOverHUD) {
                if (element.parentNode !== document.body) { document.body.appendChild(element); element.classList.add('is-dragging-hud'); element.classList.remove('is-dragging-board'); }
                const offsetW = isLandscape ? 70 : 50;
                const offsetH = isLandscape ? 50 : 70;
                element.style.left = (e.clientX - offsetW) + "px"; element.style.top = (e.clientY - offsetH) + "px";
            } else {
                if (element.parentNode !== board) { board.appendChild(element); element.classList.add('is-dragging-board'); element.classList.remove('is-dragging-hud'); }
                const rect = boardWrapper.getBoundingClientRect();
                const offsetW = isLandscape ? 105 : 75;
                const offsetH = isLandscape ? 75 : 105;
                const trueX = (e.clientX - rect.left - boardX) / scale - offsetW;
                const trueY = (e.clientY - rect.top - boardY) / scale - offsetH;
                element.style.left = trueX + "px"; element.style.top = trueY + "px";
            }
        }
    }

    function closeDragElement(e) {
        document.onmouseup = null; document.onmousemove = null;
        if (isDragging) {
            element.classList.remove('is-dragging-hud'); element.classList.remove('is-dragging-board');
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            
            if (dropTarget && dropTarget.closest('#discard-pile')) discardCard(element, 'player');
            else if (dropTarget && dropTarget.closest('#encounter-discard-pile')) discardCard(element, 'encounter');
            else if (dropTarget && dropTarget.closest('#hand-area')) putInHand(element);
            else if(element.parentNode !== board) putOnBoardAt(element, (e.clientX - boardX)/scale, (e.clientY - boardY)/scale);
        } else {
            const currentImg = element.dataset.flipped === 'true' ? element.dataset.backUrl : element.dataset.frontUrl;
            updateSidePanel(element.dataset.cardData, currentImg);
        }
    }
}

// --- 6. PLACEMENT DE ZONES ---

function putOnBoardAt(cardElement, x, y) {
    cardElement.classList.remove('in-hand'); cardElement.style.zIndex = topZIndex++;
    cardElement.style.left = x + "px"; cardElement.style.top = y + "px";
    board.appendChild(cardElement);
}

function putInHand(cardElement) {
    cardElement.classList.add('in-hand');
    cardElement.style.left = ""; cardElement.style.top = ""; 
    cardElement.classList.remove('exhausted'); 
    
    // Remet les tokens à 0 et les cache
    cardElement.dataset.damage = 0; cardElement.dataset.threat = 0;
    cardElement.querySelector('.damage-token').classList.add('hidden');
    cardElement.querySelector('.threat-token').classList.add('hidden');

    if (cardElement.dataset.flipped === 'true') {
        cardElement.dataset.flipped = "false"; cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
    }
    handArea.appendChild(cardElement);
}

function discardCard(cardElement, forcedPile = null) {
    const code = cardElement.dataset.code; const faction = cardElement.dataset.faction;
    cardElement.remove(); 
    const isEncounter = forcedPile === 'encounter' || (!forcedPile && faction === 'encounter');

    if (isEncounter) {
        encounterDiscardPile.push(code); encounterDiscardCountText.innerText = encounterDiscardPile.length;
    } else {
        discardPile.push(code); discardCountText.innerText = discardPile.length;
    }
}