// --- CONFIGURATION & DOM CONSTANTS ---
const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');

// Boutons du menu modal
const btnOpenMenu = document.getElementById('btn-open-menu');
const modalMenu = document.getElementById('modal-menu');
const modalMenuClose = document.getElementById('modal-menu-close');
const btnAddNemesis = document.getElementById('btn-add-nemesis');

// Nouveaux éléments du Menu Principal
const btnLoadCustomDeck = document.getElementById('btn-load-custom-deck');
const deckUrlInput = document.getElementById('deck-url-input');
const heroSelect = document.getElementById('hero-select');
const btnLoadHero = document.getElementById('btn-load-hero');
const villainSelect = document.getElementById('villain-select');
const difficultySelect = document.getElementById('difficulty-select');
const modularSelect = document.getElementById('modular-select');
const btnLoadVillain = document.getElementById('btn-load-villain');

// Piles et zones
const deckElement = document.getElementById('deck');
const deckCountText = document.getElementById('deck-count');
const handArea = document.getElementById('hand-area');
const discardCountText = document.getElementById('discard-count');
const encounterDeckElement = document.getElementById('encounter-deck');
const encounterDeckCountText = document.getElementById('encounter-deck-count');
const encounterDiscardCountText = document.getElementById('encounter-discard-count');

// Panneau d'inspection
const zoomImg = document.getElementById('zoom-img');
const zoomTitle = document.getElementById('zoom-title');
const zoomTraits = document.getElementById('zoom-traits');
const zoomDesc = document.getElementById('zoom-desc');

// Menus contextuels
const contextMenu = document.getElementById('context-menu');
const pileContextMenu = document.getElementById('pile-context-menu');
const modalInspect = document.getElementById('modal-inspect');
const modalTitle = document.getElementById('modal-title');
const modalCardsContainer = document.getElementById('modal-cards-container');
const modalClose = document.getElementById('modal-close');

// --- BOUTONS ADDITIONNELS (Main / Défausse) ---
const btnDrawHand = document.createElement('button');
btnDrawHand.id = 'btn-draw-hand';
btnDrawHand.innerHTML = '🃏 Compléter Main';
btnDrawHand.style.backgroundColor = '#27ae60';
btnDrawHand.style.marginLeft = '10px';
btnDrawHand.classList.add('hidden'); 
document.getElementById('ui-panel').appendChild(btnDrawHand);

const menuPileShuffleIntoDeck = document.createElement('div');
menuPileShuffleIntoDeck.className = 'menu-item';
menuPileShuffleIntoDeck.id = 'menu-pile-shuffle-into-deck';
menuPileShuffleIntoDeck.innerText = 'Remélanger dans la pioche';
pileContextMenu.appendChild(menuPileShuffleIntoDeck);

// --- HÉROS ET PHASES DE JEU ---
const heroTracker = document.getElementById('hero-tracker');
const heroHpInput = document.getElementById('hero-hp-input');
const heroHandSizeSpan = document.getElementById('hero-hand-size');

const phases = document.querySelectorAll('#phase-list li');
let currentPhaseIndex = 0;
let currentHeroId = null;

const CARD_BACKS = { player: 'assets/player_back.jpg', encounter: 'assets/encounter_back.jpg' };
const CARD_BACKS_FALLBACK = {
    player: 'https://placehold.co/300x420/2980b9/FFF?text=MARVEL+CHAMPIONS',
    encounter: 'https://placehold.co/300x420/c0392b/FFF?text=RENCONTRE'
};

// --- ÉTAT DU JEU ---
let topZIndex = 10;
let myDeck = [], discardPile = [];
let encounterDeck = [], encounterDiscardPile = [];
let targetCard = null, targetPileType = null;
const CENTER_X = 2000, CENTER_Y = 2000;
let scale = 1;
let boardX = -CENTER_X + window.innerWidth / 2;
let boardY = -CENTER_Y + window.innerHeight / 2;

updateCamera();

btnOpenMenu.addEventListener('click', () => modalMenu.classList.remove('hidden'));
modalMenuClose.addEventListener('click', () => modalMenu.classList.add('hidden'));

