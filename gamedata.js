// ==========================================
// BASE DE DONNÉES LOCALE - MARVEL CHAMPIONS
// ==========================================

const MARVEL_DB = {
    
    // --- HÉROS PRÉCONSTRUITS ---
    heroes: [
        // --- Existants (avec ID vérifiés) ---
        {
            id: "spiderman_core",
            name: "Spider-Man - Justice (Boîte de base)",
            hero_code: "01001a",
            deck: ['01001a', '01002', '01003', '01003', '01004', '01004', '01005', '01005', '01006', '01006', '01006', '01007', '01007', '01008', '01009', '01009', '01058', '01059', '01060', '01060', '01060', '01061', '01061', '01062', '01062', '01063', '01064', '01064', '01065', '01065', '01065', '01084', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093', '01093'],
            nemesis: {
                obligation: "01165",
                set: ["01166", "01167", "01168", "01168", "01169"]
            }
        },
        {
            id: "captainmarvel_core",
            name: "Captain Marvel - Commandement (Boîte de base)",
            hero_code: "01010a",
            deck: ['01010a', '01011', '01012', '01013', '01013', '01014', '01014', '01015', '01015', '01015', '01016', '01016', '01016', '01017', '01066', '01067', '01068', '01069', '01069', '01070', '01070', '01071', '01071', '01072', '01072', '01073', '01073', '01074', '01083', '01083', '01084', '01084', '01085', '01085', '01088', '01089', '01090', '01091', '01092', '01093', '01093'],
            nemesis: {
                obligation: "01175",
                set: ["01176", "01177", "01178", "01178", "01179"]
            }
        },
        {
            id: "shehulk_core",
            name: "Miss Hulk - Agressivité (Cartes de base)",
            hero_code: "01018a",
            deck: ['01018a', '01019', '01020', '01020', '01021', '01021', '01022', '01022', '01022', '01023', '01023', '01024', '01024', '01025', '01026'],
            nemesis: {
                obligation: "01160",
                set: ["01161", "01162", "01163", "01164", "01164"]
            }
        },
        {
            id: "blackpanther_core",
            name: "Black Panther - Protection (Cartes de base)",
            hero_code: "01027a",
            deck: ['01027a', '01028', '01029', '01029', '01029', '01030', '01031', '01031', '01031', '01031', '01032', '01032', '01033', '01034', '01035'],
            nemesis: {
                obligation: "01155",
                set: ["01156", "01157", "01158", "01159", "01159"]
            }
        },
        {
            id: "ironman_core",
            name: "Iron Man - Agressivité (Cartes de base)",
            hero_code: "01039a",
            deck: ['01039a', '01040', '01041', '01041', '01042', '01042', '01043', '01044', '01044', '01045', '01045', '01046', '01047', '01048', '01049'],
            nemesis: {
                obligation: "01170",
                set: ["01171", "01172", "01173", "01173", "01174"]
            }
        },
        {
            id: "doctor_strange",
            name: "Doctor Strange - Protection (Préconstruit + Deck Invocation)",
            hero_code: "09001a",
            deck: ["09001a", "09002", "09003", "09004", "09004", "09005", "09005", "09006", "09007", "09007", "09008", "09009", "09010", "09011", "09011", "09012", "09012", "09013", "09013", "09014", "09015", "09016", "09017", "09017", "09018", "09018", "09019", "09019", "09020", "09020", "09021", "09022", "09022", "09022", "09023", "09024", "09025", "09026", "09027", "09028"],
            secondary_deck: ["09032", "09033", "09034", "09035", "09036"],
            nemesis: {
                obligation: "09029",
                set: ["09030", "09031", "09031", "09031"]
            }
        },

        // --- Nouveaux Héros (Structure vide à compléter via API) ---
        { id: "captain_america", name: "Captain America", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "ms_marvel", name: "Ms. Marvel", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "thor", name: "Thor", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "black_widow", name: "Black Widow", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "hulk", name: "Hulk", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "hawkeye", name: "Hawkeye", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "spider_woman", name: "Spider-Woman", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "ant_man", name: "Ant-Man", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "wasp", name: "La Guêpe (Wasp)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "quicksilver", name: "Vif-Argent (Quicksilver)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "scarlet_witch", name: "La Sorcière Rouge (Scarlet Witch)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "venom", name: "Venom", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "spectrum", name: "Spectrum", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "adam_warlock", name: "Adam Warlock", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "nebula", name: "Nébula", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "war_machine", name: "War Machine", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "valkyrie", name: "Valkyrie", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "vision", name: "Vision", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "nova", name: "Nova", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "ironheart", name: "Ironheart", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "spider_ham", name: "Spider-Ham", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "spdr", name: "SP//dr", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "ghost_spider", name: "Ghost-Spider", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "miles_morales", name: "Miles Morales", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "cyclops", name: "Cyclope", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "phoenix", name: "Phénix", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "wolverine",
         name: "Wolverine", 
         hero_code: "35001a",
         start_on_board: ["35002"],
         deck: [], 
         nemesis: { 
             obligation: "35027", 
                    set: ["35028", "35029","35030","35030","35031"] 
         } 
        },
        { id: "storm", name: "Tornade (Storm)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "gambit", name: "Gambit", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "rogue", name: "Maligne (Rogue)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "cable", name: "Cable", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "domino", name: "Domino", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "psylocke", name: "Psylocke", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "angel", name: "Angel", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "x23", name: "X-23", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "deadpool", name: "Deadpool", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "bishop", name: "Bishop", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "magik", name: "Magik", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "iceman", name: "Iceberg (Iceman)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "jubilee", name: "Jubilé", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "nightcrawler", name: "Diable Manquant (Nightcrawler)", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } },
        { id: "magneto", name: "Magnéto", hero_code: "", deck: [], nemesis: { obligation: "", set: [] } }
    ],

    // --- SCÉNARIOS DES MÉCHANTS ---
    villains: [
        // --- Existants (avec ID vérifiés) ---
        {
            id: "rhino",
            name: "Rhino (Boîte de base)",
            stages: ["01094", "01095", "01096"], 
            schemes: ["01097"],         
            default_modulars: ["bomb_scare"],
            base_deck: ["01098", "01099", "01099", "01100", "01101", "01101", "01102", "01103", "01104", "01104", "01105", "01105", "01106", "01106", "01107", "01108"]
        },
        {
            id: "klaw",
            name: "Klaw (Boîte de base)",
            stages: ["01113", "01114","01115"], 
            schemes: ["01116", "01117"],         
            default_modulars: ["masters_of_evil"],
            base_deck: ["01118", "01119", "01120", "01120", "01121", "01121", "01122", "01122", "01123", "01123", "01124", "01124", "01125", "01126", "01127"]
        },
        {
            id: "ultron",
            name: "Ultron (Boîte de base)",
            stages: ["01134", "01135", "01136"], 
            schemes: ["01137", "01138", "01139"],         
            default_modulars: ["under_attack"],
            start_on_board: ["01140"],
            base_deck: ["01140", "01141", "01142", "01142", "01143", "01143", "01144", "01144", "01144a", "01144b", "01144c", "01145", "01145", "01146", "01146", "01147", "01147", "01148", "01149", "01150"]
        },
        {
            id: "thanos",
            name: "Thanos (L'Ombre du Titan Fou)",
            stages: ["21111", "21112", "21113"], 
            schemes: ["21114", "21115"],         
            default_modulars: ["infinity_gauntlet","children_of_thanos","black_order"],
            base_deck: ["21116", "21117", "21118", "21119", "21119", "21120", "21120", "21121", "21121", "21122", "21122", "21123", "21123", "21124"]
        },

        // --- Nouveaux Méchants (Structure vide à compléter via API) ---
        { id: "green_goblin_risky_business", name: "Le Bouffon Vert - Business en Risque", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "green_goblin_mutagen_formula", name: "Le Bouffon Vert - Formule Mutagène", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "wrecking_crew", name: "Les Démolisseurs", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "crossbones", name: "Crossbones", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "absorbing_man", name: "L'Homme-Absorbant", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "taskmaster", name: "Le Taskmaster", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "zola", name: "Arnim Zola", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "red_skull", name: "Crâne Rouge", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "kang", name: "Kang le Conquérant", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "drang", name: "Drang de la Confrérie Badoon", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "collector_infiltrate", name: "Le Collectionneur - Infiltration du Musée", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "collector_escape", name: "Le Collectionneur - Fuite du Musée", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "nebula_villain", name: "Nébula (Méchante)", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "ronan", name: "Ronan l'Accusateur", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "ebony_maw", name: "Ebony Maw", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "tower_defense", name: "Défense de la Tour", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "hela", name: "Hela", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "loki", name: "Loki", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "the_hood", name: "Le Capuchon (The Hood)", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "sandman", name: "L'Homme-Sable", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "venom_villain", name: "Venom (Méchant)", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "mysterio", name: "Mystério", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "sinister_six", name: "Les Six Sinistres", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "venom_goblin", name: "Venom-Bouffon", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "sabretooth", name: "Dents-de-Sabre", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "sentinel", name: "Sentinelle", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "master_mold", name: "Moule Initial", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "mansion_attack", name: "Attaque de l'Institut", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "magneto_villain", name: "Magnéto (Méchant)", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "magog", name: "Magog", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "spiral", name: "Spirale", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "mojo", name: "Mojo", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "morlock_siege", name: "Siège des Morlocks", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "on_the_run", name: "En Fuite", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "juggernaut", name: "Le Fléau (Juggernaut)", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "mister_sinister", name: "Monsieur Sinistre", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "stryfe", name: "Stryfe", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "unus", name: "Unus l'Intouchable", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "four_horsemen", name: "Les Quatre Cavaliers", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "apocalypse", name: "Apocalypse", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "dark_phoenix", name: "Phénix Noir", stages: [], schemes: [], default_modulars: [], base_deck: [] },
        { id: "en_sabah_nur", name: "En Sabah Nur", stages: [], schemes: [], default_modulars: [], base_deck: [] }
    ],

    // --- SETS MODULAIRES ---
    modulars: [
        // --- Existants (avec ID vérifiés) ---
        { id: "bomb_scare", name: "Alerte à la Bombe", cards: ["01109", "011010", "01110", "01111", "01112", "01112"] },
        { id: "masters_of_evil", name: "Les Maîtres du Mal", cards: ["01128", "01129", "01130", "01131", "01132", "01133", "01133"] },
        { id: "under_attack", name: "En Pleine Attaque", cards: ["01151", "01152", "01153", "01154", "01154"] },
        { id: "legions_of_hydra", name: "Légions de l'Hydra", cards: ["01180", "01180", "01181", "01182", "01182"] },
        { id: "doomsday_chair", name: "Le Siège de l'Apocalypse", cards: ["01183", "01183", "01184", "01185", "01185"] },
        { id: "black_order", name: "L'ordre noir", cards: ["21085", "21086", "21087", "21088"] },
        { id: "infinity_gauntlet", name: "Gant de l'Infini", cards: ["21129"], start_on_board: ["21129"], secondary_deck: ["21130", "21131", "21132", "21133", "21134", "21135"] },
        { id: "children_of_thanos", name: "Enfant de thanos", cards: ["21125", "21126", "21127", "21128", "21128"] },

        // --- Nouveaux Sets Modulaires (Structure vide à compléter via API) ---
        
        // Bouffon Vert (Green Goblin)
        { id: "goblin_gimmicks", name: "Gadgets du Bouffon", cards: [] },
        { id: "a_mess_of_things", name: "Un Sacré Bazar", cards: [] },
        { id: "power_drain", name: "Absorption de Pouvoir", cards: [] },
        { id: "running_interference", name: "Interférences", cards: [] },
        
        // L'Avènement de Crâne Rouge (Rise of Red Skull)
        { id: "experimental_weapons", name: "Armes Expérimentales", cards: [] },
        { id: "hydra_assault", name: "Assaut de l'Hydra", cards: [] },
        { id: "hydra_patrol", name: "Patrouille de l'Hydra", cards: [] },
        { id: "weapon_master", name: "Maître d'Armes", cards: [] },

        // Kang
        { id: "temporal", name: "Temporel", cards: [] },
        { id: "anachronauts", name: "Anachronautes", cards: [] },
        { id: "master_of_time", name: "Maître du Temps", cards: [] },

        // Convoitise Galactique (Galaxy's Most Wanted)
        { id: "band_of_badoon", name: "Bande de Badoon", cards: [] },
        { id: "menagerie_medley", name: "Méli-mélo de la Ménagerie", cards: [] },
        { id: "galactic_artifacts", name: "Artéfacts Galactiques", cards: [] },
        { id: "kree_militants", name: "Militants Kree", cards: [] },
        { id: "space_pirates", name: "Pirates de l'Espace", cards: [] },
        { id: "ship_command", name: "Commandement du Vaisseau", cards: [] },
        { id: "badoon_headhunter", name: "Chasseur de Têtes Badoon", cards: [] },

        // L'Ombre du Titan Fou (Mad Titan's Shadow)
        { id: "enchantress", name: "L'Enchanteresse", cards: [] },
        { id: "galactic_armory", name: "Armurerie Galactique", cards: [] },
        { id: "legions_of_hel", name: "Légions de Hel", cards: [] },
        { id: "frost_giants", name: "Géants des Glaces", cards: [] },

        // Le Capuchon (The Hood)
        { id: "beasty_boys", name: "Les Bestiaux", cards: [] },
        { id: "brothers_grimm", name: "Les Frères Grimm", cards: [] },
        { id: "crossfires_crew", name: "L'Équipe de Crossfire", cards: [] },
        { id: "mister_hyde", name: "Mister Hyde", cards: [] },
        { id: "sinister_syndicate", name: "Le Syndicat Sinistre", cards: [] },
        { id: "state_of_emergency", name: "État d'Urgence", cards: [] },
        { id: "streets_of_mayhem", name: "Rues du Chaos", cards: [] },
        { id: "wrecking_crew_modular", name: "Les Démolisseurs (Modulaire)", cards: [] },
        
        // Motifs Sinistres (Sinister Motives)
        { id: "city_in_chaos", name: "La Ville en Chaos", cards: [] },
        { id: "down_to_earth", name: "Retour sur Terre", cards: [] },
        { id: "goblin_gear", name: "Équipement du Bouffon", cards: [] },
        { id: "guerilla_tactics", name: "Tactiques de Guérilla", cards: [] },
        { id: "osborn_tech", name: "Technologie Osborn", cards: [] },
        { id: "personal_nightmare", name: "Cauchemar Personnel", cards: [] },
        { id: "sinister_assault", name: "Assaut Sinistre", cards: [] },
        { id: "symbiotic_strength", name: "Force Symbiotique", cards: [] },
        { id: "whispers_of_paranoia", name: "Murmures de Paranoïa", cards: [] },

        // Genèse Mutante (Mutant Genesis)
        { id: "brotherhood", name: "La Confrérie des Mauvais Mutants", cards: [] },
        { id: "mystique", name: "Mystique", cards: [] },
        { id: "zero_tolerance", name: "Tolérance Zéro", cards: [] },
        { id: "sentinels", name: "Sentinelles", cards: [] },
        { id: "acolytes", name: "Acolytes", cards: [] },
        { id: "future_past", name: "Futur Antérieur", cards: [] },

        // MojoMania
        { id: "crime", name: "Crime", cards: [] },
        { id: "fantasy", name: "Fantasy", cards: [] },
        { id: "horror", name: "Horreur", cards: [] },
        { id: "sci_fi", name: "Science-Fiction", cards: [] },
        { id: "sitcom", name: "Sitcom", cards: [] },
        { id: "western", name: "Western", cards: [] },

        // NeXT Evolution
        { id: "flight", name: "Vol", cards: [] },
        { id: "super_strength", name: "Super Force", cards: [] },
        { id: "telepathy", name: "Télépathie", cards: [] },
        { id: "morlocks", name: "Morlocks", cards: [] },
        { id: "mutant_peacemakers", name: "Pacificateurs Mutants", cards: [] },
        { id: "mutant_provocateurs", name: "Provocateurs Mutants", cards: [] },
        { id: "nasty_boys", name: "Les Mauvais Garçons", cards: [] },
        { id: "reavers", name: "Les Reavers", cards: [] },

        // L'Ère d'Apocalypse (Age of Apocalypse)
        { id: "clan_akkaba", name: "Clan Akkaba", cards: [] },
        { id: "hounds", name: "Les Chiens de Chasse", cards: [] },
        { id: "infinites", name: "Les Infinis", cards: [] },
        { id: "prelates", name: "Les Prélats", cards: [] },
        { id: "savage_land", name: "Terre Sauvage", cards: [] },
        { id: "dark_riders", name: "Les Cavaliers de l'Ombre", cards: [] }
    ],

    // --- SETS DE DIFFICULTÉ ---
    difficulty: {
        standard_1: { 
            cards: ["01186", "01186", "01187", "01187", "01188", "01189", "01190"] 
        },
        expert_1: { 
            cards: ["01191", "01192", "01193"] 
        },
        
        // --- À REMPLIR AVEC LES BONS ID MARVELCDB ---
        // N'oublie pas d'inclure la carte "start_on_board" également dans "cards" pour que le script puisse la trouver !
        standard_2: {
            cards: ["24049", "24050", "24050", "24051", "24052", "24053", "24054", "24054"], 
            start_on_board: ["24049"]
        },
        standard_3: {
            cards: ["45075a", "45076", "45076", "45077", "45077", "45078", "45079", "45080"], 
            start_on_board: ["45075a"]
        },
        expert_2: { 
            cards: ["24029", "24030", "24031", "24032"] 
        }
    }

};
