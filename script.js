const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');
const btnLoadDeck = document.getElementById('btn-load-deck');

const deckElement = document.getElementById('deck');
const deckCountText = document.getElementById('deck-count');
const handArea = document.getElementById('hand-area');
const discardCountText = document.getElementById('discard-count');

const zoomImg = document.getElementById('zoom-img');
const zoomTitle = document.getElementById('zoom-title');
const zoomTraits = document.getElementById('zoom-traits');
const zoomDesc = document.getElementById('zoom-desc');

let topZIndex = 10; 
let myDeck = []; 
let discardPile = []; 

let scale = 1;
let boardX = -1500; 
let boardY = -1500;
updateCamera();

// --- 1. MENU CONTEXTUEL & SYSTÈME GLOBAL ---

const contextMenu = document.getElementById('context-menu');
let targetCard = null; // La carte ciblée par le clic droit

// Cacher le menu quand on clique ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu')) contextMenu.classList.add('hidden');
});

// Actions du menu
document.getElementById('menu-exhaust').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) targetCard.classList.toggle('exhausted');
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-flip').addEventListener('click', () => {
    if (targetCard) {
        const isFlipped = targetCard.dataset.flipped === 'true';
        targetCard.dataset.flipped = !isFlipped;
        targetCard.querySelector('.card-front').src = !isFlipped ? targetCard.dataset.backUrl : targetCard.dataset.frontUrl;
    }
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-dmg-plus').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) updateDamage(targetCard, 1);
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-dmg-minus').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) updateDamage(targetCard, -1);
    contextMenu.classList.add('hidden');
});

document.getElementById('menu-discard').addEventListener('click', () => {
    if (targetCard) discardCard(targetCard, targetCard.dataset.code);
    contextMenu.classList.add('hidden');
});

function updateDamage(card, amount) {
    let dmg = parseInt(card.dataset.damage) + amount;
    dmg = Math.max(0, dmg);
    card.dataset.damage = dmg;
    const tokenDisplay = card.querySelector('.token');
    tokenDisplay.innerText = dmg;
    dmg > 0 ? tokenDisplay.classList.remove('hidden') : tokenDisplay.classList.add('hidden');
}

// --- 2. CAMÉRA ---

boardWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const wheel = e.deltaY < 0 ? 1 : -1;
    
    const rect = boardWrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;

    const targetX = (mouseX - boardX) / scale; const targetY = (mouseY - boardY) / scale;

    scale += wheel * zoomIntensity;
    scale = Math.max(0.3, Math.min(scale, 2.5)); 

    boardX = mouseX - (targetX * scale); boardY = mouseY - (targetY * scale);
    updateCamera();
});

let isPanning = false, startPanX = 0, startPanY = 0, hasPanned = false;
boardWrapper.addEventListener('mousedown', (e) => {
    if (e.target === boardWrapper || e.target === board) {
        isPanning = true; hasPanned = false;
        startPanX = e.clientX - boardX; startPanY = e.clientY - boardY;
    }
});
window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    hasPanned = true; boardX = e.clientX - startPanX; boardY = e.clientY - startPanY; updateCamera();
});
window.addEventListener('mouseup', () => {
    if (isPanning && !hasPanned) clearSidePanel();
    isPanning = false;
});

function updateCamera() { board.style.transform = `translate(${boardX}px, ${boardY}px) scale(${scale})`; }

function clearSidePanel() {
    zoomImg.src = "https://placehold.co/300x420/2c3e50/FFF?text=Clique+sur+une+carte";
    zoomTitle.innerText = "---"; zoomTraits.innerText = ""; zoomDesc.innerText = "Sélectionne une carte.";
}

// --- 3. DECK & GÉNÉRATION DES CARTES ---

const fullSpideyDeck = [
    '01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009',
    '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065',
    '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'
];