// ==========================================
// 1. INITIALISATION DES MENUS VIA LA BASE DE DONNÉES (gamedata.js)
// ==========================================
function initMenus() {
    if (typeof MARVEL_DB === 'undefined') {
        alert("Erreur: Le fichier gamedata.js n'a pas été trouvé ou chargé.");
        return;
    }

    heroSelect.innerHTML = '<option value="">-- Sélectionner un Héros --</option>';
    MARVEL_DB.heroes.forEach(h => heroSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`);

    villainSelect.innerHTML = '<option value="">-- Sélectionner un Scénario --</option>';
    MARVEL_DB.villains.forEach(v => villainSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`);

    MARVEL_DB.modulars.forEach(m => modularSelect.innerHTML += `<option value="${m.id}">${m.name}</option>`);
}
initMenus();

// ==========================================
// 2. FONCTION DE TÉLÉCHARGEMENT DE CARTE
// ==========================================
async function fetchAPI(cardCode) {
    try {
        let resEN = await fetch(`https://marvelcdb.com/api/public/card/${cardCode}.json`);
        if (!resEN.ok) return null;
        let cardData = await resEN.json();

        try {
            let resFR = await fetch(`https://fr.marvelcdb.com/api/public/card/${cardCode}.json`);
            if (resFR.ok) {
                let frData = await resFR.json();
                if (frData.name) cardData.name = frData.name;
                if (frData.text) cardData.text = frData.text;
                if (frData.traits) cardData.traits = frData.traits;
            }
        } catch (e) {}

        return cardData;
    } catch (error) { 
        return null; 
    }
}

function getImageUrl(cardData) {
    if (!cardData) return '';
    if (cardData.imagesrc) return `https://marvelcdb.com${cardData.imagesrc}`;
    let code = cardData.code;
    if (cardData.type_code === 'main_scheme' && !code.endsWith('a') && !code.endsWith('b')) {
        return `https://marvelcdb.com/bundles/cards/${code}a.png`;
    }
    return `https://marvelcdb.com/bundles/cards/${code}.png`;
}

// CORRECTION : Retour du paramètre preferredFrontType pour forcer l'Alter-Ego
async function fetchCardDoubleSided(baseCode, preferredFrontType = null) {
    let core = baseCode.replace(/[ab]$/, '');
    let codeA = core + 'a';
    let codeB = core + 'b';
    
    let dataA = await fetchAPI(codeA);
    if (!dataA) dataA = await fetchAPI(core);
    let dataB = await fetchAPI(codeB);

    if (!dataA && !dataB) {
        let data = await fetchAPI(core);
        return { front: data, back: null };
    }

    let front = dataA || dataB;
    let back = dataB || dataA;

    if (preferredFrontType && dataA && dataB) {
        if (dataB.type_code === preferredFrontType && dataA.type_code !== preferredFrontType) {
            front = dataB;
            back = dataA;
        }
    }
    
    return { front: front, back: back };
}

// ==========================================
// 3. GÉNÉRATION DES PARTIES
// ==========================================

// --- DEPLOYER LE HÉROS DE LA BASE DE DONNÉES ---
btnLoadHero.addEventListener('click', async () => {
    const hId = heroSelect.value;
    if (!hId) return;
    
    const heroDef = MARVEL_DB.heroes.find(h => h.id === hId);
    if (!heroDef) return;

    modalMenu.classList.add('hidden');
    myDeck = [...heroDef.deck];
    await setupHero(heroDef.hero_code, heroDef.id);
});

btnLoadCustomDeck.addEventListener('click', async () => {
    const inputVal = deckUrlInput.value.trim();
    const urlMatch = inputVal.match(/(?:decklist|deck)\/(?:view|edit)?\/?(\d+)/);
    const fallbackMatch = inputVal.match(/\d+/);
    const deckId = urlMatch ? urlMatch[1] : (fallbackMatch ? fallbackMatch[0] : null);

    if (!deckId) { alert("Veuillez entrer une URL ou un ID valide (ex: 63906)."); return; }

    try {
        btnLoadCustomDeck.disabled = true;
        btnLoadCustomDeck.innerText = "Chargement...";
        
        let deckData = null;
        const endpoints = [
            `https://marvelcdb.com/api/public/decklist/${deckId}.json`,
            `https://marvelcdb.com/api/public/deck/${deckId}.json`
        ];

        for (let url of endpoints) {
            try {
                let res = await fetch(url);
                if (res.ok) { deckData = await res.json(); break; }
            } catch (e) {}
        }

        if (!deckData || !deckData.slots) throw new Error("Deck introuvable");

        myDeck = [];
        for (const [code, quantity] of Object.entries(deckData.slots)) {
            for (let i = 0; i < quantity; i++) myDeck.push(code);
        }

        const heroCode = deckData.hero_code || deckData.investigator_code;
        await setupHero(heroCode, null);
        
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
        modalMenu.classList.add('hidden');

    } catch (error) {
        alert("Erreur lors du chargement.");
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
    }
});

