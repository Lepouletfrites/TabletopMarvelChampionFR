// ==========================================
// BASE DE DONNÉES LOCALE - MARVEL CHAMPIONS
// ==========================================

const MARVEL_DB = {
    
    // --- HÉROS PRÉCONSTRUITS ---
    heroes: [
        {
            id: "spiderman_core",
            name: "Spider-Man - Justice (Boîte de base)",
            hero_code: "01001a",
            // Deck exact de 40 cartes + identité
            deck: ['01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009', '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065', '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'],
            nemesis: {
                obligation: "01165",
                set: ["01166", "01167", "01168", "01168", "01169"]
            }
        }
    ],

    // --- SCÉNARIOS DES MÉCHANTS ---
    villains: [
        {
            id: "rhino",
            name: "Rhino (Boîte de base)",
            stages: ["01094", "01095"], 
            schemes: ["01097"],         
            // Uniquement les cartes de l'affinité Rhino
            base_deck: ["01098", "01099", "01099", "01100", "01100", "01101", "01101", "01101", "01102", "01103", "01104", "01104", "01105", "01105", "01106", "01107"]
        }
    ],

    // --- SETS MODULAIRES ---
    modulars: [
        {
            id: "bomb_scare",
            name: "Alerte à la Bombe",
            cards: ["01108", "01109", "01110", "01110", "01111", "01112"]
        }
    ],

    // --- SETS DE DIFFICULTÉ ---
    difficulty: {
        // Les vrais codes MarvelCDB pour le Standard et Expert
        standard: ["01186", "01186", "01187", "01187", "01188", "01189", "01190"],
        expert: ["01191", "01192", "01193"]
    }
};