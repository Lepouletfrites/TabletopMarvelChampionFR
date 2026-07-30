// --- CONFIGURATION & DOM CONSTANTS ---
const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');

// Boutons du menu modal
const btnOpenMenu = document.getElementById('btn-open-menu');
const modalMenu = document.getElementById('modal-menu');
const modalMenuClose = document.getElementById('modal-menu-close');
const btnAddNemesis = document.getElementById('btn-add-nemesis');
const btnResetGame = document.getElementById('btn-reset-game');
const btnSaveGame = document.getElementById('btn-save-game'); 

// Nouveaux éléments du Menu Principal
const btnLoadCustomDeck = document.getElementById('btn-load-custom-deck');
const deckUrlInput = document.getElementById('deck-url-input');
const heroSelect = document.getElementById('hero-select');
const btnLoadHero = document.getElementById('btn-load-hero');
const villainSelect = document.getElementById('villain-select');
const difficultySelect = document.getElementById('difficulty-select');
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

// Nouveaux Boutons Menus progression Scenario
const menuNextScheme = document.getElementById('menu-next-scheme');
const menuNextVillain = document.getElementById('menu-next-villain');
const menuProgressionSeparator = document.getElementById('menu-progression-separator');

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
let resetInProgress = false; 

// --- GESTION DU SCÉNARIO ---
let currentVillainStages = [];
let currentVillainStageIndex = 0;
let currentVillainSchemes = [];
let currentSchemeIndex = 0;

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

if (btnSaveGame) {
    btnSaveGame.addEventListener('click', () => {
        saveGameState();
        alert("💾 Partie sauvegardée avec succès !");
    });
}

btnResetGame.addEventListener('click', () => {
    if(confirm("Êtes-vous sûr de vouloir tout effacer et recommencer la partie ?")) {
        resetInProgress = true; 
        localStorage.removeItem('marvelVTT_save');
        location.reload();
    }
});

// ==========================================
// 1. INITIALISATION DES MENUS VIA LA BASE DE DONNÉES
// ==========================================
function initMenus() {
    if (typeof MARVEL_DB === 'undefined') return;

    heroSelect.innerHTML = '<option value="">-- Sélectionner un Héros --</option>';
    MARVEL_DB.heroes.forEach(h => heroSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`);

    villainSelect.innerHTML = '<option value="">-- Sélectionner un Scénario --</option>';
    MARVEL_DB.villains.forEach(v => villainSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`);

    const modularList = document.getElementById('modular-list');
    if (modularList) {
        let html = `<label style="cursor: pointer; color: #f1c40f; display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" id="mod-default-checkbox" checked> 
            <b>Par défaut (défini par le Méchant)</b>
        </label>
        <div style="height: 1px; background: #7f8c8d; margin: 5px 0;"></div>`;
        
        MARVEL_DB.modulars.forEach(m => {
            html += `<label style="cursor: pointer; display: flex; align-items: center; gap: 5px; color: #ecf0f1;">
                <input type="checkbox" class="mod-checkbox" value="${m.id}"> 
                ${m.name}
            </label>`;
        });
        modularList.innerHTML = html;
    }
}

// ==========================================
// 2. FONCTIONS DE TÉLÉCHARGEMENT DE CARTE
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

// ==========================================
// 3. GÉNÉRATION DES PARTIES
// ==========================================

btnLoadHero.addEventListener('click', async () => {
    const hId = heroSelect.value;
    if (!hId) return;
    const heroDef = MARVEL_DB.heroes.find(h => h.id === hId);
    if (!heroDef) return;

    modalMenu.classList.add('hidden');
    myDeck = [...heroDef.deck];
    await setupHero(heroDef.hero_code, heroDef.id);
    saveGameState();
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
        
        let dbHeroId = null;
        if (typeof MARVEL_DB !== 'undefined') {
            const match = MARVEL_DB.heroes.find(h => h.hero_code.replace(/[ab]$/,'') === heroCode.replace(/[ab]$/,''));
            if (match) dbHeroId = match.id;
        }

        await setupHero(heroCode, dbHeroId);
        
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
        modalMenu.classList.add('hidden');
        saveGameState();

    } catch (error) {
        alert("Erreur lors du chargement.");
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
    }
});