// INITIALISATION DU HÉROS (CORRIGÉ POUR L'ALTER-EGO)
async function setupHero(heroBaseCode, dbHeroId) {
    const cards = await fetchCardDoubleSided(heroBaseCode, 'alter_ego');
    if (!cards.front) return;
    
    currentHeroId = dbHeroId; 
    const coreCode = cards.front.code.replace(/[ab]$/, '');

    const indicesToRemove = [coreCode, coreCode + 'a', coreCode + 'b'];
    indicesToRemove.forEach(code => {
        let index;
        while ((index = myDeck.indexOf(code)) !== -1) {
            myDeck.splice(index, 1);
        }
    });
    
    let backUrl = cards.back ? getImageUrl(cards.back) : null;
    let heroDOM = buildCardDOM(cards.front, backUrl);
    
    heroDOM.dataset.cardDataA = JSON.stringify(cards.front);
    if (cards.back) heroDOM.dataset.cardDataB = JSON.stringify(cards.back);
    
    heroDOM.id = 'hero-card-element';
    heroDOM.dataset.handSizeA = cards.front.hand_size || 6;
    heroDOM.dataset.handSizeB = cards.back ? (cards.back.hand_size || 5) : 5;
    
    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;
    putOnBoardAt(heroDOM, spawnX, spawnY, false);

    heroTracker.classList.remove('hidden');
    heroHpInput.value = cards.front.health || 10;
    heroHandSizeSpan.innerText = heroDOM.dataset.handSizeA;
    
    if (btnAddNemesis) btnAddNemesis.classList.remove('hidden');
    btnDrawHand.classList.remove('hidden'); 
    
    shuffleArray(myDeck);
    deckElement.classList.remove('hidden');
    updateDeckCounters();

    await drawToHandSize();
}

// --- BOUTON NÉMÉSIS ---
if (btnAddNemesis) {
    btnAddNemesis.addEventListener('click', async () => {
        if (!currentHeroId) {
            alert("Ce Héros n'a pas été chargé depuis la base de données locale (gamedata.js), ou n'a pas de Set Némésis défini.");
            return;
        }

        const heroDef = MARVEL_DB.heroes.find(h => h.id === currentHeroId);
        if (!heroDef || !heroDef.nemesis) {
            alert("Aucune information Némésis trouvée pour ce héros dans la base de données.");
            return;
        }

        btnAddNemesis.innerText = "Recherche...";
        btnAddNemesis.disabled = true;

        try {
            const rect = boardWrapper.getBoundingClientRect();
            const spawnX = (rect.width / 2 - boardX) / scale;
            const spawnY = (rect.height / 2 - boardY) / scale;

            if (heroDef.nemesis.obligation) {
                encounterDeck.push(heroDef.nemesis.obligation);
            }

            let minionDeployed = false;
            let schemeDeployed = false;

            for (let code of heroDef.nemesis.set) {
                const cardData = await fetchAPI(code);
                if (!cardData) continue;

                if ((cardData.type_code === 'side_scheme' && !schemeDeployed) || 
                    (cardData.type_code === 'minion' && !minionDeployed)) {
                    
                    if (cardData.type_code === 'side_scheme') schemeDeployed = true;
                    if (cardData.type_code === 'minion') minionDeployed = true;

                    const dom = buildCardDOM(cardData);
                    putOnBoardAt(dom, spawnX + 150 + (Math.random() * 50), spawnY - 100 + (Math.random() * 50), false);
                } else {
                    encounterDeck.push(cardData.code); 
                }
            }
            
            shuffleArray(encounterDeck);
            updateDeckCounters();
            encounterDeckElement.classList.remove('hidden'); 
            
            btnAddNemesis.classList.add('hidden'); 
            alert(`🚨 L'Obligation a été mélangée et le Set Némésis a été déployé !`);

        } catch (e) {
            alert("Erreur lors de l'ajout du Némésis.");
        } finally {
            btnAddNemesis.innerText = "😈 Ajouter Némésis";
            btnAddNemesis.disabled = false;
        }
    });
}

