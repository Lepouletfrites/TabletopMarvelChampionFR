// --- CONFIGURATION & DOM CONSTANTS ---
const boardWrapper = document.getElementById('board-wrapper');
const board = document.getElementById('game-board');

// Boutons du menu modal et panneau latéral
const btnOpenMenu = document.getElementById('btn-open-menu');
const modalMenu = document.getElementById('modal-menu');
const modalMenuClose = document.getElementById('modal-menu-close');
const btnAddNemesis = document.getElementById('btn-add-nemesis');
const btnResetGame = document.getElementById('btn-reset-game');
const btnSaveGame = document.getElementById('btn-save-game'); 

const btnToggleSide = document.getElementById('btn-toggle-side');
const sidePanel = document.getElementById('side-panel');
const sidePanelOverlay = document.getElementById('side-panel-overlay');
const btnCloseSide = document.getElementById('btn-close-side');

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

// --- GESTION DES JETONS ---
let activeTokenType = null;
let activeTokenAction = null; 

// --- GESTION DES DECKS SECONDAIRES ---
let heroSecDeck = [];
let heroSecDiscard = [];

// Support dynamique pour plusieurs decks secondaires du méchant
let villainSecDecks = [[], [], []];
let villainSecDiscards = [[], [], []];
let vSecCount = 0;

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

// Boutons d'interface mobile
if(btnToggleSide) btnToggleSide.addEventListener('click', () => { sidePanel.classList.add('open'); sidePanelOverlay.classList.add('open'); });
if(btnCloseSide) btnCloseSide.addEventListener('click', () => { sidePanel.classList.remove('open'); sidePanelOverlay.classList.remove('open'); });
if(sidePanelOverlay) sidePanelOverlay.addEventListener('click', () => { sidePanel.classList.remove('open'); sidePanelOverlay.classList.remove('open'); });

btnOpenMenu.addEventListener('click', () => modalMenu.classList.remove('hidden'));
modalMenuClose.addEventListener('click', () => modalMenu.classList.add('hidden'));

// Fermer les modales en cliquant à l'extérieur
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
    modal.addEventListener('touchstart', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});

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
    await setupHero(heroDef.hero_code, heroDef.id, heroDef.secondary_deck);
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
        let dbSecondaryDeck = null;
        if (typeof MARVEL_DB !== 'undefined') {
            // Fait le lien avec la base de données locale pour trouver l'ID
            const match = MARVEL_DB.heroes.find(h => h.hero_code.replace(/[ab]$/,'') === heroCode.replace(/[ab]$/,''));
            if (match) {
                dbHeroId = match.id;
                dbSecondaryDeck = match.secondary_deck;
            }
        }

        await setupHero(heroCode, dbHeroId, dbSecondaryDeck);
        
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