async function setupHero(heroBaseCode, dbHeroId) {
    let coreCode = heroBaseCode.replace(/[ab]$/, '');
    
    let frontData = await fetchAPI(coreCode + 'a') || await fetchAPI(coreCode);
    let backData = await fetchAPI(coreCode + 'b');
    
    let startFace = backData || frontData; // Face de départ inversée (Alter-Ego)
    let altFace = frontData;               // Face de secours (Héros)
    
    currentHeroId = dbHeroId; 

    const indicesToRemove = [coreCode, coreCode + 'a', coreCode + 'b'];
    indicesToRemove.forEach(code => {
        let index;
        while ((index = myDeck.indexOf(code)) !== -1) {
            myDeck.splice(index, 1);
        }
    });
    
    let heroDOM = buildCardDOM(startFace, altFace ? getImageUrl(altFace) : null);
    
    heroDOM.dataset.cardDataA = JSON.stringify(startFace);
    if (altFace) heroDOM.dataset.cardDataB = JSON.stringify(altFace);
    
    heroDOM.id = 'hero-card-element';
    heroDOM.dataset.handSizeA = startFace.hand_size || 5;
    heroDOM.dataset.handSizeB = altFace ? (altFace.hand_size || 6) : 6;
    
    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;
    
    putOnBoardAt(heroDOM, spawnX, spawnY, false);

    heroTracker.classList.remove('hidden');
    heroHpInput.value = startFace.health || 10;
    heroHandSizeSpan.innerText = heroDOM.dataset.handSizeA;
    
    if (currentHeroId && btnAddNemesis) {
        btnAddNemesis.classList.remove('hidden');
    }
    
    btnDrawHand.classList.remove('hidden'); 
    
    shuffleArray(myDeck);
    deckElement.classList.remove('hidden');
    updateDeckCounters();

    await drawToHandSize();
}