// --- DEPLOYER LE MÉCHANT ET LE SCÉNARIO ---
btnLoadVillain.addEventListener('click', async () => {
    const vId = villainSelect.value;
    const diff = difficultySelect.value;
    const mId = modularSelect.value;

    if (!vId) return;
    modalMenu.classList.add('hidden');
    
    const villainDef = MARVEL_DB.villains.find(v => v.id === vId);
    
    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;

    for (let i = 0; i < villainDef.stages.length; i++) {
        let vData = await fetchAPI(villainDef.stages[i]);
        if (vData) {
            let vDom = buildCardDOM(vData);
            putOnBoardAt(vDom, spawnX + (i * 10), spawnY - 145, false);
        }
    }

    for (let i = 0; i < villainDef.schemes.length; i++) {
        let scheme = await fetchCardDoubleSided(villainDef.schemes[i], 'main_scheme');
        if (scheme.front) {
            let sDom = buildCardDOM(scheme.front, scheme.back ? getImageUrl(scheme.back) : null);
            sDom.dataset.cardDataA = JSON.stringify(scheme.front);
            if (scheme.back) sDom.dataset.cardDataB = JSON.stringify(scheme.back);
            sDom.id = i === 0 ? 'main-scheme-element' : '';
            putOnBoardAt(sDom, (spawnX - 250) + (i * 20), spawnY - 150 + (i * 20), false);
        }
    }

    encounterDeck = [...villainDef.base_deck];
    
    if (diff === 'standard' || diff === 'expert') {
        encounterDeck.push(...MARVEL_DB.difficulty.standard);
    }
    if (diff === 'expert') {
        encounterDeck.push(...MARVEL_DB.difficulty.expert);
    }
    if (mId !== 'none') {
        let modDef = MARVEL_DB.modulars.find(m => m.id === mId);
        encounterDeck.push(...modDef.cards);
    }

    shuffleArray(encounterDeck);
    encounterDeckElement.classList.remove('hidden');
    updateDeckCounters();
});

// ==========================================
// 4. SYSTÈME DE JEU
// ==========================================

document.getElementById('btn-next-phase').addEventListener('click', async () => {
    phases[currentPhaseIndex].classList.remove('active');
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    phases[currentPhaseIndex].classList.add('active');

    if (currentPhaseIndex === 1) {
        document.querySelectorAll('.card.exhausted').forEach(card => card.classList.remove('exhausted'));
        await drawToHandSize();
    }
    if (currentPhaseIndex === 2) {
        let mainScheme = document.getElementById('main-scheme-element');
        if (mainScheme) updateToken(mainScheme, 'threat', 1);
    }
});

btnDrawHand.addEventListener('click', drawToHandSize);

async function drawToHandSize() {
    if (!currentHeroId && myDeck.length === 0) return;
    const currentHandSize = parseInt(heroHandSizeSpan.innerText) || 5;
    const cardsInHand = handArea.querySelectorAll('.card').length;
    const cardsToDraw = currentHandSize - cardsInHand;
    
    if (cardsToDraw > 0) {
        for (let i = 0; i < cardsToDraw; i++) {
            if (myDeck.length === 0) {
                if (discardPile.length > 0) {
                    myDeck = [...discardPile];
                    discardPile = [];
                    shuffleArray(myDeck);
                    updateDeckCounters();
                    alert("⚠️ Pioche vide ! La défausse a été mélangée. N'oublie pas de te donner une carte rencontre face cachée.");
                } else {
                    break;
                }
            }
            await drawCard('player');
        }
    }
}

deckElement.addEventListener('click', () => drawCard('player'));
encounterDeckElement.addEventListener('click', () => drawCard('encounter'));

