// --- CONFIGURATION & DOM CONSTANTS ---
const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');

// Boutons du menu modal
const btnOpenMenu = document.getElementById('btn-open-menu');
const modalMenu = document.getElementById('modal-menu');
const modalMenuClose = document.getElementById('modal-menu-close');
const btnAddNemesis = document.getElementById('btn-add-nemesis');

const btnLoadDeck = document.getElementById('btn-load-deck');
const btnLoadCustomDeck = document.getElementById('btn-load-custom-deck');
const deckUrlInput = document.getElementById('deck-url-input');
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

const contextMenu = document.getElementById('context-menu');
const pileContextMenu = document.getElementById('pile-context-menu');
const modalInspect = document.getElementById('modal-inspect');
const modalTitle = document.getElementById('modal-title');
const modalCardsContainer = document.getElementById('modal-cards-container');
const modalClose = document.getElementById('modal-close');

// --- CREATION DU BOUTON MULLIGAN/PIOCHE DYNAMIQUE ---
const btnDrawHand = document.createElement('button');
btnDrawHand.id = 'btn-draw-hand';
btnDrawHand.innerHTML = '🃏 Compléter Main';
btnDrawHand.style.backgroundColor = '#27ae60';
btnDrawHand.style.marginLeft = '10px';
btnDrawHand.classList.add('hidden'); 
document.getElementById('ui-panel').appendChild(btnDrawHand);

btnDrawHand.addEventListener('click', drawToHandSize);

// --- AJOUT DYNAMIQUE DE L'OPTION DE REMÉLANGE DE LA DÉFAUSSE ---
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
let currentHeroCode = null;

document.getElementById('btn-next-phase').addEventListener('click', async () => {
    phases[currentPhaseIndex].classList.remove('active');
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    phases[currentPhaseIndex].classList.add('active');

    // AUTOMATISATION : Redressement ET Pioche jusqu'à la taille de main
    if (currentPhaseIndex === 1) {
        document.querySelectorAll('.card.exhausted').forEach(card => card.classList.remove('exhausted'));
        await drawToHandSize();
    }
    if (currentPhaseIndex === 2) {
        let mainScheme = document.getElementById('main-scheme-element');
        if (mainScheme) updateToken(mainScheme, 'threat', 1);
    }
});

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
// 1. FONCTION HELPER : GESTION INTELLIGENTE DES IMAGES
// ==========================================
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
// 2. SYSTÈME D'API DOUBLE (ANGLAIS + TRADUCTION FR)
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

// ==========================================
// 2.bis. FETCH SÉCURISÉ POUR LA BASE GLOBALE (ANTI-CORS VIA PROXY)
// ==========================================
let globalCardsDB = null;
async function fetchGlobalCardsDB() {
    if (globalCardsDB) return globalCardsDB;
    
    // Utilisation d'un Proxy CORS pour contourner le blocage du navigateur sur le gros fichier
    const targetUrl = encodeURIComponent("https://marvelcdb.com/api/public/cards.json");
    
    try {
        let res = await fetch("https://api.allorigins.win/raw?url=" + targetUrl);
        if (res.ok) {
            globalCardsDB = await res.json();
            return globalCardsDB;
        }
    } catch (e) {
        console.warn("Échec du proxy principal, tentative de secours...");
    }

    try {
        let res2 = await fetch("https://corsproxy.io/?" + targetUrl);
        if (res2.ok) {
            globalCardsDB = await res2.json();
            return globalCardsDB;
        }
    } catch (e) {
        throw new Error("Impossible de télécharger l'annuaire des cartes (CORS et Proxys bloqués).");
    }
}

// ==========================================
// 3. FONCTION MODULABLE DOUBLE-FACE (HÉROS)
// ==========================================
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

    let front = dataA;
    let back = dataB;

    if (preferredFrontType && dataA && dataB) {
        if (dataB.type_code === preferredFrontType && dataA.type_code !== preferredFrontType) {
            front = dataB;
            back = dataA;
        }
    }
    
    return { front: front || back, back: back || front };
}

// ==========================================
// 4. SYSTÈME MODULAIRE POUR LES MÉCHANTS
// ==========================================
async function loadVillainPhase(villainCode, x, y) {
    const data = await fetchAPI(villainCode);
    if (data) {
        const dom = buildCardDOM(data);
        putOnBoardAt(dom, x, y);
    }
}