async function setupHero(heroBaseCode, dbHeroId, secondaryDeckData = null) {
    let coreCode = heroBaseCode.replace(/[ab]$/, '');
    
    let frontData = await fetchAPI(coreCode + 'a') || await fetchAPI(coreCode);
    let backData = await fetchAPI(coreCode + 'b');
    
    let startFace = backData || frontData; // Face de départ inversée (Alter-Ego)
    let altFace = frontData;               // Face de secours (Héros)
    
    currentHeroId = dbHeroId; 

    // On retire l'identité du deck
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
    
    // POSITIONNEMENT ABSOLU POUR ALIGNEMENT PARFAIT
    const spawnX = CENTER_X;
    const spawnY = CENTER_Y + 400; // Espace vers le bas
    
    putOnBoardAt(heroDOM, spawnX, spawnY, false);

    heroTracker.classList.remove('hidden');
    heroHpInput.value = startFace.health || 10;
    heroHandSizeSpan.innerText = heroDOM.dataset.handSizeA;
    
    // GESTION CARTES DE DÉPART (START ON BOARD) POUR LE HÉROS
    if (currentHeroId) {
        const heroDef = MARVEL_DB.heroes.find(h => h.id === currentHeroId);
        if (heroDef && heroDef.start_on_board) {
            for (let code of heroDef.start_on_board) {
                // On cherche la carte dans le deck généré
                let idx = myDeck.indexOf(code);
                if (idx !== -1) {
                    // Si on la trouve, on la retire du deck
                    myDeck.splice(idx, 1);
                    // On la télécharge et on la pose
                    let cardData = await fetchAPI(code);
                    if (cardData) {
                        let cardDom = buildCardDOM(cardData);
                        // On la décale légèrement à droite du héros
                        putOnBoardAt(cardDom, spawnX + 160 + (Math.random() * 40), spawnY + (Math.random() * 40 - 20), false);
                    }
                }
            }
        }
    }

    // GESTION DECK SECONDAIRE HÉROS
    if (secondaryDeckData) {
        heroSecDeck = [...secondaryDeckData];
        shuffleArray(heroSecDeck);
        let hd = document.getElementById('board-hero-deck');
        let hdd = document.getElementById('board-hero-discard');
        hd.classList.remove('hidden');
        hdd.classList.remove('hidden');
        hd.style.left = (spawnX + 300) + "px"; // Décalé un peu plus loin à cause du start_on_board
        hd.style.top = (spawnY) + "px";
        hdd.style.left = (spawnX + 440) + "px";
        hd.style.top = (spawnY) + "px";
    }

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
            // Spawn au centre parfait
            const spawnX = CENTER_X;
            const spawnY = CENTER_Y;

            if (heroDef.nemesis.obligation) encounterDeck.push(heroDef.nemesis.obligation);

            let minionDeployed = false, schemeDeployed = false;

            for (let code of heroDef.nemesis.set) {
                const cardData = await fetchAPI(code);
                if (!cardData) continue;

                if ((cardData.type_code === 'side_scheme' && !schemeDeployed) || (cardData.type_code === 'minion' && !minionDeployed)) {
                    if (cardData.type_code === 'side_scheme') schemeDeployed = true;
                    if (cardData.type_code === 'minion') minionDeployed = true;

                    const dom = buildCardDOM(cardData);
                    // Placement légèrement décalé au centre
                    putOnBoardAt(dom, spawnX + (Math.random() * 100 - 50), spawnY + (Math.random() * 100 - 50), false);
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
    
    currentVillainStages = villainDef.stages;
    currentVillainStageIndex = (diff === 'expert') ? 1 : 0; 
    currentVillainSchemes = villainDef.schemes;
    currentSchemeIndex = 0;

    // POSITIONNEMENT ABSOLU POUR ALIGNEMENT PARFAIT
    const spawnX = CENTER_X;
    const spawnY = CENTER_Y - 400; // Espace vers le haut

    if (currentVillainStages.length > currentVillainStageIndex) {
        let vData = await fetchAPI(currentVillainStages[currentVillainStageIndex]);
        if (vData) {
            let vDom = buildCardDOM(vData);
            putOnBoardAt(vDom, spawnX, spawnY, false);
        }
    }

    if (currentVillainSchemes.length > 0) {
        let baseCode = currentVillainSchemes[0].replace(/[ab]$/, '');
        let frontData = await fetchAPI(baseCode); 
        let backData = await fetchAPI(baseCode + 'b'); 
        
        if (frontData) {
            let sDom = buildCardDOM(frontData, backData ? getImageUrl(backData) : null);
            sDom.dataset.cardDataA = JSON.stringify(frontData);
            if (backData) sDom.dataset.cardDataB = JSON.stringify(backData);
            sDom.id = `main-scheme-element`;
            putOnBoardAt(sDom, spawnX - 250, spawnY, false);
        }
    }
    
    // GESTION MULTIPLES DECKS SECONDAIRES MÉCHANT
    vSecCount = 0;
    villainSecDecks = [[], [], []];
    villainSecDiscards = [[], [], []];
    
    function deployVillainSecDeck(deckArray, title) {
        if (vSecCount >= 3) return; // Limite à 3 decks
        villainSecDecks[vSecCount] = [...deckArray];
        shuffleArray(villainSecDecks[vSecCount]);
        
        let vd = document.getElementById('board-villain-deck-' + vSecCount);
        let vdd = document.getElementById('board-villain-discard-' + vSecCount);
        vd.classList.remove('hidden');
        vdd.classList.remove('hidden');
        
        // On décale loin à droite pour ne pas gêner les "start_on_board"
        vd.style.left = (spawnX + 300 + (vSecCount * 150)) + "px";
        vd.style.top = (spawnY) + "px";
        vdd.style.left = (spawnX + 300 + (vSecCount * 150)) + "px";
        vdd.style.top = (spawnY + 180) + "px"; // Défausse en dessous
        
        if (title) vd.innerHTML = `${title}<br><span id="board-villain-deck-count-${vSecCount}">0</span>`;
        vSecCount++;
    }

    if (villainDef.secondary_deck) {
        deployVillainSecDeck(villainDef.secondary_deck, "DECK<br>SPÉCIAL");
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

    // On prépare une liste des cartes qui doivent démarrer en jeu
    let villainCardsToSpawn = [...(villainDef.start_on_board || [])];

    modularsToLoad.forEach(mId => {
        let modDef = MARVEL_DB.modulars.find(m => m.id === mId);
        if (modDef) {
            if (modDef.cards && modDef.cards.length > 0) encounterDeck.push(...modDef.cards);
            if (modDef.secondary_deck) {
                deployVillainSecDeck(modDef.secondary_deck, modDef.name.substring(0, 15).toUpperCase());
            }
            // Si le set modulaire a lui aussi des cartes "start_on_board", on les ajoute à la liste
            if (modDef.start_on_board) {
                villainCardsToSpawn.push(...modDef.start_on_board);
            }
        }
    });

    // PÊCHE DES CARTES START_ON_BOARD DANS LE DECK RENCONTRE
    for (let code of villainCardsToSpawn) {
        let idx = encounterDeck.indexOf(code);
        if (idx !== -1) {
            // Retire la carte du deck rencontre
            encounterDeck.splice(idx, 1);
            let cardData = await fetchAPI(code);
            if (cardData) {
                let cardDom = buildCardDOM(cardData);
                // On les pose légèrement à droite du méchant principal
                putOnBoardAt(cardDom, spawnX + 160 + (Math.random() * 40), spawnY + (Math.random() * 40 - 20), false);
            }
        }
    }

    shuffleArray(encounterDeck);
    encounterDeckElement.classList.remove('hidden');
    updateDeckCounters();
    saveGameState();
});

// ==========================================
// 4. SYSTÈME DE JEU ET JETONS
// ==========================================

// --- UI DES BOUTONS DE JETONS ---
document.querySelectorAll('.token-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        let type = btn.dataset.type;
        
        if (activeTokenType === type) {
            if (activeTokenAction === 'add') {
                activeTokenAction = 'sub';
            } else {
                activeTokenType = null;
                activeTokenAction = null;
            }
        } else {
            activeTokenType = type;
            activeTokenAction = 'add';
        }
        updateTokenBarUI();
    });
});