async function drawCard(type) {
    const pile = type === 'player' ? myDeck : encounterDeck;
    if (pile.length === 0) return;

    const code = pile.pop();
    updateDeckCounters();
    const data = await fetchAPI(code);
    if (!data) return;

    const cardDOM = buildCardDOM(data);
    
    // CORRECTION : Les cartes rencontres se posent désormais FACE CACHÉE sur le plateau
    if (type === 'player') {
        putInHand(cardDOM);
    } else {
        const rect = boardWrapper.getBoundingClientRect();
        const spawnX = (rect.width / 2 - boardX) / scale;
        const spawnY = (rect.height / 2 - boardY) / scale;
        putOnBoardAt(cardDOM, spawnX, spawnY, true); 
    }
}

function updateDeckCounters() {
    deckCountText.innerText = myDeck.length;
    deckElement.classList.toggle('hidden', myDeck.length === 0);
    discardCountText.innerText = discardPile.length;
    encounterDeckCountText.innerText = encounterDeck.length;
    encounterDeckElement.classList.toggle('hidden', encounterDeck.length === 0);
    encounterDiscardCountText.innerText = encounterDiscardPile.length;
}

function buildCardDOM(cardData, explicitBackUrl = null) {
    const card = document.createElement('div');
    card.classList.add('card');

    if (cardData.type_code === 'main_scheme' || cardData.type_code === 'side_scheme') {
        card.classList.add('landscape');
    }

    const isEncounter = cardData.faction_code === 'encounter' || cardData.type_code === 'minion' || cardData.type_code === 'side_scheme' || cardData.type_code === 'obligation' || cardData.type_code === 'villain';
    let defaultBack = isEncounter ? CARD_BACKS.encounter : CARD_BACKS.player;
    
    let frontUrl = getImageUrl(cardData);
    let backUrl = explicitBackUrl || defaultBack;

    card.dataset.damage = 0;
    card.dataset.threat = 0;
    card.dataset.code = cardData.code;
    card.dataset.faction = cardData.faction_code;
    card.dataset.flipped = "false";
    
    card.dataset.cardData = JSON.stringify(cardData);
    card.dataset.cardDataA = JSON.stringify(cardData);
    
    card.dataset.frontUrl = frontUrl;
    card.dataset.backUrl = backUrl;

    card.innerHTML = `
        <img src="${frontUrl}" class="card-front" alt="${cardData.name || 'Carte'}" onerror="this.onerror=null; this.src='${CARD_BACKS_FALLBACK[isEncounter ? 'encounter' : 'player']}';"/>
        <div class="token damage-token hidden">0</div>
        <div class="token threat-token hidden">0</div>
    `;

    setupCardInteractions(card);
    makeDraggable(card);
    return card;
}

// CORRECTION : Modification de la fonction pour permettre la pose face cachée
function putOnBoardAt(cardElement, x, y, faceDown = false) {
    cardElement.classList.remove('in-hand'); 
    cardElement.style.zIndex = topZIndex++;
    cardElement.style.left = x + "px"; 
    cardElement.style.top = y + "px";
    
    if (faceDown) {
        cardElement.dataset.flipped = "true";
        cardElement.querySelector('.card-front').src = cardElement.dataset.backUrl;
    } else {
        cardElement.dataset.flipped = "false";
        cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
    }
    
    board.appendChild(cardElement);
}

function putInHand(cardElement) {
    cardElement.classList.add('in-hand'); cardElement.style.left = ""; cardElement.style.top = "";
    cardElement.classList.remove('exhausted');
    cardElement.dataset.damage = 0; cardElement.dataset.threat = 0;
    cardElement.querySelector('.damage-token').classList.add('hidden'); cardElement.querySelector('.threat-token').classList.add('hidden');
    
    if (cardElement.dataset.flipped === 'true') {
        cardElement.dataset.flipped = "false"; 
        cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
    }
    handArea.appendChild(cardElement);
}

function discardCard(cardElement, forcedPile = null) {
    const code = cardElement.dataset.code; const faction = cardElement.dataset.faction;
    cardElement.remove();
    const isEncounter = forcedPile === 'encounter' || (!forcedPile && (faction === 'encounter' || faction === 'villain'));
    if (isEncounter) encounterDiscardPile.push(code); else discardPile.push(code);
    updateDeckCounters();
}