async function loadMainScheme(schemeCode, x, y) {
    let core = schemeCode.replace(/[ab]$/, '');
    let faceA = await fetchAPI(core);
    if (!faceA) faceA = await fetchAPI(core + 'a');
    let faceB = await fetchAPI(core + 'b');
    
    if (faceA) {
        let backUrl = faceB ? getImageUrl(faceB) : null;
        let schemeDOM = buildCardDOM(faceA, backUrl);
        
        schemeDOM.dataset.cardDataA = JSON.stringify(faceA);
        if (faceB) schemeDOM.dataset.cardDataB = JSON.stringify(faceB);
        
        schemeDOM.id = 'main-scheme-element';
        putOnBoardAt(schemeDOM, x, y);
    }
}

// ==========================================
// 5. FONCTION AUTOMATIQUE DE PIOCHE JUSQU'À TAILLE DE MAIN
// ==========================================
async function drawToHandSize() {
    if (!currentHeroCode) return;
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

// --- DECKS ---
const fullSpideyDeck = ['01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009', '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065', '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'];

const rhinoEncounterDeck = [
    '01098', '01099', '01099', '01100', '01100', '01101', '01101', '01101', '01102', '01103', '01104', '01104', '01105', '01105',
    '01106', '01107', '01108', '01109', '01110', '01110',
    '01186', '01186', '01187', '01187', '01188', '01189', '01190'
];

btnLoadDeck.addEventListener('click', async () => {
    modalMenu.classList.add('hidden'); 
    myDeck = [...fullSpideyDeck];
    await setupHero('01001a');
});

// CHARGEMENT URL 
btnLoadCustomDeck.addEventListener('click', async () => {
    const inputVal = deckUrlInput.value.trim();
    
    const urlMatch = inputVal.match(/(?:decklist|deck)\/(?:view|edit)?\/?(\d+)/);
    const fallbackMatch = inputVal.match(/\d+/);
    const deckId = urlMatch ? urlMatch[1] : (fallbackMatch ? fallbackMatch[0] : null);

    if (!deckId) { alert("Veuillez entrer une URL ou un ID valide (ex: 449 ou 63906)."); return; }

    try {
        btnLoadCustomDeck.disabled = true;
        btnLoadCustomDeck.innerText = "Chargement...";
        
        let deckData = null;
        const endpoints = [
            `https://marvelcdb.com/api/public/decklist/${deckId}.json`,
            `https://marvelcdb.com/api/public/decklist/${deckId}`,
            `https://fr.marvelcdb.com/api/public/decklist/${deckId}.json`,
            `https://marvelcdb.com/api/public/deck/${deckId}.json`,
            `https://marvelcdb.com/api/public/deck/${deckId}`
        ];

        for (let url of endpoints) {
            try {
                let res = await fetch(url);
                if (res.ok) {
                    deckData = await res.json();
                    break;
                }
            } catch (e) {}
        }

        if (!deckData || !deckData.slots) throw new Error("Deck introuvable");

        myDeck = [];
        for (const [code, quantity] of Object.entries(deckData.slots)) {
            for (let i = 0; i < quantity; i++) myDeck.push(code);
        }

        const heroCode = deckData.hero_code || deckData.investigator_code;
        await setupHero(heroCode);
        
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
        modalMenu.classList.add('hidden');

    } catch (error) {
        alert("Erreur lors du chargement.");
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
    }
});

// SETUP HÉROS
async function setupHero(heroBaseCode) {
    const cards = await fetchCardDoubleSided(heroBaseCode, 'alter_ego');
    if (!cards.front) return;
    
    currentHeroCode = cards.front.code;

    const coreCode = currentHeroCode.replace(/[ab]$/, '');
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
    
    // Fait apparaitre le héros au centre de la caméra
    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;
    putOnBoardAt(heroDOM, spawnX, spawnY);

    heroTracker.classList.remove('hidden');
    heroHpInput.value = cards.front.health || 10;
    heroHandSizeSpan.innerText = heroDOM.dataset.handSizeA;
    
    if (btnAddNemesis) btnAddNemesis.classList.remove('hidden');
    btnDrawHand.classList.remove('hidden'); 
    
    shuffleArray(myDeck);
    deckElement.classList.remove('hidden');
    updateDeckCounters();

    // AUTOMATISATION : Pioche de départ automatique
    await drawToHandSize();
}

// LOGIQUE BOUTON NEMESIS (MÉTHODE UNIVERSELLE MARVELCDB AVEC FETCH SÉCURISÉ PROXY)
if (btnAddNemesis) {
    btnAddNemesis.addEventListener('click', async () => {
        if (!currentHeroCode) {
            alert("Veuillez d'abord charger un deck ou un héros !");
            return;
        }

        btnAddNemesis.innerText = "Recherche...";
        btnAddNemesis.disabled = true;

        try {
            // Utilisation de notre fonction anti-CORS via Proxy
            const allCards = await fetchGlobalCardsDB();
            
            // Trouver le code du Set du Héros actuel
            const heroCoreCode = currentHeroCode.replace(/[ab]$/, '');
            const heroCard = allCards.find(c => c.code === currentHeroCode || c.code === heroCoreCode || c.code === heroCoreCode + 'a');
            
            if (!heroCard) throw new Error("Héros introuvable dans l'annuaire.");

            const heroSetCode = heroCard.card_set_code || heroCard.set_code;
            if (!heroSetCode) throw new Error("Ce héros n'a pas de Set défini dans l'API.");

            // Identification des cartes liées via le nommage standard de MarvelCDB
            const nemesisSetCode = heroSetCode + '_nemesis';
            
            const obligationCard = allCards.find(c => (c.card_set_code === heroSetCode || c.set_code === heroSetCode) && c.type_code === 'obligation');
            const nemesisCards = allCards.filter(c => c.card_set_code === nemesisSetCode || c.set_code === nemesisSetCode);

            if (!obligationCard && nemesisCards.length === 0) {
                throw new Error(`Némésis et Obligation introuvables (Set : ${nemesisSetCode})`);
            }

            // Déploiement selon les règles "Ombre du Passé"
            const rect = boardWrapper.getBoundingClientRect();
            const spawnX = (rect.width / 2 - boardX) / scale;
            const spawnY = (rect.height / 2 - boardY) / scale;

            // L'Obligation va toujours dans le deck de rencontre
            if (obligationCard) {
                encounterDeck.push(obligationCard.code);
            }

            // Drapeaux pour le Sbire Némésis et la Manigance Annexe
            let minionDeployed = false;
            let schemeDeployed = false;

            // Traitement du Set Némésis
            for (let cardData of nemesisCards) {
                if ((cardData.type_code === 'side_scheme' && !schemeDeployed) || 
                    (cardData.type_code === 'minion' && !minionDeployed)) {
                    
                    if (cardData.type_code === 'side_scheme') schemeDeployed = true;
                    if (cardData.type_code === 'minion') minionDeployed = true;

                    const dataWithFr = await fetchAPI(cardData.code);
                    const dom = buildCardDOM(dataWithFr || cardData);
                    
                    putOnBoardAt(dom, spawnX + 150 + (Math.random() * 50), spawnY - 100 + (Math.random() * 50));
                } else {
                    encounterDeck.push(cardData.code); 
                }
            }
            
            // Finalisation
            shuffleArray(encounterDeck);
            updateDeckCounters();
            encounterDeckElement.classList.remove('hidden'); 
            
            btnAddNemesis.classList.add('hidden'); 
            alert(`🚨 L'Obligation a été mélangée et le Set Némésis (${nemesisCards.length} cartes) a été déployé !`);

        } catch (e) {
            console.error("Erreur Némésis:", e);
            alert("Erreur: " + e.message);
        } finally {
            btnAddNemesis.innerText = "😈 Ajouter Némésis";
            btnAddNemesis.disabled = false;
        }
    });
}

// CHARGEMENT DU MÉCHANT
btnLoadRhino.addEventListener('click', async () => {
    modalMenu.classList.add('hidden'); 
    encounterDeck = [...encounterDeck, ...rhinoEncounterDeck];

    const rect = boardWrapper.getBoundingClientRect();
    const spawnX = (rect.width / 2 - boardX) / scale;
    const spawnY = (rect.height / 2 - boardY) / scale;

    await loadVillainPhase('01095', spawnX + 5, spawnY - 145);
    await loadVillainPhase('01094', spawnX, spawnY - 150);
    await loadMainScheme('01097', spawnX - 250, spawnY - 150);

    shuffleArray(encounterDeck);
    encounterDeckElement.classList.remove('hidden');
    updateDeckCounters();
});

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
    if (type === 'player') putInHand(cardDOM);
    else {
        const rect = boardWrapper.getBoundingClientRect();
        const spawnX = (rect.width / 2 - boardX) / scale;
        const spawnY = (rect.height / 2 - boardY) / scale;
        putOnBoardAt(cardDOM, spawnX, spawnY);
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

// --- CONSTRUCTEUR DU DOM CARTE ---
function buildCardDOM(cardData, explicitBackUrl = null) {
    const card = document.createElement('div');
    card.classList.add('card');

    if (cardData.type_code === 'main_scheme' || cardData.type_code === 'side_scheme') {
        card.classList.add('landscape');
    }

    const isEncounter = cardData.faction_code === 'encounter' || cardData.type_code === 'minion' || cardData.type_code === 'side_scheme' || cardData.type_code === 'obligation';
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

    function elementDrag(e) {
        e.preventDefault();
        if (!isDragging && (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3)) {
            isDragging = true;
            element.classList.remove('in-hand');
            element.style.zIndex = topZIndex++;
        }

        if (isDragging) {
            const isOverHUD = e.clientY > window.innerHeight - 140; 
            const isLandscape = element.classList.contains('landscape');

            if (isOverHUD) {
                if (element.parentNode !== document.body) {
                    document.body.appendChild(element);
                    element.classList.add('is-dragging-hud'); element.classList.remove('is-dragging-board');
                }
                const offsetW = isLandscape ? 60 : 42; 
                const offsetH = isLandscape ? 42 : 60;
                element.style.left = (e.clientX - offsetW) + "px"; element.style.top = (e.clientY - offsetH) + "px";
            } else {
                if (element.parentNode !== board) {
                    board.appendChild(element);
                    element.classList.add('is-dragging-board'); element.classList.remove('is-dragging-hud');
                }
                const rect = boardWrapper.getBoundingClientRect();
                const offsetW = isLandscape ? 84 : 60;
                const offsetH = isLandscape ? 60 : 84;
                const trueX = (e.clientX - rect.left - boardX) / scale - offsetW;
                const trueY = (e.clientY - rect.top - boardY) / scale - offsetH;
                element.style.left = trueX + "px"; element.style.top = trueY + "px";
            }
        }
    }

    function closeDragElement(e) {
        document.onmouseup = null; document.onmousemove = null;
        if (isDragging) {
            element.style.visibility = 'hidden';
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            element.style.visibility = '';

            element.classList.remove('is-dragging-hud', 'is-dragging-board');
            
            if (dropTarget && dropTarget.closest('#discard-pile')) discardCard(element, 'player');
            else if (dropTarget && dropTarget.closest('#encounter-discard-pile')) discardCard(element, 'encounter');
            else if (dropTarget && dropTarget.closest('#hand-area')) putInHand(element);
            else if (element.parentNode !== board) putOnBoardAt(element, (e.clientX - boardX) / scale, (e.clientY - boardY) / scale);
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
        
        // Cacher ou afficher l'option "Remélanger" si c'est une défausse
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

// ÉVÉNEMENT DU NOUVEAU BOUTON "REMÉLANGER LA DÉFAUSSE"
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
            if (pileType.includes('player')) putInHand(cardDOM); else putOnBoardAt(cardDOM, CENTER_X, CENTER_Y);
            modalInspect.classList.add('hidden');
        });
        modalCardsContainer.appendChild(item);
    }
}

modalClose.addEventListener('click', () => modalInspect.classList.add('hidden'));

function putOnBoardAt(cardElement, x, y) {
    cardElement.classList.remove('in-hand'); cardElement.style.zIndex = topZIndex++;
    cardElement.style.left = x + "px"; cardElement.style.top = y + "px";
    board.appendChild(cardElement);
}

function putInHand(cardElement) {
    cardElement.classList.add('in-hand'); cardElement.style.left = ""; cardElement.style.top = "";
    cardElement.classList.remove('exhausted');
    cardElement.dataset.damage = 0; cardElement.dataset.threat = 0;
    cardElement.querySelector('.damage-token').classList.add('hidden'); cardElement.querySelector('.threat-token').classList.add('hidden');
    if (cardElement.dataset.flipped === 'true') {
        cardElement.dataset.flipped = "false"; cardElement.querySelector('.card-front').src = cardElement.dataset.frontUrl;
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