function updateTokenBarUI() {
    document.querySelectorAll('.token-btn').forEach(b => {
        let type = b.dataset.type;
        let baseText = b.dataset.basetext;
        
        if (activeTokenType === type) {
            b.classList.add('active');
            b.innerText = activeTokenAction === 'add' ? `${baseText} (+)` : `${baseText} (-)`;
        } else {
            b.classList.remove('active');
            b.innerText = baseText;
        }
    });
}

function applyTokenModeToCard(card, type, action) {
    if (card.classList.contains('in-hand')) return; 
    
    let val = parseInt(card.dataset[type]);
    if (isNaN(val)) val = card.dataset[type] === "true" ? 1 : 0; 
    
    if (action === 'add') val++;
    else val--;
    
    val = Math.max(0, val);
    card.dataset[type] = val;
    syncTokenVisuals(card);
}

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
        if (mainScheme) {
            let val = parseInt(mainScheme.dataset.threat || 0) + 1;
            mainScheme.dataset.threat = val;
            syncTokenVisuals(mainScheme);
        }
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
document.getElementById('board-hero-deck').addEventListener('click', () => { drawCard('hero-sec'); saveGameState(); });

for (let i = 0; i < 3; i++) {
    let d = document.getElementById('board-villain-deck-' + i);
    if (d) d.addEventListener('click', () => { drawCard('villain-sec-' + i); saveGameState(); });
}