// --- INTERACTIONS DE CARTES & DRAG & DROP ---
function setupCardInteractions(card) {
    card.addEventListener('dblclick', () => {
        if (!card.classList.contains('in-hand')) card.classList.toggle('exhausted');
    });

    card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        hideAllMenus();
        targetCard = card;
        
        contextMenu.classList.remove('hidden');
        
        let x = e.clientX;
        let y = e.clientY;
        
        if (x + contextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - contextMenu.offsetWidth - 5;
        if (y + contextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - contextMenu.offsetHeight - 5;
        
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    });
}

function makeDraggable(element) {
    let isDragging = false, startX, startY;

    element.onmousedown = (e) => {
        if (e.target.closest('#phase-panel') || e.target.closest('#ui-panel')) return;
        if (e.button === 2) return;
        e.preventDefault(); e.stopPropagation();
        isDragging = false; startX = e.clientX; startY = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    };

    element.addEventListener('touchstart', (e) => {
        if (e.target.closest('#phase-panel') || e.target.closest('#ui-panel')) return;
        isDragging = false; 
        startX = e.touches[0].clientX; 
        startY = e.touches[0].clientY;
    }, {passive: true});

    function elementDrag(e) {
        e.preventDefault();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (!isDragging && (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3)) {
            isDragging = true;
            element.classList.remove('in-hand');
            element.style.zIndex = topZIndex++;
        }

        if (isDragging) {
            const isOverHUD = clientY > window.innerHeight - 140; 
            const isLandscape = element.classList.contains('landscape');

            if (isOverHUD) {
                if (element.parentNode !== document.body) {
                    document.body.appendChild(element);
                    element.classList.add('is-dragging-hud'); element.classList.remove('is-dragging-board');
                }
                const offsetW = isLandscape ? 60 : 42; 
                const offsetH = isLandscape ? 42 : 60;
                element.style.left = (clientX - offsetW) + "px"; element.style.top = (clientY - offsetH) + "px";
            } else {
                if (element.parentNode !== board) {
                    board.appendChild(element);
                    element.classList.add('is-dragging-board'); element.classList.remove('is-dragging-hud');
                }
                const rect = boardWrapper.getBoundingClientRect();
                const offsetW = isLandscape ? 84 : 60;
                const offsetH = isLandscape ? 60 : 84;
                const trueX = (clientX - rect.left - boardX) / scale - offsetW;
                const trueY = (clientY - rect.top - boardY) / scale - offsetH;
                element.style.left = trueX + "px"; element.style.top = trueY + "px";
            }
        }
    }

    function closeDragElement(e) {
        document.onmouseup = null; document.onmousemove = null;
        let clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        let clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

        if (isDragging) {
            element.style.visibility = 'hidden';
            const dropTarget = document.elementFromPoint(clientX, clientY);
            element.style.visibility = '';

            element.classList.remove('is-dragging-hud', 'is-dragging-board');
            
            if (dropTarget && dropTarget.closest('#discard-pile')) discardCard(element, 'player');
            else if (dropTarget && dropTarget.closest('#encounter-discard-pile')) discardCard(element, 'encounter');
            else if (dropTarget && dropTarget.closest('#hand-area')) putInHand(element);
            else if (element.parentNode !== board) putOnBoardAt(element, (clientX - boardX) / scale, (clientY - boardY) / scale, element.dataset.flipped === 'true');
        } else {
            const isFlipped = element.dataset.flipped === 'true';
            const currentImg = isFlipped ? element.dataset.backUrl : element.dataset.frontUrl;
            
            let dataToDisplay = element.dataset.cardData;
            if (isFlipped && element.dataset.cardDataB) {
                dataToDisplay = element.dataset.cardDataB;
            } else if (!isFlipped && element.dataset.cardDataA) {
                dataToDisplay = element.dataset.cardDataA;
            }

            updateSidePanel(dataToDisplay, currentImg);
        }
    }
}

// --- MENUS CONTEXTUELS ET ACTIONS ---
document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu') && !e.target.closest('#pile-context-menu')) hideAllMenus();
});

function hideAllMenus() {
    contextMenu.classList.add('hidden'); pileContextMenu.classList.add('hidden');
}

document.getElementById('menu-exhaust').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) targetCard.classList.toggle('exhausted');
    hideAllMenus();
});

