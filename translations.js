/**
 * Ciccio's Burger - Multilingual Dictionary (IT / EN)
 */
const TRANSLATIONS = {
    // Category Names (ALL CAPS in both languages as requested)
    categories: {
        "STARTERS": "STARTERS",
        "CICCIO'S BURGER": "CICCIO'S BURGERS",
        "CLASSIC": "CLASSICS",
        "SPECIAL": "SPECIALS",
        "SWEETS": "DESSERTS",
        "SALSE": "SAUCES",
        "BIBITE": "DRINKS",
        "MENU": "COMBO MENUS",
        "MENU(Panino + Patatine + Starter a scelta*** + Bibita)": "COMBO MENU (Burger + Fries + Choice of Starter*** + Drink)",
        "MENU(PANINO + PATATINE + BIBITA)": "COMBO MENU (Burger + Fries + Drink)",
        "MENU(PANINO + PATATINE)": "COMBO MENU (Burger + Fries)"
    },

    // UI Text & Buttons
    ui: {
        ourMenu: { it: "IL NOSTRO MENÙ", en: "OUR MENU" },
        showAllergens: { it: "Mostra allergeni", en: "Show allergens" },
        back: { it: "Torna Indietro", en: "Go Back" },
        seeMenu: { it: "VAI AL MENU", en: "SEE MENU" },
        noAllergens: { it: "Nessun allergene noto", en: "No known allergens" },
        burgerTruckTitle: { it: "🚚 BURGER TRUCK", en: "🚚 BURGER TRUCK" },
        burgerTruckText: { it: "Vuoi il nostro furgone al tuo evento?", en: "Want our food truck at your event?" },
        burgerTruckWrite: { it: "Scrivici a ", en: "Contact us at " },
        noteFresh: { it: "* Prodotto fresco, lavorato e abbattuto", en: "* Fresh product, processed and blast chilled" },
        noteFrozen: { it: "** Prodotto congelato", en: "** Frozen product" },
        noteStarters: {
            it: "*** Starters a scelta tra: nuggets, meatball, chicken pop corn, green nuggets(la variante green è solo per il menu Green)",
            en: "*** Starters choice of: nuggets, meatballs, chicken pop corn, green nuggets (green option is only for Green menu)"
        },
        disclaimerTranslation: {
            it: "⚠️ Le traduzioni in inglese sono a scopo informativo. Per informazioni ufficiali e per allergie o intolleranze alimentari, si prega di fare sempre riferimento al personale di cassa.",
            en: "⚠️ English translations are provided for reference only. For official allergen or food intolerance information, please always confirm with our staff at the register."
        },
        comboExplanation1: {
            text: { it: "BURGER + PATATINE + STARTER*** + BIBITA", en: "BURGER + FRIES + STARTER*** + DRINK" },
            bold: { it: "+5,00€ al costo del panino", en: "+€5.00 to burger price" }
        },
        comboExplanation2: {
            text: { it: "BURGER + PATATINE + BIBITA", en: "BURGER + FRIES + DRINK" },
            bold: { it: "+2,50€ al costo del panino", en: "+€2.50 to burger price" }
        },
        comboExplanation3: {
            text: { it: "BURGER + PATATINE", en: "BURGER + FRIES" },
            bold: { it: "+2,00€ al costo del panino", en: "+€2.00 to burger price" }
        }
    },

    // Ingredient Translations (Italian -> English)
    ingredients: {
        "Alette di pollo pastellate e fritte laccate con salsa thai": "Battered and fried chicken wings glazed with thai sauce",
        "Maxi nuggets di pollo con panatura super croccante*": "Maxi chicken nuggets with super crispy breading*",
        "anelli di cipolla": "onion rings",
        "bacon": "bacon",
        "bacon croccante": "crispy bacon",
        "bocconcini di pollo tritato pastellati faits a mano*": "hand-battered minced chicken bites*",
        "bocconcini di pollo tritato pastellati fatti a mano*": "hand-battered minced chicken bites*",
        "bocconcini di pollo tritato pastellati fatti a mano* sg": "hand-battered minced chicken bites* (GF)",
        "brie": "brie cheese",
        "brookies": "brookies",
        "bun": "bun",
        "bun sg": "gluten-free bun",
        "burger di manzo 170g": "170g beef patty",
        "burger di manzo sg": "170g beef patty (GF)",
        "burger di pollo fritto con panatura super croccante*": "fried chicken patty with super crispy breading*",
        "burger di pollo fritto con panatura super croccante* sg": "fried chicken patty with super crispy breading* (GF)",
        "burger di pollo pastellato e fritto*": "battered & fried chicken patty*",
        "burger di pollo pastellato e fritto* sg": "battered & fried chicken patty* (GF)",
        "burger vegetale": "veggie burger",
        "cheddar": "cheddar cheese",
        "cipolla caramellata": "caramelized onion",
        "cipolla caramellata con aceto balsamico": "balsamic caramelized onion",
        "cipolla croccante": "crispy onion",
        "confettura di fichi": "fig jam",
        "crema cheddar home made": "homemade cheddar cream",
        "crema cheddar home made sg": "homemade cheddar cream (GF)",
        "crema di fagiolina": "fagiolina bean cream",
        "doppio bacon": "double bacon",
        "doppio burger di manzo 170g": "double 170g beef patty",
        "doppio burger di manzo sg": "double beef patty (GF)",
        "doppio cheddar": "double cheddar cheese",
        "gorgonzola": "gorgonzola cheese",
        "guanciale croccante": "crispy cured pork cheek (guanciale)",
        "lattuga": "lettuce",
        "maionese": "mayonnaise",
        "maionese al pepe nero": "black pepper mayonnaise",
        "nocciole": "hazelnuts",
        "noci": "walnuts",
        "nuggets vegetali**": "veggie nuggets**",
        "nutella": "Nutella",
        "olio evo": "extra virgin olive oil",
        "pancetta dolce": "sweet cured pork belly (pancetta)",
        "pane": "bread",
        "patate al forno": "roasted potatoes",
        "patate con buccia**": "skin-on fries**",
        "patatine waffle": "waffle fries",
        "pere caramellate": "caramelized pears",
        "polpettine di carne fatte a mano con speciale panatura al formaggio*": "handmade meat bites with cheese breading*",
        "polpettine di carne fatte a mano con speciale panatura al formaggio* sg": "handmade meat bites with cheese breading* (GF)",
        "polpettine di pollo fatte a mano con speciale panatura super croccante*": "handmade chicken bites with super crispy breading*",
        "pomodoro": "tomato",
        "porchetta": "porchetta (roast pork)",
        "provola dolce con tripla pastellatura a mano*": "sweet provola cheese hand-battered 3x*",
        "provola dolce con tripla pastellatura a mano* sg": "sweet provola cheese hand-battered 3x* (GF)",
        "roast beef": "roast beef",
        "salsa Ciccio's": "Ciccio's sauce",
        "salsa bbq": "BBQ sauce",
        "salsa cheddar calda e bacon": "warm cheddar sauce & bacon",
        "salsa cheddar calda e bacon sg": "warm cheddar sauce & bacon (GF)",
        "salsa chimichurri": "chimichurri sauce",
        "salsa hot thai 60ml": "hot thai sauce 60ml",
        "salsa thai 60ml": "thai sauce 60ml",
        "salsa white Ciccio's": "Ciccio's white sauce",
        "scamorza": "scamorza cheese",
        "songino": "lamb's lettuce (songino)",
        "stripe di pollo": "chicken tenders",
        "taleggio": "taleggio cheese",
        "tiramisù": "tiramisu",
        "triplo cheddar": "triple cheddar cheese",
        "tuma caramellata al miele": "honey caramelized tuma cheese"
    },

    // Allergen Labels (Italian -> English)
    allergens: {
        "Glutine": "Gluten",
        "Latte": "Milk",
        "Uova": "Eggs",
        "Frutta a guscio": "Nuts (Tree nuts)",
        "Soia": "Soy",
        "Senape": "Mustard",
        "Sedano": "Celery",
        "Anidride solforosa": "Sulphur dioxide",
        "Anidride solforosa e solfiti": "Sulphur dioxide and sulphites",
        "Arachidi": "Peanuts",
        "Pesce": "Fish",
        "Semi di sesamo": "Sesame seeds",
        "Solfiti": "Sulphites",
        "Latte(Senza lattosio)": "Milk (Lactose free)",
        "Latte / Variante Senza Lattosio(+0,40€)": "Milk / Lactose Free Option (+€0.40)",
        "Latte / Variante Senza Lattosio(+0,20€)": "Milk / Lactose Free Option (+€0.20)",
        "Latte / Variante Senza Lattosio(Caciotta o Affumicata)(+0,30€)": "Milk / Lactose Free Option (Caciotta or Smoked) (+€0.30)",
        "Senape, Uova, può contenere tracce di: Arachidi e derivati, Pesce, Latte": "Mustard, Eggs, may contain traces of: Peanuts, Fish, Milk",
        "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce": "Mustard, Eggs, may contain traces of: Peanuts and Fish",
        "può contenere tracce di: Arachidi e derivati, Pesce, Latte": "may contain traces of: Peanuts, Fish, Milk",
        "può contenere tracce di Arachidi e derivati e Pesce": "may contain traces of: Peanuts and Fish",
        "può contenere tracce di Frutta a guscio e Pesce": "may contain traces of: Tree nuts and Fish",
        "può contenere tracce di: Arachidi e derivati": "may contain traces of: Peanuts"
    }
};