// --- BOUTON NÉMÉSIS ---
if (btnAddNemesis) {
    btnAddNemesis.addEventListener('click', async () => {
        if (!currentHeroId) return;
        const heroDef = MARVEL_DB.heroes.find(h => h.id === currentHeroId);
        if (!heroDef || !heroDef.nemesis) return;

        btnAddNemesis.innerText = "Recherche...";
        btnAddNemesis.disabled = true;

        try {
            const rect = boardWrapper.getBoundingClientRect();
            const spawnX = (rect.width / 2 - boardX) / scale;
            const spawnY = (rect.height / 2 - boardY) / scale;

            if (heroDef.nemesis.obligation) encounterDeck.push(heroDef.nemesis.obligation);

            let minionDeployed = false, schemeDeployed = false;

            for (let code of heroDef.nemesis.set) {
                const cardData = await fetchAPI(code);
                if (!cardData) continue;

                if ((cardData.type_code === 'side_scheme' && !schemeDeployed) || (cardData.type_code === 'minion' && !minionDeployed)) {
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
            saveGameState();
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

    if (!vId) return;
    modalMenu.classList.add('hidden');
    
    const villainDef = MARVEL_DB.villains.find(v => v.id === vId);
    
    // Initialisation de la progression du scénario
    currentVillainStages = villainDef.stages;
    
    // CORRECTION EXPERT : Si Expert, on commence à l'index 1 (Stade II)
    currentVillainStageIndex = (diff === 'expert') ? 1 : 0; 
    currentVillainSchemes = villainDef.schemes;
    currentSchemeIndex = 0;

    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;

    // Déploiement uniquement du STADE initial (I ou II)
    if (currentVillainStages.length > currentVillainStageIndex) {
        let vData = await fetchAPI(currentVillainStages[currentVillainStageIndex]);
        if (vData) {
            let vDom = buildCardDOM(vData);
            putOnBoardAt(vDom, spawnX, spawnY - 145, false);
        }
    }

    // Déploiement uniquement de la MANIGANCE PRINCIPALE 1
    if (currentVillainSchemes.length > 0) {
        let baseCode = currentVillainSchemes[0].replace(/[ab]$/, '');
        let frontData = await fetchAPI(baseCode); 
        let backData = await fetchAPI(baseCode + 'b'); 
        
        if (frontData) {
            let sDom = buildCardDOM(frontData, backData ? getImageUrl(backData) : null);
            sDom.dataset.cardDataA = JSON.stringify(frontData);
            if (backData) sDom.dataset.cardDataB = JSON.stringify(backData);
            sDom.id = `main-scheme-element`; // ID Unique pour le bouton phase suivante
            putOnBoardAt(sDom, spawnX - 250, spawnY - 150, false);
        }
    }

    encounterDeck = [...villainDef.base_deck];
    
    if (diff === 'standard' || diff === 'expert') encounterDeck.push(...MARVEL_DB.difficulty.standard);
    if (diff === 'expert') encounterDeck.push(...MARVEL_DB.difficulty.expert);
    
    const useDefaultMod = document.getElementById('mod-default-checkbox').checked;
    const selectedMods = Array.from(document.querySelectorAll('.mod-checkbox:checked')).map(cb => cb.value);
    
    let modularsToLoad = new Set(selectedMods);
    
    if (useDefaultMod && villainDef.default_modulars) {
        villainDef.default_modulars.forEach(modId => modularsToLoad.add(modId));
    }

    modularsToLoad.forEach(mId => {
        let modDef = MARVEL_DB.modulars.find(m => m.id === mId);
        if (modDef) encounterDeck.push(...modDef.cards);
    });

    shuffleArray(encounterDeck);
    encounterDeckElement.classList.remove('hidden');
    updateDeckCounters();
    saveGameState();
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
    saveGameState();
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
                } else { break; }
            }
            await drawCard('player');
        }
    }
    saveGameState();
}

deckElement.addEventListener('click', () => { drawCard('player'); saveGameState(); });
encounterDeckElement.addEventListener('click', () => { drawCard('encounter'); saveGameState(); });

async function drawCard(type) {
    const pile = type === 'player' ? myDeck : encounterDeck;
    if (pile.length === 0) return;

    const code = pile.pop();
    updateDeckCounters();
    const data = await fetchAPI(code);
    if (!data) return;

    const cardDOM = buildCardDOM(data);
    
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

// CORRECTION ORIENTATION POUR MANIGANCE PRINCIPALE
function updateCardOrientation(card) {
    if (!card.dataset || !card.dataset.cardData) return;
    let data = JSON.parse(card.dataset.cardData);
    let isFlipped = card.dataset.flipped === 'true'; 
    
    if (data.type_code === 'main_scheme') {
        // Toujours en paysage (recto et verso)
        card.classList.add('landscape');
    } else if (!isFlipped && data.type_code === 'side_scheme') {
        card.classList.add('landscape');
    } else {
        card.classList.remove('landscape');
    }
}

function buildCardDOM(cardData, explicitBackUrl = null) {
    const card = document.createElement('div');
    card.classList.add('card');

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

    updateCardOrientation(card);
    setupCardInteractions(card);
    makeDraggable(card);
    return card;
}

function syncTokenVisuals(card) {
    const dmg = parseInt(card.dataset.damage) || 0;
    const thrt = parseInt(card.dataset.threat) || 0;
    const dmgTok = card.querySelector('.damage-token');
    const thrtTok = card.querySelector('.threat-token');
    dmgTok.innerText = dmg; thrtTok.innerText = thrt;
    dmgTok.classList.toggle('hidden', dmg <= 0);
    thrtTok.classList.toggle('hidden', thrt <= 0);
}

function putOnBoardAt(cardElement, x, y, faceDown = false) {
    cardElement.classList.remove('in-hand'); 
    cardElement.style.zIndex = topZIndex++;
    cardElement.style.left = x + "px"; 
    cardElement.style.top = y + "px";
    
    cardElement.dataset.flipped = faceDown ? "true" : "false";
    cardElement.querySelector('.card-front').src = faceDown ? cardElement.dataset.backUrl : cardElement.dataset.frontUrl;
    
    updateCardOrientation(cardElement);

    board.appendChild(cardElement);
}

function putInHand(cardElement) {
    cardElement.classList.add('in-hand'); cardElement.style.left = ""; cardElement.style.top = "";
    cardElement.classList.remove('exhausted');
    cardElement.dataset.damage = 0; cardElement.dataset.threat = 0;
    syncTokenVisuals(cardElement);
    
    if (cardElement.dataset.flipped === 'true') {
        cardElement.dataset.flipped = "false"; 
        cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
    }
    
    updateCardOrientation(cardElement);
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
        
        let data = JSON.parse(card.dataset.cardData);
        let showSeparator = false;
        
        menuNextScheme.classList.add('hidden');
        menuNextVillain.classList.add('hidden');
        menuProgressionSeparator.classList.add('hidden');

        // Dynamiquement afficher les options de progression (Manigance)
        if (data.type_code === 'main_scheme' && currentSchemeIndex + 1 < currentVillainSchemes.length) {
            menuNextScheme.classList.remove('hidden');
            showSeparator = true;
        }
        
        // Dynamiquement afficher les options de progression (Méchant)
        if (data.type_code === 'villain' && currentVillainStageIndex + 1 < currentVillainStages.length) {
            menuNextVillain.classList.remove('hidden');
            showSeparator = true;
        }

        if (showSeparator) menuProgressionSeparator.classList.remove('hidden');

        let x = e.clientX, y = e.clientY;
        if (x + contextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - contextMenu.offsetWidth - 5;
        if (y + contextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - contextMenu.offsetHeight - 5;
        contextMenu.style.left = x + 'px'; contextMenu.style.top = y + 'px';
    });
}

// Bouton de progression: Manigance Suivante
menuNextScheme.addEventListener('click', async () => {
    if (targetCard) {
        let x = parseFloat(targetCard.style.left);
        let y = parseFloat(targetCard.style.top);
        
        targetCard.remove(); 
        
        currentSchemeIndex++;
        let baseCode = currentVillainSchemes[currentSchemeIndex].replace(/[ab]$/, '');
        let frontData = await fetchAPI(baseCode); 
        let backData = await fetchAPI(baseCode + 'b'); 
        
        if (frontData) {
            let sDom = buildCardDOM(frontData, backData ? getImageUrl(backData) : null);
            sDom.dataset.cardDataA = JSON.stringify(frontData);
            if (backData) sDom.dataset.cardDataB = JSON.stringify(backData);
            sDom.id = `main-scheme-element`;
            putOnBoardAt(sDom, x, y, false);
        }
        saveGameState();
    }
    hideAllMenus();
});

// Bouton de progression: Méchant Suivant
menuNextVillain.addEventListener('click', async () => {
    if (targetCard) {
        let x = parseFloat(targetCard.style.left);
        let y = parseFloat(targetCard.style.top);
        
        targetCard.remove();
        
        currentVillainStageIndex++;
        let vData = await fetchAPI(currentVillainStages[currentVillainStageIndex]);
        if (vData) {
            let vDom = buildCardDOM(vData);
            putOnBoardAt(vDom, x, y, false);
        }
        saveGameState();
    }
    hideAllMenus();
});


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
        isDragging = false; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, {passive: true});

    function elementDrag(e) {
        e.preventDefault();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (!isDragging && (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3)) {
            isDragging = true; element.classList.remove('in-hand'); element.style.zIndex = topZIndex++;
        }

        if (isDragging) {
            const isOverHUD = clientY > window.innerHeight - 140; 
            const isLandscape = element.classList.contains('landscape');
            if (isOverHUD) {
                if (element.parentNode !== document.body) {
                    document.body.appendChild(element);
                    element.classList.add('is-dragging-hud'); element.classList.remove('is-dragging-board');
                }
                const offsetW = isLandscape ? 60 : 42; const offsetH = isLandscape ? 42 : 60;
                element.style.left = (clientX - offsetW) + "px"; element.style.top = (clientY - offsetH) + "px";
            } else {
                if (element.parentNode !== board) {
                    board.appendChild(element);
                    element.classList.add('is-dragging-board'); element.classList.remove('is-dragging-hud');
                }
                const rect = boardWrapper.getBoundingClientRect();
                const offsetW = isLandscape ? 84 : 60; const offsetH = isLandscape ? 60 : 84;
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
            saveGameState();
        } else {
            const isFlipped = element.dataset.flipped === 'true';
            const currentImg = isFlipped ? element.dataset.backUrl : element.dataset.frontUrl;
            let dataToDisplay = element.dataset.cardData;
            if (isFlipped && element.dataset.cardDataB) dataToDisplay = element.dataset.cardDataB;
            else if (!isFlipped && element.dataset.cardDataA) dataToDisplay = element.dataset.cardDataA;
            updateSidePanel(dataToDisplay, currentImg);
        }
    }
}

// --- MENUS CONTEXTUELS ET ACTIONS ---
document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu') && !e.target.closest('#pile-context-menu')) hideAllMenus();
});