async function drawCard(type) {
    let pile;
    let vIndex = -1;
    
    if (type === 'player') pile = myDeck;
    else if (type === 'encounter') pile = encounterDeck;
    else if (type === 'hero-sec') pile = heroSecDeck;
    else if (type.startsWith('villain-sec-')) {
        vIndex = parseInt(type.split('-')[2]);
        pile = villainSecDecks[vIndex];
    }
    
    if (!pile || pile.length === 0) return;

    const code = pile.pop();
    updateDeckCounters();
    const data = await fetchAPI(code);
    if (!data) return;

    const cardDOM = buildCardDOM(data);
    
    if (type === 'player') {
        putInHand(cardDOM);
    } else if (type === 'hero-sec') {
        let deckDom = document.getElementById('board-hero-deck');
        let x = parseFloat(deckDom.style.left) || CENTER_X;
        let y = parseFloat(deckDom.style.top) || CENTER_Y;
        putOnBoardAt(cardDOM, x, y + 180, false); 
    } else if (type.startsWith('villain-sec-')) {
        let deckDom = document.getElementById('board-villain-deck-' + vIndex);
        let x = parseFloat(deckDom.style.left) || CENTER_X;
        let y = parseFloat(deckDom.style.top) || CENTER_Y;
        putOnBoardAt(cardDOM, x, y + 180, false); 
    } else {
        const rect = boardWrapper.getBoundingClientRect();
        // Les cartes rencontres apparaissent au centre de l'écran par défaut
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
    
    document.getElementById('board-hero-deck-count').innerText = heroSecDeck.length;
    document.getElementById('board-hero-discard-count').innerText = heroSecDiscard.length;
    
    for (let i = 0; i < 3; i++) {
        let d = document.getElementById('board-villain-deck-count-' + i);
        let dd = document.getElementById('board-villain-discard-count-' + i);
        if (d && villainSecDecks[i]) d.innerText = villainSecDecks[i].length;
        if (dd && villainSecDiscards[i]) dd.innerText = villainSecDiscards[i].length;
    }
}

function updateCardOrientation(card) {
    if (!card.dataset || !card.dataset.cardData) return;
    let data = JSON.parse(card.dataset.cardData);
    let isFlipped = card.dataset.flipped === 'true'; 
    
    if (data.type_code === 'main_scheme') {
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
    card.dataset.generic = 0;
    card.dataset.tough = 0;
    card.dataset.stunned = 0;
    card.dataset.confused = 0;
    
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
        <div class="token generic-token hidden">0</div>
        <div class="status-container tough-container"></div>
        <div class="status-container stunned-container"></div>
        <div class="status-container confused-container"></div>
    `;

    updateCardOrientation(card);
    setupCardInteractions(card);
    makeDraggable(card);
    return card;
}

function syncTokenVisuals(card) {
    const dmg = parseInt(card.dataset.damage) || 0;
    const thrt = parseInt(card.dataset.threat) || 0;
    const gen = parseInt(card.dataset.generic) || 0;
    
    const dmgTok = card.querySelector('.damage-token');
    const thrtTok = card.querySelector('.threat-token');
    const genTok = card.querySelector('.generic-token');
    
    if(dmgTok) { dmgTok.innerText = dmg; dmgTok.classList.toggle('hidden', dmg <= 0); }
    if(thrtTok) { thrtTok.innerText = thrt; thrtTok.classList.toggle('hidden', thrt <= 0); }
    if(genTok) { genTok.innerText = gen; genTok.classList.toggle('hidden', gen <= 0); }
    
    let toughCount = parseInt(card.dataset.tough);
    if(isNaN(toughCount)) toughCount = card.dataset.tough === "true" ? 1 : 0;
    
    let stunnedCount = parseInt(card.dataset.stunned);
    if(isNaN(stunnedCount)) stunnedCount = card.dataset.stunned === "true" ? 1 : 0;
    
    let confusedCount = parseInt(card.dataset.confused);
    if(isNaN(confusedCount)) confusedCount = card.dataset.confused === "true" ? 1 : 0;
    
    const toughCont = card.querySelector('.tough-container');
    if(toughCont) {
        toughCont.innerHTML = '';
        for(let i=0; i<toughCount; i++) toughCont.innerHTML += `<div class="status-token" style="background-color:#e67e22; color:white;">TENACE</div>`;
    }
    
    const stunnedCont = card.querySelector('.stunned-container');
    if(stunnedCont) {
        stunnedCont.innerHTML = '';
        for(let i=0; i<stunnedCount; i++) stunnedCont.innerHTML += `<div class="status-token" style="background-color:#8e44ad; color:white;">SONNÉ</div>`;
    }
    
    const confusedCont = card.querySelector('.confused-container');
    if(confusedCont) {
        confusedCont.innerHTML = '';
        for(let i=0; i<confusedCount; i++) confusedCont.innerHTML += `<div class="status-token" style="background-color:#2ecc71; color:white;">DÉSORIENTÉ</div>`;
    }
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
    cardElement.dataset.damage = 0; 
    cardElement.dataset.threat = 0;
    cardElement.dataset.generic = 0;
    cardElement.dataset.tough = 0;
    cardElement.dataset.stunned = 0;
    cardElement.dataset.confused = 0;
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
    
    if (forcedPile === 'hero-sec') heroSecDiscard.push(code);
    else if (forcedPile && forcedPile.startsWith('villain-sec-discard-')) {
        let idx = parseInt(forcedPile.split('-')[3]);
        if(!isNaN(idx)) villainSecDiscards[idx].push(code);
    }
    else if (forcedPile === 'encounter' || (!forcedPile && (faction === 'encounter' || faction === 'villain'))) encounterDiscardPile.push(code); 
    else discardPile.push(code);
    
    updateDeckCounters();
}

// --- INTERACTIONS DE CARTES & DRAG & DROP ---
function setupCardInteractions(card) {
    card.addEventListener('dblclick', () => {
        if (activeTokenType) return; 
        if (!card.classList.contains('in-hand')) card.classList.toggle('exhausted');
    });

    let lastTap = 0;
    card.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            if (activeTokenType) return; 
            if (!card.classList.contains('in-hand')) card.classList.toggle('exhausted');
            e.preventDefault();
        }
        lastTap = currentTime;
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

        if (data.type_code === 'main_scheme' && currentSchemeIndex + 1 < currentVillainSchemes.length) {
            menuNextScheme.classList.remove('hidden');
            showSeparator = true;
        }
        
        if (data.type_code === 'villain' && currentVillainStageIndex + 1 < currentVillainStages.length) {
            menuNextVillain.classList.remove('hidden');
            showSeparator = true;
        }

        if (showSeparator) menuProgressionSeparator.classList.remove('hidden');

        let clientX = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : 0);
        let clientY = e.clientY || (e.touches && e.touches.length > 0 ? e.touches[0].clientY : 0);

        if (clientX + contextMenu.offsetWidth > window.innerWidth) clientX = window.innerWidth - contextMenu.offsetWidth - 5;
        if (clientY + contextMenu.offsetHeight > window.innerHeight) clientY = window.innerHeight - contextMenu.offsetHeight - 5;
        
        contextMenu.style.left = clientX + 'px'; 
        contextMenu.style.top = clientY + 'px';
    });
}

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
        isDragging = false; 
        startX = e.touches[0].clientX; 
        startY = e.touches[0].clientY;
        
        document.addEventListener('touchmove', elementTouchDrag, {passive: false});
        document.addEventListener('touchend', closeTouchDragElement);
    }, {passive: false});

    function elementDrag(e) { handleMove(e.clientX, e.clientY, e); }
    function elementTouchDrag(e) { handleMove(e.touches[0].clientX, e.touches[0].clientY, e); }

    function handleMove(clientX, clientY, e) {
        if (!isDragging && (Math.abs(clientX - startX) > 5 || Math.abs(clientY - startY) > 5)) {
            isDragging = true; 
            element.classList.remove('in-hand'); 
            element.style.zIndex = topZIndex++;
        }

        if (isDragging) {
            if(e.preventDefault) e.preventDefault(); 
            const isOverHUD = clientY > window.innerHeight - 165; 
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
        handleEnd(e.clientX, e.clientY);
    }

    function closeTouchDragElement(e) {
        document.removeEventListener('touchmove', elementTouchDrag);
        document.removeEventListener('touchend', closeTouchDragElement);
        if (e.changedTouches.length > 0) {
            let clientX = e.changedTouches[0].clientX;
            let clientY = e.changedTouches[0].clientY;
            handleEnd(clientX, clientY);
        }
    }

    function handleEnd(clientX, clientY) {
        if (isDragging) {
            element.style.visibility = 'hidden';
            const dropTarget = document.elementFromPoint(clientX, clientY);
            element.style.visibility = '';
            element.classList.remove('is-dragging-hud', 'is-dragging-board');
            
            if (dropTarget && dropTarget.closest('#board-hero-discard')) discardCard(element, 'hero-sec');
            else if (dropTarget && dropTarget.closest('.board-pile[data-pile^="villain-sec-discard-"]')) {
                discardCard(element, dropTarget.closest('.board-pile').dataset.pile);
            }
            else if (dropTarget && dropTarget.closest('#discard-pile')) discardCard(element, 'player');
            else if (dropTarget && dropTarget.closest('#encounter-discard-pile')) discardCard(element, 'encounter');
            else if (dropTarget && dropTarget.closest('#hand-area')) putInHand(element);
            else if (element.parentNode !== board) putOnBoardAt(element, (clientX - boardX) / scale, (clientY - boardY) / scale, element.dataset.flipped === 'true');
            saveGameState();
        } else {
            if (activeTokenType) {
                applyTokenModeToCard(element, activeTokenType, activeTokenAction);
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
}

// --- MENUS CONTEXTUELS ET ACTIONS ---
document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu') && !e.target.closest('#pile-context-menu')) hideAllMenus();
    
    if (!e.target.closest('#token-bar') && !e.target.closest('.card') && !e.target.closest('.token-btn')) {
        if (activeTokenType) { activeTokenType = null; activeTokenAction = null; updateTokenBarUI(); }
    }
});

document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('#context-menu') && !e.target.closest('#pile-context-menu') && !e.target.closest('.card') && !e.target.closest('.pile-element')) hideAllMenus();
    
    if (!e.target.closest('#token-bar') && !e.target.closest('.card') && !e.target.closest('.token-btn')) {
        if (activeTokenType) { activeTokenType = null; activeTokenAction = null; updateTokenBarUI(); }
    }
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

document.getElementById('menu-clear-tokens').addEventListener('click', () => { 
    if (targetCard) { 
        targetCard.dataset.damage = 0;
        targetCard.dataset.threat = 0;
        targetCard.dataset.generic = 0;
        targetCard.dataset.tough = 0;
        targetCard.dataset.stunned = 0;
        targetCard.dataset.confused = 0;
        syncTokenVisuals(targetCard);
        saveGameState(); 
    } 
    hideAllMenus(); 
});

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

document.querySelectorAll('.pile-element').forEach(pile => {
    pile.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation(); hideAllMenus();
        targetPileType = pile.dataset.pile;
        
        const isDiscard = targetPileType.includes('discard');
        menuPileShuffleIntoDeck.style.display = isDiscard ? 'block' : 'none';
        
        pileContextMenu.classList.remove('hidden');
        
        let clientX = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : 0);
        let clientY = e.clientY || (e.touches && e.touches.length > 0 ? e.touches[0].clientY : 0);
        
        if (clientX + pileContextMenu.offsetWidth > window.innerWidth) clientX = window.innerWidth - pileContextMenu.offsetWidth - 5;
        if (clientY + pileContextMenu.offsetHeight > window.innerHeight) clientY = window.innerHeight - pileContextMenu.offsetHeight - 5;
        
        pileContextMenu.style.left = clientX + 'px'; 
        pileContextMenu.style.top = clientY + 'px';
    });
});

menuPileShuffleIntoDeck.addEventListener('click', () => {
    hideAllMenus();
    if (targetPileType === 'player-discard') { myDeck = myDeck.concat(discardPile); discardPile = []; shuffleArray(myDeck); }
    else if (targetPileType === 'encounter-discard') { encounterDeck = encounterDeck.concat(encounterDiscardPile); encounterDiscardPile = []; shuffleArray(encounterDeck); }
    else if (targetPileType === 'hero-sec-discard') { heroSecDeck = heroSecDeck.concat(heroSecDiscard); heroSecDiscard = []; shuffleArray(heroSecDeck); }
    else if (targetPileType.startsWith('villain-sec-discard-')) { 
        let idx = parseInt(targetPileType.split('-')[3]);
        if(!isNaN(idx)) {
            villainSecDecks[idx] = villainSecDecks[idx].concat(villainSecDiscards[idx]); 
            villainSecDiscards[idx] = []; 
            shuffleArray(villainSecDecks[idx]); 
        }
    }
    updateDeckCounters(); saveGameState();
});

document.getElementById('menu-pile-inspect').addEventListener('click', () => { hideAllMenus(); openInspectModal(targetPileType); });
document.getElementById('menu-pile-shuffle').addEventListener('click', () => { hideAllMenus(); let pile = getPileArray(targetPileType); if (pile) shuffleArray(pile); saveGameState(); });

function getPileArray(pileType) {
    switch(pileType) { 
        case 'player-deck': return myDeck; 
        case 'player-discard': return discardPile; 
        case 'encounter-deck': return encounterDeck; 
        case 'encounter-discard': return encounterDiscardPile; 
        case 'hero-sec-deck': return heroSecDeck;
        case 'hero-sec-discard': return heroSecDiscard;
        default: 
            if (pileType.startsWith('villain-sec-deck-')) return villainSecDecks[parseInt(pileType.split('-')[3])];
            if (pileType.startsWith('villain-sec-discard-')) return villainSecDiscards[parseInt(pileType.split('-')[3])];
            return null; 
    }
}

async function openInspectModal(pileType) {
    const pile = getPileArray(pileType); if (!pile) return;
    modalCardsContainer.innerHTML = 'Chargement en cours...'; modalInspect.classList.remove('hidden');
    
    let pileName = "Pile";
    if(pileType === 'player-deck') pileName = "Pioche Joueur";
    else if(pileType === 'player-discard') pileName = "Défausse Joueur";
    else if(pileType === 'encounter-deck') pileName = "Pioche Rencontre";
    else if(pileType === 'encounter-discard') pileName = "Défausse Rencontre";
    else if(pileType === 'hero-sec-deck') pileName = "Deck Spécial (Héros)";
    else if(pileType === 'hero-sec-discard') pileName = "Défausse Spéciale (Héros)";
    else if(pileType.startsWith('villain-sec')) pileName = "Deck Spécial (Méchant)";

    modalTitle.innerText = `${pileName} (${pile.length} cartes)`;
    modalCardsContainer.innerHTML = '';
    if (pile.length === 0) { modalCardsContainer.innerHTML = '<p>Cette pile est vide.</p>'; return; }
    
    for (let i = pile.length - 1; i >= 0; i--) {
        const code = pile[i]; const cardData = await fetchAPI(code); if (!cardData) continue;
        const item = document.createElement('div'); item.classList.add('inspect-card-item');
        
        item.innerHTML = `<img src="${getImageUrl(cardData)}" alt="${cardData.name}" title="Cliquer pour afficher dans le panneau de zoom"/><button style="margin-top: 5px; width: 100%;">Mettre en jeu</button>`;
        
        item.querySelector('img').addEventListener('click', () => {
            updateSidePanel(JSON.stringify(cardData), getImageUrl(cardData));
            if (window.innerWidth <= 768) {
                document.getElementById('side-panel').classList.add('open');
                document.getElementById('side-panel-overlay').classList.add('open');
            }
        });

        item.querySelector('button').addEventListener('click', () => {
            pile.splice(i, 1); updateDeckCounters();
            const cardDOM = buildCardDOM(cardData);
            
            if (pileType.includes('player')) putInHand(cardDOM); 
            else if (pileType === 'hero-sec-deck' || pileType === 'hero-sec-discard') putOnBoardAt(cardDOM, CENTER_X, CENTER_Y, false);
            else if (pileType === 'villain-sec-deck' || pileType === 'villain-sec-discard') putOnBoardAt(cardDOM, CENTER_X, CENTER_Y, false);
            else putOnBoardAt(cardDOM, CENTER_X, CENTER_Y, false); 
            
            modalInspect.classList.add('hidden'); saveGameState();
        });
        modalCardsContainer.appendChild(item);
    }
}

modalClose.addEventListener('click', () => modalInspect.classList.add('hidden'));

// --- CAMÉRA (ORDINATEUR : MOLETTE ET SOURIS) ---
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

// --- CAMÉRA (MOBILE : GLISSEMENT ET PINCEMENT) ---
let initialPinchDistance = null;
let initialScale = scale;

boardWrapper.addEventListener('touchstart', (e) => {
    if (e.target.closest('#phase-panel') || e.target.closest('#ui-panel') || e.target.closest('.card') || e.target.closest('.pile-element')) return;
    
    if (e.touches.length === 1) {
        isPanning = true; hasPanned = false; 
        startPanX = e.touches[0].clientX - boardX; 
        startPanY = e.touches[0].clientY - boardY;
    } else if (e.touches.length === 2) {
        isPanning = false; 
        initialPinchDistance = getPinchDistance(e.touches);
        initialScale = scale;
    }
}, {passive: false});

boardWrapper.addEventListener('touchmove', (e) => {
    if (e.target.closest('#phase-panel') || e.target.closest('#ui-panel') || e.target.closest('.card') || e.target.closest('.pile-element')) return;
    
    if (e.touches.length === 1 && isPanning) {
        e.preventDefault(); 
        hasPanned = true; 
        boardX = e.touches[0].clientX - startPanX; 
        boardY = e.touches[0].clientY - startPanY; 
        updateCamera();
    } else if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault();
        const currentDistance = getPinchDistance(e.touches);
        const zoomFactor = currentDistance / initialPinchDistance;
        
        let newScale = initialScale * zoomFactor;
        newScale = Math.max(0.3, Math.min(newScale, 2.5));

        const rect = boardWrapper.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        const targetX = (centerX - boardX) / scale;
        const targetY = (centerY - boardY) / scale;

        scale = newScale;
        boardX = centerX - (targetX * scale);
        boardY = centerY - (targetY * scale);

        updateCamera();
        
        initialPinchDistance = currentDistance; 
        initialScale = scale;
    }
}, {passive: false});

boardWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) { initialPinchDistance = null; }
    if (e.touches.length === 0) { 
        if (isPanning && !hasPanned) clearSidePanel(); 
        isPanning = false; 
    }
});

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

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
            heroSecDeck, heroSecDiscard, 
            villainSecDecks, villainSecDiscards,
            currentHeroId, boardX, boardY, scale,
            heroHp: heroHpInput.value,
            heroHandSize: heroHandSizeSpan.innerText,
            
            currentVillainStages, currentVillainStageIndex,
            currentVillainSchemes, currentSchemeIndex,
            
            boardPiles: {
                heroDeck: { hidden: document.getElementById('board-hero-deck').classList.contains('hidden'), left: document.getElementById('board-hero-deck').style.left, top: document.getElementById('board-hero-deck').style.top },
                heroDiscard: { hidden: document.getElementById('board-hero-discard').classList.contains('hidden'), left: document.getElementById('board-hero-discard').style.left, top: document.getElementById('board-hero-discard').style.top },
                villainDecks: villainSecDecks.map((_, i) => ({
                    hidden: document.getElementById('board-villain-deck-'+i).classList.contains('hidden'),
                    left: document.getElementById('board-villain-deck-'+i).style.left,
                    top: document.getElementById('board-villain-deck-'+i).style.top,
                    name: document.getElementById('board-villain-deck-'+i).innerHTML
                })),
                villainDiscards: villainSecDiscards.map((_, i) => ({
                    hidden: document.getElementById('board-villain-discard-'+i).classList.contains('hidden'),
                    left: document.getElementById('board-villain-discard-'+i).style.left,
                    top: document.getElementById('board-villain-discard-'+i).style.top
                }))
            },
            
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
        
        heroSecDeck = state.heroSecDeck || [];
        heroSecDiscard = state.heroSecDiscard || [];
        villainSecDecks = state.villainSecDecks || [[], [], []];
        villainSecDiscards = state.villainSecDiscards || [[], [], []];
        
        currentHeroId = state.currentHeroId || null;
        
        currentVillainStages = state.currentVillainStages || [];
        currentVillainStageIndex = state.currentVillainStageIndex || 0;
        currentVillainSchemes = state.currentVillainSchemes || [];
        currentSchemeIndex = state.currentSchemeIndex || 0;

        boardX = state.boardX || (-CENTER_X + window.innerWidth / 2);
        boardY = state.boardY || (-CENTER_Y + window.innerHeight / 2);
        scale = state.scale || 1;
        updateCamera();

        if (state.heroHp) {
            heroHpInput.value = state.heroHp;
            heroTracker.classList.remove('hidden');
        }
        if (state.heroHandSize) {
            heroHandSizeSpan.innerText = state.heroHandSize;
        }

        if (state.boardPiles) {
            let hd = document.getElementById('board-hero-deck');
            let hdd = document.getElementById('board-hero-discard');
            if(state.boardPiles.heroDeck && hd) { hd.classList.toggle('hidden', state.boardPiles.heroDeck.hidden); hd.style.left = state.boardPiles.heroDeck.left; hd.style.top = state.boardPiles.heroDeck.top; }
            if(state.boardPiles.heroDiscard && hdd) { hdd.classList.toggle('hidden', state.boardPiles.heroDiscard.hidden); hdd.style.left = state.boardPiles.heroDiscard.left; hdd.style.top = state.boardPiles.heroDiscard.top; }
            
            if (state.boardPiles.villainDecks) {
                state.boardPiles.villainDecks.forEach((vd, i) => {
                    let dom = document.getElementById('board-villain-deck-'+i);
                    if (dom && vd) {
                        dom.classList.toggle('hidden', vd.hidden);
                        dom.style.left = vd.left;
                        dom.style.top = vd.top;
                        if (vd.name) dom.innerHTML = vd.name;
                    }
                });
            }
            if (state.boardPiles.villainDiscards) {
                state.boardPiles.villainDiscards.forEach((vdd, i) => {
                    let dom = document.getElementById('board-villain-discard-'+i);
                    if (dom && vdd) {
                        dom.classList.toggle('hidden', vdd.hidden);
                        dom.style.left = vdd.left;
                        dom.style.top = vdd.top;
                    }
                });
            }
        }

        if (currentHeroId && btnAddNemesis) btnAddNemesis.classList.remove('hidden');
        if (myDeck.length > 0 || discardPile.length > 0) btnDrawHand.classList.remove('hidden');

        updateDeckCounters();

        board.querySelectorAll('.card').forEach(c => c.remove());
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