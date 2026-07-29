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

// --- HÉROS ET PHASES DE JEU ---
const heroTracker = document.getElementById('hero-tracker');
const heroHpInput = document.getElementById('hero-hp-input');
const heroHandSizeSpan = document.getElementById('hero-hand-size');

const phases = document.querySelectorAll('#phase-list li');
let currentPhaseIndex = 0;
let currentHeroCode = null; // Stocke l'ID du héros pour la Némésis

document.getElementById('btn-next-phase').addEventListener('click', () => {
    phases[currentPhaseIndex].classList.remove('active');
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    phases[currentPhaseIndex].classList.add('active');

    if (currentPhaseIndex === 1) {
        document.querySelectorAll('.card.exhausted').forEach(card => card.classList.remove('exhausted'));
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

// --- GESTION DU MENU PRINCIPAL ---
btnOpenMenu.addEventListener('click', () => modalMenu.classList.remove('hidden'));
modalMenuClose.addEventListener('click', () => modalMenu.classList.add('hidden'));

// --- APPELS API (Retour à la normale) ---
async function fetchAPI(cardCode) {
    try {
        const res = await fetch(`https://fr.marvelcdb.com/api/public/card/${cardCode}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) { return null; }
}

// --- DECKS ---
const fullSpideyDeck = ['01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009', '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065', '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'];

const rhinoEncounterDeck = [
    '01098', '01099', '01099', '01100', '01100', '01101', '01101', '01101', '01102', '01103', '01104', '01104', '01105', '01105',
    '01106', '01107', '01108', '01109', '01110', '01110',
    '01186', '01186', '01187', '01187', '01188', '01189', '01190'
];

// --- CHARGEMENT DES DECKS JOUEURS ---
btnLoadDeck.addEventListener('click', async () => {
    modalMenu.classList.add('hidden'); 
    myDeck = [...fullSpideyDeck];
    await setupHero('01001a');
});

// CHARGEMENT URL (Test de tous les endpoints MarvelCDB sans proxy)
btnLoadCustomDeck.addEventListener('click', async () => {
    const inputVal = deckUrlInput.value;
    const match = inputVal.match(/\b\d{4,6}\b/);
    if (!match) { alert("Veuillez entrer une URL ou un ID valide (ex: 63906)."); return; }
    
    const deckId = match[0];

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
            } catch (e) {
                // Ignore l'erreur et passe au lien suivant
            }
        }

        if (!deckData || !deckData.slots) throw new Error("Deck introuvable");

        myDeck = [];
        for (const [code, quantity] of Object.entries(deckData.slots)) {
            for (let i = 0; i < quantity; i++) myDeck.push(code);
        }

        await setupHero(deckData.investigator_code);
        
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
        modalMenu.classList.add('hidden');

    } catch (error) {
        alert("Erreur lors du chargement. Vérifiez que l'URL est correcte ou que le deck est public.");
        btnLoadCustomDeck.disabled = false;
        btnLoadCustomDeck.innerText = "Charger via URL";
    }
});

// SETUP HEROS (Forçage de la Face A - Alter Ego)
async function setupHero(heroBaseCode) {
    let heroCodeA = heroBaseCode;
    if (!heroCodeA.endsWith('a') && !heroCodeA.endsWith('b')) heroCodeA += 'a';
    if (heroCodeA.endsWith('b')) heroCodeA = heroCodeA.replace('b', 'a');
    let heroCodeB = heroCodeA.replace('a', 'b'); 
    
    currentHeroCode = heroCodeA;

    // Retirer les cartes héros de la pioche
    const indicesToRemove = [heroCodeA, heroCodeB, heroBaseCode];
    indicesToRemove.forEach(code => {
        const index = myDeck.indexOf(code);
        if (index !== -1) myDeck.splice(index, 1);
    });
    
    const heroDataA = await fetchAPI(heroCodeA);
    const heroDataB = await fetchAPI(heroCodeB); 
    
    if (heroDataA) {
        let heroDOM = buildCardDOM(heroDataA);
        
        heroDOM.dataset.frontUrl = `https://marvelcdb.com/bundles/cards/${heroCodeA}.png`;
        heroDOM.dataset.backUrl = `https://marvelcdb.com/bundles/cards/${heroCodeB}.png`;
        
        heroDOM.querySelector('.card-front').src = heroDOM.dataset.frontUrl;
        heroDOM.dataset.flipped = "false"; 
        
        heroDOM.dataset.cardDataA = JSON.stringify(heroDataA);
        if (heroDataB) heroDOM.dataset.cardDataB = JSON.stringify(heroDataB);
        
        heroDOM.id = 'hero-card-element';
        heroDOM.dataset.handSizeA = heroDataA.hand_size || 6;
        heroDOM.dataset.handSizeB = heroDataB ? (heroDataB.hand_size || 5) : 5;
        
        putOnBoardAt(heroDOM, CENTER_X, CENTER_Y + 150);
        heroTracker.classList.remove('hidden');
        heroHpInput.value = heroDataA.health || 10;
        
        // Affiche la taille de main de l'Alter-Ego
        heroHandSizeSpan.innerText = heroDOM.dataset.handSizeA;
        
        // Fait apparaître le bouton Némésis
        if (btnAddNemesis) btnAddNemesis.classList.remove('hidden');
    }
    
    shuffleArray(myDeck);
    deckElement.classList.remove('hidden');
    updateDeckCounters();
}

// LOGIQUE BOUTON NEMESIS (API standard)
if (btnAddNemesis) {
    btnAddNemesis.addEventListener('click', async () => {
        if (!currentHeroCode) return;
        btnAddNemesis.innerText = "Recherche...";
        btnAddNemesis.disabled = true;

        try {
            const res = await fetch(`https://fr.marvelcdb.com/api/public/cards/`);
            if (!res.ok) throw new Error("Impossible de joindre la BDD");
            
            const allCards = await res.json();
            const hero = allCards.find(c => c.code === currentHeroCode);
            if (!hero) throw new Error("Héros introuvable");

            // Isole le set d'Encounter du héros (Obligation + Némésis)
            const packCards = allCards.filter(c => c.pack_code === hero.pack_code && c.position > hero.position);
            packCards.sort((a, b) => a.position - b.position);
            const encounterCards = packCards.filter(c => c.faction_code === 'encounter' || c.type_code === 'obligation');
            
            // 1. Ajouter l'obligation dans le deck de rencontre
            const obligation = encounterCards.find(c => c.type_code === 'obligation');
            if (obligation) {
                encounterDeck.push(obligation.code);
            }

            // 2. Déployer la Némésis
            const nemesisMinion = encounterCards.find(c => c.type_code === 'minion');
            if (nemesisMinion && nemesisMinion.card_set_code) {
                const nemesisSet = allCards.filter(c => c.card_set_code === nemesisMinion.card_set_code);
                
                for (let cardData of nemesisSet) {
                    if (cardData.type_code === 'minion' || cardData.type_code === 'side_scheme') {
                        const dom = buildCardDOM(cardData);
                        putOnBoardAt(dom, CENTER_X + 250 + (Math.random() * 80), CENTER_Y - 100 + (Math.random() * 80));
                    } else {
                        encounterDeck.push(cardData.code); 
                    }
                }
            }
            
            shuffleArray(encounterDeck);
            updateDeckCounters();
            btnAddNemesis.classList.add('hidden');
            alert("🚨 L'Obligation est mélangée dans le deck de rencontre et la Némésis est déployée !");

        } catch (e) {
            alert("Erreur réseau lors du chargement de la Némésis.");
            console.error(e);
        } finally {
            btnAddNemesis.innerText = "😈 Ajouter Némésis";
            btnAddNemesis.disabled = false;
        }
    });
}

// --- CHARGEMENT DU MÉCHANT ---
btnLoadRhino.addEventListener('click', async () => {
    modalMenu.classList.add('hidden'); 
    encounterDeck = [...encounterDeck, ...rhinoEncounterDeck];

    const rhino2Data = await fetchAPI('01095');
    if (rhino2Data) {
        let dom = buildCardDOM(rhino2Data);
        dom.dataset.frontUrl = 'https://marvelcdb.com/bundles/cards/01095.png';
        dom.querySelector('.card-front').src = dom.dataset.frontUrl;
        putOnBoardAt(dom, CENTER_X + 5, CENTER_Y - 145);
    }

    const rhino1Data = await fetchAPI('01094');
    if (rhino1Data) {
        let dom = buildCardDOM(rhino1Data);
        dom.dataset.frontUrl = 'https://marvelcdb.com/bundles/cards/01094.png';
        dom.querySelector('.card-front').src = dom.dataset.frontUrl;
        putOnBoardAt(dom, CENTER_X, CENTER_Y - 150);
    }

    const schemeData = await fetchAPI('01097');
    const schemeDataB = await fetchAPI('01097b');
    if (schemeData) {
        let schemeDOM = buildCardDOM(schemeData);
        schemeDOM.dataset.frontUrl = 'https://marvelcdb.com/bundles/cards/01097.png'; 
        schemeDOM.dataset.backUrl = 'https://marvelcdb.com/bundles/cards/01097b.png';  
        schemeDOM.querySelector('.card-front').src = schemeDOM.dataset.frontUrl;
        schemeDOM.dataset.flipped = "false";
        
        schemeDOM.dataset.cardDataA = JSON.stringify(schemeData);
        if (schemeDataB) schemeDOM.dataset.cardDataB = JSON.stringify(schemeDataB);
        
        schemeDOM.id = 'main-scheme-element';
        putOnBoardAt(schemeDOM, CENTER_X - 250, CENTER_Y - 150);
    }

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
    else putOnBoardAt(cardDOM, CENTER_X, CENTER_Y);
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

    if (cardData.type_code === 'main_scheme') card.classList.add('landscape');

    const isEncounter = cardData.faction_code === 'encounter' || cardData.type_code === 'minion' || cardData.type_code === 'side_scheme' || cardData.type_code === 'obligation';
    let defaultBack = isEncounter ? CARD_BACKS.encounter : CARD_BACKS.player;
    
    let frontUrl = cardData.imagesrc ? `https://marvelcdb.com${cardData.imagesrc}` : `https://marvelcdb.com/bundles/cards/${cardData.code}.png`;
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
        <img src="${frontUrl}" class="card-front" alt="${cardData.name}" onerror="this.onerror=null; this.src='${CARD_BACKS_FALLBACK[isEncounter ? 'encounter' : 'player']}';"/>
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
            element.classList.remove('is-dragging-hud', 'is-dragging-board');
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
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
        
        pileContextMenu.classList.remove('hidden');
        
        let x = e.clientX;
        let y = e.clientY;
        if (x + pileContextMenu.offsetWidth > window.innerWidth) x = window.innerWidth - pileContextMenu.offsetWidth - 5;
        if (y + pileContextMenu.offsetHeight > window.innerHeight) y = window.innerHeight - pileContextMenu.offsetHeight - 5;
        
        pileContextMenu.style.left = x + 'px';
        pileContextMenu.style.top = y + 'px';
    });
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
        const imgUrl = cardData.imagesrc ? `https://marvelcdb.com${cardData.imagesrc}` : `https://marvelcdb.com/bundles/cards/${cardData.code}.png`;
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
    zoomImg.src = imageUrl; zoomTitle.innerText = cardData.name;
    zoomTraits.innerText = cardData.traits || ''; zoomDesc.innerHTML = cleanText.replace(/\n/g, '<br>');
}
function clearSidePanel() {
    zoomImg.src = "https://placehold.co/300x420/2c3e50/FFF?text=Clique+sur+une+carte";
    zoomTitle.innerText = "---"; zoomTraits.innerText = ""; zoomDesc.innerText = "Sélectionne une carte.";
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
}