function hideAllMenus() { contextMenu.classList.add('hidden'); pileContextMenu.classList.add('hidden'); }

document.getElementById('menu-exhaust').addEventListener('click', () => {
    if (targetCard && !targetCard.classList.contains('in-hand')) targetCard.classList.toggle('exhausted');
    hideAllMenus(); saveGameState();
});

document.getElementById('menu-flip').addEventListener('click', () => {
    if (targetCard) {
        const currentlyFlipped = targetCard.dataset.flipped === 'true';
        const willBeFlipped = !currentlyFlipped;
        
        targetCard.dataset.flipped = willBeFlipped;
        const newSrc = willBeFlipped ? targetCard.dataset.backUrl : targetCard.dataset.frontUrl;
        targetCard.querySelector('.card-front').src = newSrc;
        
        let dataToDisplay = targetCard.dataset.cardData;
        if (willBeFlipped && targetCard.dataset.cardDataB) dataToDisplay = targetCard.dataset.cardDataB;
        else if (!willBeFlipped && targetCard.dataset.cardDataA) dataToDisplay = targetCard.dataset.cardDataA;
        updateSidePanel(dataToDisplay, newSrc);

        if (targetCard.id === 'hero-card-element') heroHandSizeSpan.innerText = willBeFlipped ? targetCard.dataset.handSizeB : targetCard.dataset.handSizeA;
        
        updateCardOrientation(targetCard);
    }
    hideAllMenus(); saveGameState();
});