btnLoadDeck.addEventListener('click', async () => {
    btnLoadDeck.disabled = true; myDeck = [...fullSpideyDeck];
    
    const heroIndex = myDeck.indexOf('01001a');
    if (heroIndex !== -1) {
        myDeck.splice(heroIndex, 1);
        const heroData = await fetchAPI('01001a');
        if (heroData) {
            const heroCard = buildCardDOM(heroData);
            const rect = boardWrapper.getBoundingClientRect();
            putOnBoard(heroCard, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }
    myDeck.sort(() => Math.random() - 0.5); 
    deckElement.classList.remove('hidden');
    updateDeckCounter();
});

deckElement.addEventListener('click', async () => {
    if (myDeck.length === 0) return alert("Pioche vide !");
    const data = await fetchAPI(myDeck.pop());
    updateDeckCounter();
    if(data) putInHand(buildCardDOM(data));
});

function updateDeckCounter() {
    deckCountText.innerText = myDeck.length;
    if (myDeck.length === 0) deckElement.classList.add('hidden');
}

async function fetchAPI(cardCode) {
    try {
        const res = await fetch(`https://fr.marvelcdb.com/api/public/card/${cardCode}`);
        return await res.json();
    } catch (error) { return null; }
}

function buildCardDOM(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.damage = 0;
    card.dataset.code = cardData.code;
    card.dataset.flipped = "false";

    // Gestion des images (Face A et Dos/Face B)
    const frontUrl = cardData.imagesrc ? `https://marvelcdb.com${cardData.imagesrc}` : `https://marvelcdb.com/bundles/cards/${cardData.code}.png`;
    
    // Si la carte est une double face (se termine par "a"), le dos est la face "b". Sinon, c'est le dos classique.
    const isDoubleSided = cardData.code.endsWith('a');
    const backUrl = isDoubleSided 
        ? frontUrl.replace('a.png', 'b.png').replace('A.png', 'B.png')
        : "https://placehold.co/300x420/2980b9/FFF?text=MARVEL+CHAMPIONS";

    card.dataset.frontUrl = frontUrl;
    card.dataset.backUrl = backUrl;

    card.innerHTML = `
        <img src="${frontUrl}" class="card-front" alt="${cardData.name}"/>
        <div class="token hidden">0</div>
    `;

    setupCardInteractions(card, cardData, frontUrl);
    makeDraggable(card, cardData, frontUrl);
    return card;
}

// --- 4. INTERACTIONS ET DRAG & DROP "SMART SNAP" ---

function updateSidePanel(cardData, imageUrl) {
    let cleanText = cardData.text ? cardData.text.replace(/\[.*?\]/g, '') : "Aucun texte.";
    zoomImg.src = imageUrl; zoomTitle.innerText = cardData.name;
    zoomTraits.innerText = cardData.traits || ''; zoomDesc.innerHTML = cleanText.replace(/\n/g, '<br>');
}

function setupCardInteractions(card, cardData, imageUrl) {
    card.addEventListener('dblclick', () => {
        if (!card.classList.contains('in-hand')) card.classList.toggle('exhausted');
    });

    // Ouverture du menu contextuel
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        targetCard = card;
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
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
            isDragging = true;
            element.classList.remove('in-hand');
            element.style.zIndex = topZIndex++;
        }

        if (isDragging) {
            // FIX : Détection de survol (Plateau vs HUD du bas)
            // Le HUD fait 180px de haut. Si la souris est dans les 180 derniers pixels, on est sur le HUD.
            const isOverHUD = e.clientY > window.innerHeight - 180;

            if (isOverHUD) {
                // Attaché au body (taille normale d'interface, ignorant le zoom du plateau)
                if (element.parentNode !== document.body) {
                    document.body.appendChild(element);
                    element.classList.add('is-dragging-hud');
                    element.classList.remove('is-dragging-board');
                }
                // Centre la souris sur une petite carte (50x70)
                element.style.left = (e.clientX - 50) + "px";
                element.style.top = (e.clientY - 70) + "px";

            } else {
                // Attaché au plateau (hérite du zoom)
                if (element.parentNode !== board) {
                    board.appendChild(element);
                    element.classList.add('is-dragging-board');
                    element.classList.remove('is-dragging-hud');
                }
                // Convertit en coordonnées plateau
                const rect = boardWrapper.getBoundingClientRect();
                const relX = e.clientX - rect.left; const relY = e.clientY - rect.top;
                
                // Centre la souris sur une grande carte (75x105)
                const trueX = (relX - boardX) / scale - 75;
                const trueY = (relY - boardY) / scale - 105;

                element.style.left = trueX + "px";
                element.style.top = trueY + "px";
            }
        }
    }

    function closeDragElement(e) {
        document.onmouseup = null; document.onmousemove = null;

        if (isDragging) {
            element.classList.remove('is-dragging-hud');
            element.classList.remove('is-dragging-board');
            
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);

            if (dropTarget && dropTarget.closest('#discard-area')) {
                discardCard(element, cardData.code);
            } else if (dropTarget && dropTarget.closest('#hand-area')) {
                putInHand(element);
            } else {
                // On s'assure qu'elle est bien sur le plateau (si elle venait du HUD mais lâchée trop haut)
                if(element.parentNode !== board) putOnBoard(element, e.clientX, e.clientY);
            }
        } else {
            // Clic simple : on actualise le panneau avec la face *actuellement visible*
            const currentImg = element.dataset.flipped === 'true' ? element.dataset.backUrl : element.dataset.frontUrl;
            updateSidePanel(cardData, currentImg);
        }
    }
}

// --- FONCTIONS DE DÉPLACEMENT DE ZONES ---

function putInHand(cardElement) {
    cardElement.classList.add('in-hand');
    cardElement.style.left = ""; cardElement.style.top = ""; 
    cardElement.classList.remove('exhausted');
    cardElement.dataset.damage = 0;
    cardElement.querySelector('.token').classList.add('hidden');
    
    // Remet la carte à l'endroit dans la main
    if (cardElement.dataset.flipped === 'true') {
        cardElement.dataset.flipped = "false";
        cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
    }

    handArea.appendChild(cardElement);
}

function putOnBoard(cardElement, mouseX, mouseY) {
    cardElement.classList.remove('in-hand');
    cardElement.style.zIndex = topZIndex++;
    
    const rect = boardWrapper.getBoundingClientRect();
    const relX = mouseX - rect.left; const relY = mouseY - rect.top;
    
    const trueX = (relX - boardX) / scale - 75;
    const trueY = (relY - boardY) / scale - 105;

    cardElement.style.left = trueX + "px";
    cardElement.style.top = trueY + "px";
    board.appendChild(cardElement);
}

function discardCard(cardElement, cardCode) {
    cardElement.remove(); 
    discardPile.push(cardCode); 
    discardCountText.innerText = discardPile.length;
}