document.getElementById('menu-flip').addEventListener('click', () => {
    if (targetCard) {
        const currentlyFlipped = targetCard.dataset.flipped === 'true';
        const willBeFlipped = !currentlyFlipped;
        
        targetCard.dataset.flipped = willBeFlipped;
        const newSrc = willBeFlipped ? targetCard.dataset.backUrl : targetCard.dataset.frontUrl;
        targetCard.querySelector('.card-front').src = newSrc;
        
        let dataToDisplay = targetCard.dataset.cardData;
        if (willBeFlipped && targetCard.dataset.cardDataB) {
            dataToDisplay = targetCard.dataset.cardDataB;
        } else if (!willBeFlipped && targetCard.dataset.cardDataA) {
            dataToDisplay = targetCard.dataset.cardDataA;
        }

        updateSidePanel(dataToDisplay, newSrc);

        if (targetCard.id === 'hero-card-element') {
            heroHandSizeSpan.innerText = willBeFlipped ? targetCard.dataset.handSizeB : targetCard.dataset.handSizeA;
        }
    }
    hideAllMenus();
});

document.getElementById('menu-dmg-plus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'damage', 1); hideAllMenus(); });
document.getElementById('menu-dmg-minus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'damage', -1); hideAllMenus(); });
document.getElementById('menu-thrt-plus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'threat', 1); hideAllMenus(); });
document.getElementById('menu-thrt-minus').addEventListener('click', () => { if (targetCard) updateToken(targetCard, 'threat', -1); hideAllMenus(); });

document.getElementById('menu-discard').addEventListener('click', () => {
    if (targetCard) discardCard(targetCard);
    hideAllMenus();
});

document.getElementById('menu-return-top').addEventListener('click', () => returnCardToDeck('top'));
document.getElementById('menu-return-bottom').addEventListener('click', () => returnCardToDeck('bottom'));
document.getElementById('menu-return-shuffle').addEventListener('click', () => returnCardToDeck('shuffle'));

function returnCardToDeck(position) {
    if (!targetCard) return;
    const code = targetCard.dataset.code;
    const isEncounter = targetCard.dataset.faction === 'encounter' || targetCard.dataset.faction === 'villain';
    const pile = isEncounter ? encounterDeck : myDeck;
    targetCard.remove();
    if (position === 'top') pile.push(code);
    else if (position === 'bottom') pile.unshift(code);
    else if (position === 'shuffle') { pile.push(code); shuffleArray(pile); }
    updateDeckCounters(); hideAllMenus();
}

function updateToken(card, type, amount) {
    if (card.classList.contains('in-hand')) return;
    let val = Math.max(0, parseInt(card.dataset[type]) + amount);
    card.dataset[type] = val;
    const tokenDisplay = card.querySelector(`.${type}-token`);
    tokenDisplay.innerText = val;
    tokenDisplay.classList.toggle('hidden', val === 0);
}

document.querySelectorAll('.pile-element').forEach(pile => {
    pile.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation(); hideAllMenus();
        targetPileType = pile.dataset.pile;
        
        if (targetPileType === 'player-discard' || targetPileType === 'encounter-discard') {
            menuPileShuffleIntoDeck.style.display = 'block';
        } else {
            menuPileShuffleIntoDeck.style.display = 'none';
        }

        pileContextMenu.classList.remove('hidden');
        
        let x = e.clientX;
        let y = e.clientY;
        if (x + pileContextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - pileContextMenu.offsetWidth - 5;
        if (y + pileContextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - pileContextMenu.offsetHeight - 5;
        
        pileContextMenu.style.left = x + 'px';
        pileContextMenu.style.top = y + 'px';
    });
});

menuPileShuffleIntoDeck.addEventListener('click', () => {
    hideAllMenus();
    if (targetPileType === 'player-discard') {
        myDeck = myDeck.concat(discardPile);
        discardPile = [];
        shuffleArray(myDeck);
        alert("La défausse Joueur a été mélangée dans la pioche.");
    } else if (targetPileType === 'encounter-discard') {
        encounterDeck = encounterDeck.concat(encounterDiscardPile);
        encounterDiscardPile = [];
        shuffleArray(encounterDeck);
        alert("La défausse Rencontre a été mélangée dans la pioche.");
    }
    updateDeckCounters();
});

document.getElementById('menu-pile-inspect').addEventListener('click', () => { hideAllMenus(); openInspectModal(targetPileType); });
document.getElementById('menu-pile-shuffle').addEventListener('click', () => {
    hideAllMenus(); let pile = getPileArray(targetPileType); if (pile) shuffleArray(pile);
});

function getPileArray(pileType) {
    switch(pileType) {
        case 'player-deck': return myDeck; case 'player-discard': return discardPile;
        case 'encounter-deck': return encounterDeck; case 'encounter-discard': return encounterDiscardPile;
        default: return null;
    }
}

async function openInspectModal(pileType) {
    const pile = getPileArray(pileType);
    if (!pile) return;
    modalCardsContainer.innerHTML = 'Chargement en cours...'; modalInspect.classList.remove('hidden');
    const pileNames = { 'player-deck': 'Pioche Joueur', 'player-discard': 'Défausse Joueur', 'encounter-deck': 'Pioche Rencontre', 'encounter-discard': 'Défausse Rencontre' };
    modalTitle.innerText = `${pileNames[pileType]} (${pile.length} cartes)`;
    modalCardsContainer.innerHTML = '';
    if (pile.length === 0) { modalCardsContainer.innerHTML = '<p>Cette pile est vide.</p>'; return; }
    
    for (let i = pile.length - 1; i >= 0; i--) {
        const code = pile[i]; const cardData = await fetchAPI(code);
        if (!cardData) continue;
        const item = document.createElement('div'); item.classList.add('inspect-card-item');
        
        const imgUrl = getImageUrl(cardData);
        
        item.innerHTML = `<img src="${imgUrl}" alt="${cardData.name}"/><button>Piocher</button>`;
        item.querySelector('button').addEventListener('click', () => {
            pile.splice(i, 1); updateDeckCounters();
            const cardDOM = buildCardDOM(cardData);
            if (pileType.includes('player')) putInHand(cardDOM); else putOnBoardAt(cardDOM, CENTER_X, CENTER_Y, true);
            modalInspect.classList.add('hidden');
        });
        modalCardsContainer.appendChild(item);
    }
}

modalClose.addEventListener('click', () => modalInspect.classList.add('hidden'));

// --- CAMÉRA (PAN & ZOOM) ---
boardWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08; const wheel = e.deltaY < 0 ? 1 : -1;
    const rect = boardWrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
    const targetX = (mouseX - boardX) / scale; const targetY = (mouseY - boardY) / scale;
    scale += wheel * zoomIntensity; scale = Math.max(0.3, Math.min(scale, 2.5));
    boardX = mouseX - (targetX * scale); boardY = mouseY - (targetY * scale);
    updateCamera();
});

let isPanning = false, startPanX = 0, startPanY = 0, hasPanned = false;
boardWrapper.addEventListener('mousedown', (e) => {
    if (e.target.closest('#phase-panel') || e.target.closest('#ui-panel')) return;
    if (e.target === boardWrapper || e.target === board) {
        isPanning = true; hasPanned = false; startPanX = e.clientX - boardX; startPanY = e.clientY - boardY;
    }
});
window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    hasPanned = true; boardX = e.clientX - startPanX; boardY = e.clientY - startPanY;
    updateCamera();
});
window.addEventListener('mouseup', () => { if (isPanning && !hasPanned) clearSidePanel(); isPanning = false; });

function updateCamera() { board.style.transform = `translate(${boardX}px, ${boardY}px) scale(${scale})`; }

function updateSidePanel(cardDataString, imageUrl) {
    if (!cardDataString) return;
    const cardData = JSON.parse(cardDataString);
    let cleanText = cardData.text ? cardData.text.replace(/\[.*?\]/g, '') : "Aucun texte.";
    zoomImg.src = imageUrl; zoomTitle.innerText = cardData.name || 'Inconnu';
    zoomTraits.innerText = cardData.traits || ''; zoomDesc.innerHTML = cleanText.replace(/\n/g, '<br>');
}
function clearSidePanel() {
    zoomImg.src = "https://placehold.co/300x420/2c3e50/FFF?text=Clique+sur+une+carte";
    zoomTitle.innerText = "---"; zoomTraits.innerText = ""; zoomDesc.innerText = "Sélectionne une carte.";
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
}