document.getElementById('menu-dmg-plus').addEventListener('click', () => { if (targetCard) { updateToken(targetCard, 'damage', 1); saveGameState(); } hideAllMenus(); });
document.getElementById('menu-dmg-minus').addEventListener('click', () => { if (targetCard) { updateToken(targetCard, 'damage', -1); saveGameState(); } hideAllMenus(); });
document.getElementById('menu-thrt-plus').addEventListener('click', () => { if (targetCard) { updateToken(targetCard, 'threat', 1); saveGameState(); } hideAllMenus(); });
document.getElementById('menu-thrt-minus').addEventListener('click', () => { if (targetCard) { updateToken(targetCard, 'threat', -1); saveGameState(); } hideAllMenus(); });
document.getElementById('menu-discard').addEventListener('click', () => { if (targetCard) discardCard(targetCard); hideAllMenus(); saveGameState(); });
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
    updateDeckCounters(); hideAllMenus(); saveGameState();
}

function updateToken(card, type, amount) {
    if (card.classList.contains('in-hand')) return;
    let val = Math.max(0, parseInt(card.dataset[type]) + amount);
    card.dataset[type] = val;
    syncTokenVisuals(card);
}

document.querySelectorAll('.pile-element').forEach(pile => {
    pile.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation(); hideAllMenus();
        targetPileType = pile.dataset.pile;
        menuPileShuffleIntoDeck.style.display = (targetPileType === 'player-discard' || targetPileType === 'encounter-discard') ? 'block' : 'none';
        pileContextMenu.classList.remove('hidden');
        
        let x = e.clientX, y = e.clientY;
        if (x + pileContextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - pileContextMenu.offsetWidth - 5;
        if (y + pileContextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - pileContextMenu.offsetHeight - 5;
        pileContextMenu.style.left = x + 'px'; pileContextMenu.style.top = y + 'px';
    });
});

menuPileShuffleIntoDeck.addEventListener('click', () => {
    hideAllMenus();
    if (targetPileType === 'player-discard') { myDeck = myDeck.concat(discardPile); discardPile = []; shuffleArray(myDeck); }
    else if (targetPileType === 'encounter-discard') { encounterDeck = encounterDeck.concat(encounterDiscardPile); encounterDiscardPile = []; shuffleArray(encounterDeck); }
    updateDeckCounters(); saveGameState();
});

document.getElementById('menu-pile-inspect').addEventListener('click', () => { hideAllMenus(); openInspectModal(targetPileType); });
document.getElementById('menu-pile-shuffle').addEventListener('click', () => { hideAllMenus(); let pile = getPileArray(targetPileType); if (pile) shuffleArray(pile); saveGameState(); });

function getPileArray(pileType) {
    switch(pileType) { case 'player-deck': return myDeck; case 'player-discard': return discardPile; case 'encounter-deck': return encounterDeck; case 'encounter-discard': return encounterDiscardPile; default: return null; }
}

async function openInspectModal(pileType) {
    const pile = getPileArray(pileType); if (!pile) return;
    modalCardsContainer.innerHTML = 'Chargement en cours...'; modalInspect.classList.remove('hidden');
    const pileNames = { 'player-deck': 'Pioche Joueur', 'player-discard': 'Défausse Joueur', 'encounter-deck': 'Pioche Rencontre', 'encounter-discard': 'Défausse Rencontre' };
    modalTitle.innerText = `${pileNames[pileType]} (${pile.length} cartes)`;
    modalCardsContainer.innerHTML = '';
    if (pile.length === 0) { modalCardsContainer.innerHTML = '<p>Cette pile est vide.</p>'; return; }
    
    for (let i = pile.length - 1; i >= 0; i--) {
        const code = pile[i]; const cardData = await fetchAPI(code); if (!cardData) continue;
        const item = document.createElement('div'); item.classList.add('inspect-card-item');
        item.innerHTML = `<img src="${getImageUrl(cardData)}" alt="${cardData.name}"/><button>Piocher</button>`;
        item.querySelector('button').addEventListener('click', () => {
            pile.splice(i, 1); updateDeckCounters();
            const cardDOM = buildCardDOM(cardData);
            
            if (pileType.includes('player')) putInHand(cardDOM); 
            else putOnBoardAt(cardDOM, CENTER_X, CENTER_Y, false); 
            
            modalInspect.classList.add('hidden'); saveGameState();
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
    if (e.target === boardWrapper || e.target === board) { isPanning = true; hasPanned = false; startPanX = e.clientX - boardX; startPanY = e.clientY - boardY; }
});
window.addEventListener('mousemove', (e) => {
    if (!isPanning) return; hasPanned = true; boardX = e.clientX - startPanX; boardY = e.clientY - startPanY; updateCamera();
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

// ==========================================
// 5. SAUVEGARDE ET CHARGEMENT (LOCALSTORAGE)
// ==========================================
function saveGameState() {
    if (resetInProgress) return; 
    
    try {
        const state = {
            myDeck, discardPile, encounterDeck, encounterDiscardPile,
            currentHeroId, boardX, boardY, scale,
            heroHp: heroHpInput.value,
            heroHandSize: heroHandSizeSpan.innerText,
            
            // On sauvegarde l'état du scénario actuel
            currentVillainStages, currentVillainStageIndex,
            currentVillainSchemes, currentSchemeIndex,
            
            cards: []
        };
        
        document.querySelectorAll('.card').forEach(card => {
            state.cards.push({
                id: card.id,
                dataset: { ...card.dataset }, 
                inHand: card.classList.contains('in-hand'),
                exhausted: card.classList.contains('exhausted'),
                x: card.style.left,
                y: card.style.top,
                zIndex: card.style.zIndex
            });
        });
        
        localStorage.setItem('marvelVTT_save', JSON.stringify(state));
    } catch (e) {
        console.error("Erreur lors de la sauvegarde :", e);
    }
}

setInterval(saveGameState, 3000); 
window.addEventListener('beforeunload', saveGameState); 
document.addEventListener("visibilitychange", () => { 
    if (document.visibilityState === 'hidden') saveGameState();
});

function loadGameState() {
    const saved = localStorage.getItem('marvelVTT_save');
    if (!saved) {
        initMenus();
        return;
    }

    try {
        const state = JSON.parse(saved);
        
        myDeck = state.myDeck || [];
        discardPile = state.discardPile || [];
        encounterDeck = state.encounterDeck || [];
        encounterDiscardPile = state.encounterDiscardPile || [];
        currentHeroId = state.currentHeroId || null;
        
        // Restauration de l'état du scénario
        currentVillainStages = state.currentVillainStages || [];
        currentVillainStageIndex = state.currentVillainStageIndex || 0;
        currentVillainSchemes = state.currentVillainSchemes || [];
        currentSchemeIndex = state.currentSchemeIndex || 0;

        boardX = state.boardX || (-CENTER_X + window.innerWidth / 2);
        boardY = state.boardY || (-CENTER_Y + window.innerHeight / 2);
        scale = state.scale || 1;
        updateCamera();
        updateDeckCounters();

        if (state.heroHp) {
            heroHpInput.value = state.heroHp;
            heroTracker.classList.remove('hidden');
        }
        if (state.heroHandSize) {
            heroHandSizeSpan.innerText = state.heroHandSize;
        }

        if (currentHeroId && btnAddNemesis) btnAddNemesis.classList.remove('hidden');
        if (myDeck.length > 0 || discardPile.length > 0) btnDrawHand.classList.remove('hidden');

        // Reconstruction du plateau
        board.innerHTML = '';
        handArea.innerHTML = '';
        
        state.cards.forEach(cardState => {
            try {
                if (!cardState.dataset || !cardState.dataset.cardData) return;
                
                const cardData = JSON.parse(cardState.dataset.cardData);
                const dom = buildCardDOM(cardData, cardState.dataset.backUrl);
                
                for(let key in cardState.dataset) {
                    dom.dataset[key] = cardState.dataset[key];
                }
                dom.id = cardState.id || "";
                syncTokenVisuals(dom);
                
                if (cardState.dataset.flipped === "true") {
                    dom.querySelector('.card-front').src = dom.dataset.backUrl;
                }

                if (cardState.exhausted) dom.classList.add('exhausted');
                
                updateCardOrientation(dom);

                if (cardState.inHand) {
                    putInHand(dom);
                } else {
                    dom.style.left = cardState.x;
                    dom.style.top = cardState.y;
                    dom.style.zIndex = cardState.zIndex;
                    board.appendChild(dom);
                }
                
                if (parseInt(cardState.zIndex) >= topZIndex) topZIndex = parseInt(cardState.zIndex) + 1;
            } catch (err) {
                console.error("Impossible de charger une carte :", err);
            }
        });
        
    } catch (e) {
        console.error("Erreur de chargement :", e);
    }
    
    initMenus();
}

document.addEventListener("DOMContentLoaded", () => {
    loadGameState();
});