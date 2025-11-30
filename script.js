let mainUrl = 'https://api.cicciosburger.it'
let recaptchaWidgetId;
let recaptchaOrderWidgetId;
let foodtruckMap;

document.addEventListener("DOMContentLoaded", async () => {
    // Default coordinates
    let lat = 38.2064711;
    let lng = 13.3252011;
    let validCoordinates = true;

    // Try to fetch coords.json from remote API
    try {
        const res = await fetch(mainUrl + '/menu/static/coords.json');
        if (!res.ok) throw new Error("Non disponibile");
        const data = await res.json();

        // Check if coordinates are valid numbers
        if (typeof data.lat === "number" && typeof data.lng === "number" &&
            !isNaN(data.lat) && !isNaN(data.lng) &&
            data.lat !== null && data.lng !== null) {
            lat = data.lat;
            lng = data.lng;
            validCoordinates = true;
        } else {
            validCoordinates = false;
        }
    } catch (err) {
        console.warn("Coordinate non disponibili, foodtruck chiuso:", err);
        validCoordinates = false;
    }

    const mapContainer = document.getElementById('map');

    if (!validCoordinates) {
        // Hide map and show closed message
        mapContainer.innerHTML = `
            <div style="height: 100%; width: 100%; padding: 30px 0px; text-align: center; background: linear-gradient(135deg, #000000ff 0%, #000000ff 100%); border-radius: 16px; color: white; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); margin: 0px 0px; position: relative; overflow: hidden;
            ">
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                <div style="font-size: clamp(4rem, 25vw, 6rem); margin-bottom: 20px; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));">🚚💤</div>
                <h2 style="font-size: clamp(1.5rem, 5vw, 3rem); font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">Temporaneamente chiuso</h2>
                <p style="font-size: clamp(1rem, 2.5vw, 1.2rem); font-weight: 400; margin: 0 0 24px 0; opacity: 0.95; line-height: 1.6;">Ti aspettiamo per il prossimo evento!</p>
            </div>
        `;
        return; // Exit early - don't initialize map
    }

    // If coordinates are valid, initialize the map
    foodtruckMap = L.map('map').setView([lat, lng], 18);

    // Tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | © OpenStreetMap',
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(foodtruckMap);

    // Custom icon
    const customDivIcon = L.divIcon({
        html: `
      <div class="marker-wrapper">
        <div class="marker-label">CLICCAMI</div>
        <img src="./img/logofoodclean.png" class="marker-img" />
      </div>
    `,
        className: "",
        iconSize: [80, 50],
        iconAnchor: [16, 64]
    });

    // Add marker
    const marker = L.marker([lat, lng], { icon: customDivIcon }).addTo(foodtruckMap);
    marker.on('click', () => {
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, '_blank');
    });

    // Fix map sizing when page loads
    window.addEventListener('load', () => {
        if (foodtruckMap) {
            foodtruckMap.invalidateSize();
        }
    });

    // Fix map sizing when foodtruck modal opens
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const foodtruckModal = document.getElementById('foodtruck');
            if (foodtruckModal && foodtruckModal.style.display === 'block') {
                setTimeout(() => {
                    if (foodtruckMap) {
                        foodtruckMap.invalidateSize();
                    }
                }, 100);
            }
        });
    });

    // Observe the foodtruck modal for style changes
    const foodtruckModal = document.getElementById('foodtruck');
    if (foodtruckModal) {
        observer.observe(foodtruckModal, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {

    // Allergeni map (keep your existing one)
    const allergeniIngredientiMap = {
        "bun": "Glutine",
        "nutella": "Frutta a guscio, Soia, Latte",
        "tiramisù": "Glutine, Latte, Uova",
        "brookies": "Glutine, Latte, Uova",
        "bocconcini di pollo tritato pastellati fatti a mano*": "Glutine, Latte",
        "polpettine di pollo fatte a mano con speciale panatura super croccante*": "Glutine, Latte",
        "polpettine di carne fatte a mano con speciale panatura al formaggio*": "Glutine, Uova, Latte",
        "provola dolce con tripla pastellatura a mano*": "Glutine, Latte",
        "nuggets vegetali": "Uova, Soia, Latte, Sedano, Senape, Glutine",
        "Alette di pollo pastellate e fritte laccate con salsa thai": "Uova, Senape",
        "Maxi nuggets di pollo con panatura super croccante* accompagnato con cheddar calda": "Glutine, Latte",
        "polpettine vegetali*": "Uova, Soia, Latte, Anidride solforosa e solfiti, Glutine",
        "burger di manzo 170g": "Latte(Senza lattosio), Glutine, Uova",
        "burger di salsiccia 170g": null,
        "burger di manzo": "Latte(Senza lattosio), Glutine, Uova",
        "doppio burger di manzo 170g": "Latte(Senza lattosio), Glutine, Uova",
        "burger di pollo pastellato e fritto*": "Latte(Senza lattosio), Glutine",
        "burger di pollo fritto con panatura super croccante*": "Latte(Senza lattosio), Glutine",
        "burger di suino": null,
        "sovracoscia di pollo alla piastra": null,
        "burger vegetale": "Latte, Uova",
        "cheddar": "Latte",
        "doppio cheddar": "Latte",
        "triplo cheddar": "Latte",
        "brie": "Latte",
        "tuma caramellata al miele": "Latte",
        "tuma": "Latte",
        "gran P&V al tartufo": "Latte",
        "taleggio": "Latte",
        "scamorza": "Latte",
        "uovo fritto": "Uova",
        "guanciale croccante": null,
        "guanciale": null,
        "bacon": null,
        "doppio bacon": null,
        "bacon croccante": null,
        "pancetta dolce": null,
        "porchetta": null,
        "mortadella": "Frutta a guscio",
        "lattuga": null,
        "pomodoro": null,
        "cipolla": null,
        "cipolla caramellata": null,
        "cipolla croccante": null,
        "songino": null,
        "pere caramellate": null,
        "rosti di patate": null,
        "confettura di fichi": "Anidride solforosa",
        "nocciole": "Frutta a guscio",
        "miele": null,
        "salsa cheddar calda da 170ml": "Glutine, Latte",
        "patate con buccia**": null,
        "crema cheddar home made": "Glutine, Latte",
        "salsa Ciccio's": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "salsa white Ciccio's": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "maionese al tartufo": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "maionese senapata al miele": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "maionese al basilico": "Senape, Soia, Semi di sesamo",
        "maionese": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "salsa bbq": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "salsa thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "salsa hot thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "salsa ciccio's 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "robiolina con pomodoro semi-dry": "Latte, Solfiti, può contenere tracce di Frutta a guscio e Pesce",
        "tzatziki": "Latte",
        "grana": "Latte",
        "roast beef": null,
        "pecorino al peperoncino": "Latte",
        "cipolla caramellata alla birra": "Glutine",
        "nduja": null,
        "giri saltati": null,
        "olio al limone": null,
        "scaglie di parmigiano reggiano": "Latte(Senza lattosio)",
        "primo sale di pecora fresco": "Latte",
        "salsa al guanciale": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
        "gocce di peperoncino": null
    };
    // Global menu data
    let menuData = null;

    fetch(mainUrl + '/menu/static/menu.json')
        .then(response => {
            if (!response.ok) throw new Error('Remote menu not available');
            return response.json();
        })
        .catch(() => {
            // Se il fetch remoto fallisce, tenta il locale
            return fetch('menu.json').then(localRes => {
                if (!localRes.ok) throw new Error('Fallback menu.json non trovato');
                return localRes.json();
            });
        })
        .then(data => {
            menuData = data;
            // Generate both menus immediately
            let currentStore = "LUMIA";
            generateMenu('menuModal', currentStore);

            // Gestione click su bottoni
            const storeButtons = document.querySelectorAll('.store-button');
            storeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const selectedStore = button.getAttribute('data-store');
                    currentStore = selectedStore;

                    // Rimuove "active" da tutti
                    storeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Rigenera il menu
                    generateMenu('menuModal', currentStore);
                });
            });
            ;
            generateMenu('foodtruck', 'FOODTRUCK');
            generateMenu('ghiotto', 'GHIOTTO');
            generateMenu('menuSpeciale', 'SPECIALE');
        })
        .catch(error => console.error('Error loading menu:', error));

    // Main menu generation function
    function generateMenu(modalId, menuType) {
        let contentId
        if (modalId == 'menuModal') {
            contentId = 'generatedContentLocale'
        }
        else if (modalId == 'foodtruck') {
            contentId = 'generatedContentFoodtruck'
        }
        else if (modalId == 'menuSpeciale') {
            contentId = 'generatedContentMenuSpeciale'
        }
        else {
            contentId = 'generatedContentGhiotto'
        }
        const container = document.getElementById(contentId);
        container.innerHTML = '';

        if (!menuData) return;

        for (const [categoryName, products] of Object.entries(menuData)) {
            const filteredProducts = products.filter(p => p.available_in.includes(menuType));

            if (filteredProducts.length > 0) {
                // Create category header
                const categoryTitle = document.createElement('button');
                categoryTitle.classList.add('collapsible');
                categoryTitle.textContent = categoryName;
                container.appendChild(categoryTitle);

                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('menu-grid', 'content');
                container.appendChild(categoryDiv);

                // Add products
                filteredProducts.forEach(product => {
                    const productDiv = createProductElement(product);
                    categoryDiv.appendChild(productDiv);
                });
            }
        }

        initCollapsibles(container);
        setupIngredientToggle(modalId, container);
    }

    // Create individual product element
    function createProductElement(product) {
        const productDiv = document.createElement('div');
        productDiv.classList.add('menu-item');

        // Process ingredients and allergens
        product.allergeniIngredientiMap = {};
        const ingredienti = product.ingredients?.split(",").map(i => i.trim()) || [];

        ingredienti.forEach(ingrediente => {
            const nomeIngrediente = ingrediente.split(":")[0].trim();
            if (allergeniIngredientiMap.hasOwnProperty(nomeIngrediente)) {
                product.allergeniIngredientiMap[nomeIngrediente] = allergeniIngredientiMap[nomeIngrediente];
            }
        });

        // Product image
        const image = document.createElement('img');
        image.classList.add('product-img');
        image.src = product.thumb;
        image.loading = "lazy";
        productDiv.appendChild(image);

        // Product info container
        const productInfoDiv = document.createElement('div');
        productInfoDiv.classList.add('menu-item-info');

        // Product title
        const title = document.createElement('h1');
        title.classList.add('product-title');
        title.textContent = product.title;

        // Add leaf icon for green items
        if (product.title.toLowerCase().includes("green")) {
            const leafIcon = document.createElement('i');
            leafIcon.classList.add("fas", "fa-leaf");
            leafIcon.style.marginLeft = "10px";
            title.appendChild(leafIcon);
        }
        productInfoDiv.appendChild(title);

        // Product price
        const price = document.createElement('p');
        price.classList.add('product-price');
        price.textContent = typeof product.price === 'number'
            ? `${product.price.toFixed(2).toString().replace(".", ",")}€`
            : product.price;
        productInfoDiv.appendChild(price);

        // Ingredients
        const ingredients = product.ingredients?.split(",").map(i => i.trim()) || [];

        // Short description
        const inlineText = document.createElement('p');
        inlineText.classList.add('product-description');
        inlineText.textContent = ingredients.join(", ");
        productInfoDiv.appendChild(inlineText);

        // Detailed ingredients
        const detailedContainer = document.createElement('div');
        detailedContainer.classList.add('ingredient-detail');

        ingredients.forEach(name => {
            const row = document.createElement('div');
            row.className = "ingredient-row";

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            const allergenSpan = document.createElement('span');
            allergenSpan.className = "allergens";

            const found = Object.entries(product.allergeniIngredientiMap || {}).find(([key]) =>
                key.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(key.toLowerCase())
            );

            allergenSpan.textContent = found ? found[1] : "Nessun allergene noto";
            row.appendChild(nameSpan);
            row.appendChild(allergenSpan);
            detailedContainer.appendChild(row);
        });
        productInfoDiv.appendChild(detailedContainer);

        productDiv.appendChild(productInfoDiv);
        return productDiv;
    }

    // Initialize collapsible sections
    function initCollapsibles(container) {
        container.querySelectorAll('.collapsible').forEach(coll => {
            const content = coll.nextElementSibling;

            // Initialize all categories as COLLAPSED by default
            coll.classList.remove('active');
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';

            coll.addEventListener('click', function () {
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    // Expand - show content with padding
                    content.style.maxHeight = content.scrollHeight + 50 + 'px';
                    content.style.opacity = '1';
                    content.style.paddingTop = '10px';
                    content.style.paddingBottom = '10px';
                } else {
                    // Collapse - hide everything including padding
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                    content.style.paddingTop = '0';
                    content.style.paddingBottom = '0';
                }
            });
        });
    }

    // Setup ingredient toggle for a specific modal
    function setupIngredientToggle(modalId, container) {
        let toggleId
        if (modalId == 'menuModal') {
            toggleId = 'toggleIngredientsLocale'
        }
        else if (modalId == 'foodtruck') {
            toggleId = 'toggleIngredientsFoodtruck'
        }
        else if (modalId == 'menuSpeciale') {
            toggleId = 'toggleIngredientsMenuSpeciale'
        }
        else {
            toggleId = 'toggleIngredientsGhiotto'
        }
        const toggle = document.getElementById(toggleId);

        if (!toggle) return;

        toggle.addEventListener('change', function () {
            const show = this.checked;

            container.querySelectorAll('.product-description').forEach(p => {
                p.style.display = show ? 'none' : 'block';
            });

            container.querySelectorAll('.ingredient-detail').forEach(div => {
                div.classList.toggle('show', show);
            });

            // Recalculate maxHeight for open collapsibles
            container.querySelectorAll('.collapsible.active').forEach(button => {
                const content = button.nextElementSibling;
                content.style.maxHeight = content.scrollHeight + 50 + 'px';
            });
        });
    }
});
const allowed_domains = new Set([
    "gmail.com", "outlook.com", "hotmail.com", "live.com",
    "icloud.com", "me.com", "mac.com", "yahoo.com",
    "hotmail.it",
    "live.it",
    "yahoo.it",
    "libero.it", "virgilio.it", "tiscali.it", "alice.it",
    "tin.it", "email.it",
    "msn.com", "gmx.com", "gmx.net", "mail.com",
    "proton.me", "protonmail.com", "fastmail.com"
]);

function validateEmailDomain(input) {
    const email = input.value.trim();
    const errorSpan = document.getElementById('email-error');

    if (!email.includes('@')) {
        errorSpan.style.display = 'none';
        input.setCustomValidity('');
        return;
    }

    const domainPart = email.split('@')[1].toLowerCase();

    if (!domainPart) {
        errorSpan.style.display = 'none';
        input.setCustomValidity('');
        return;
    }

    // Check if domainPart starts any allowed domain
    const match = Array.from(allowed_domains).some(d => d.startsWith(domainPart));

    if (match) {
        errorSpan.style.display = 'none';
        input.setCustomValidity('');
    } else {
        errorSpan.style.display = 'block';
        errorSpan.textContent = 'Usa un email comune (es. gmail, outlook, yahoo, etc.).';
        input.setCustomValidity('Dominio email non consentito.');
    }
}

function validateEmailComplete(input) {
    const email = input.value.trim();
    const errorSpan = document.getElementById('email-error');

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@([a-zA-Z0-9.\-]+\.)?(com|net|me|it)$/i;

    if (!emailRegex.test(email)) {
        errorSpan.style.display = 'block';
        errorSpan.textContent = 'Inserisci un indirizzo email completo e valido (es., esempio@gmail.com).';
        input.setCustomValidity('Email non valida o dominio non permesso.');
        return;
    }

    const domainPart = email.split('@')[1].toLowerCase();

    if (!allowed_domains.has(domainPart)) {
        errorSpan.style.display = 'block';
        errorSpan.textContent = 'Usa un email comune (es. gmail, outlook, yahoo, etc.).';
        input.setCustomValidity('Dominio email non consentito.');
    } else {
        errorSpan.style.display = 'none';
        input.setCustomValidity('');
    }
}

document.addEventListener("DOMContentLoaded", function () {

    // Function to load SVG from external file
    function loadSVG(url, containerId) {
        fetch(url)
            .then(response => response.text())
            .then(svgContent => {
                document.getElementById(containerId).innerHTML = svgContent;
            })
            .catch(error => {
                console.error(`Error loading SVG from ${url}:`, error);
            });
    }

    // Funzione per mostrare messaggi di errore eleganti
    function showError(message, containerId = 'error-message-container') {
        const container = document.getElementById(containerId) || createErrorContainer(containerId);
        container.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(245, 101, 101, 0.3);
                animation: slideIn 0.3s ease-out;
                text-align: center;
                font-weight: 500;
            ">
                <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                ${message}
            </div>
        `;

        // Auto-hide dopo 5 secondi
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    // Funzione per mostrare messaggi di successo
    function showSuccess(message, containerId = 'error-message-container') {
        const container = document.getElementById(containerId) || createErrorContainer(containerId);
        container.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                animation: slideIn 0.3s ease-out;
                text-align: center;
                font-weight: 500;
            ">
                <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
                ${message}
            </div>
        `;
    }

    // Crea container per messaggi se non esiste
    function createErrorContainer(containerId) {
        const container = document.createElement('div');
        container.id = containerId;
        const form = document.getElementById("data-form");
        if (form && form.parentNode) {
            form.parentNode.insertBefore(container, form);
        }
        return container;
    }

    // Aggiungi animazione CSS
    if (!document.getElementById('otp-animations')) {
        const style = document.createElement('style');
        style.id = 'otp-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // GESTIONE OTP CON 6 CASELLE
    // ============================================
    const otpInputs = document.querySelectorAll('.otp-input');

    if (otpInputs.length > 0) {
        otpInputs.forEach((input, index) => {
            // Auto-focus sulla prossima casella quando digiti
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Accetta solo numeri
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Vai alla prossima casella se esiste
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            // Gestione backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }

                // Gestione frecce sinistra/destra
                if (e.key === 'ArrowLeft' && index > 0) {
                    otpInputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            // Gestione paste (incolla)
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').trim();

                // Verifica che siano 6 cifre
                if (/^\d{6}$/.test(pastedData)) {
                    pastedData.split('').forEach((char, i) => {
                        if (otpInputs[i]) {
                            otpInputs[i].value = char;
                        }
                    });
                    // Focus sull'ultima casella
                    otpInputs[5].focus();
                }
            });

            // Seleziona tutto il contenuto quando clicchi
            input.addEventListener('click', (e) => {
                e.target.select();
            });
        });
    }

    // Funzione per ottenere il codice OTP completo
    function getOTPValue() {
        return Array.from(otpInputs)
            .map(input => input.value)
            .join('');
    }

    // Funzione per resettare il campo OTP
    function resetOTP() {
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        if (otpInputs[0]) otpInputs[0].focus();
    }

    document.getElementById('back-to-register-btn').addEventListener('click', function () {
        // 1. Hide OTP section
        document.getElementById('otp-section').style.display = 'none';

        // 2. Show the Registration Form
        // We use 'flex' because your enableForm() function uses 'flex'
        document.getElementById('data-form').style.display = 'flex';

        // 3. CRITICAL: Re-enable the submit button and reset text
        const submitBtn = document.getElementById('submit-button');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Richiedi tessera";
        }

        // 4. CRITICAL: Reset reCAPTCHA so the user can verify again
        if (typeof grecaptcha !== 'undefined' && typeof recaptchaWidgetId !== 'undefined') {
            try {
                grecaptcha.reset(recaptchaWidgetId);
            } catch (e) {
                console.warn("Recaptcha reset failed", e);
            }
        }

        // 5. Reset OTP inputs for next time
        resetOTP();
    });

    // Funzione per mostrare errore OTP
    function showOTPError() {
        otpInputs.forEach(input => {
            input.classList.add('error');
        });
        setTimeout(() => {
            otpInputs.forEach(input => {
                input.classList.remove('error');
            });
        }, 300);
    }

    // ============================================
    // LOGICA PRINCIPALE REGISTRAZIONE
    // ============================================

    // Check if wallet URLs are stored in cookies
    const appleWalletURL = getCookie("appleWalletURL");
    const googleWalletURL = getCookie("googleWalletURL");

    const form = document.getElementById("data-form");
    const resultSection = document.getElementById("result");
    const otpSection = document.getElementById("otp-section");
    const verifyOtpBtn = document.getElementById("verify-otp-btn");
    let registrationToken = null;

    if (appleWalletURL && googleWalletURL) {
        // User has already registered - show only download buttons
        loadSVG('./img/add_to_apple_wallet.svg', 'appleSvgContainer');
        loadSVG('./img/add_to_google_wallet.svg', 'googleSvgContainer');

        document.getElementById("appleWalletButton").href = appleWalletURL;
        document.getElementById("googleWalletButton").href = googleWalletURL;

        form.style.display = "none";
        if (otpSection) otpSection.style.display = "none";
        resultSection.style.display = "block";
        return; // Exit early - don't set up form submission
    }

    // If no cookies found, set up form submission normally
    const submitButton = document.getElementById("submit-button");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
        if (!recaptchaResponse) {
            showError("⚠️ Completa il reCAPTCHA prima di continuare.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Invio in corso...";

        const formData = new FormData(form);
        formData.set("email", formData.get("email").toLowerCase());

        const dob = new Date(formData.get("dob"));
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 16 || (age === 16 && today < new Date(dob.setFullYear(dob.getFullYear() + 16))) || age > 100) {
            showError("Devi avere almeno 16 anni per iscriverti.");
            submitButton.disabled = false;
            submitButton.textContent = "Richiedi tessera";
            return;
        }

        const phone = formData.get("phone");
        const fullPhone = `+39${phone}`;

        const data = Object.fromEntries(formData.entries());
        data.phone = fullPhone;

        try {
            // Step 1: Request OTP
            const response = await fetch(mainUrl + "/api/request-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                showError(errorData.error || "Errore sconosciuto durante la richiesta.");
                submitButton.disabled = false;
                submitButton.textContent = "Richiedi tessera";
                return;
            }

            const result = await response.json();
            registrationToken = result.registration_token;

            showSuccess(result.message || "Codice di verifica inviato alla tua email!");

            // Switch UI to OTP mode
            setTimeout(() => {
                form.style.display = "none";
                if (otpSection) {
                    otpSection.style.display = "block";
                    // Focus sulla prima casella OTP
                    if (otpInputs[0]) otpInputs[0].focus();
                }
            }, 1000);

        } catch (error) {
            showError("Errore di connessione: " + error.message);
            submitButton.disabled = false;
            submitButton.textContent = "Richiedi tessera";
        }
    });

    // Step 2: Verify OTP Handler
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener("click", async () => {
            const otp = getOTPValue();

            if (otp.length !== 6) {
                showOTPError();
                showError("Inserisci tutte le 6 cifre del codice OTP.");
                return;
            }

            verifyOtpBtn.disabled = true;
            verifyOtpBtn.textContent = "Verifica in corso...";

            try {
                const verifyResponse = await fetch(mainUrl + "/api/verify-otp-register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        registration_token: registrationToken,
                        otp: otp
                    })
                });

                if (!verifyResponse.ok) {
                    const errorData = await verifyResponse.json();
                    showOTPError();
                    showError(errorData.error || "Codice OTP non valido.");
                    resetOTP();
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.textContent = "Verifica e Registrati";
                    return;
                }

                const verifyResult = await verifyResponse.json();

                // Success!
                const appleURL = mainUrl + verifyResult.apple_url;
                const googleURL = mainUrl + verifyResult.google_url;

                setCookie("appleWalletURL", appleURL, 30);
                setCookie("googleWalletURL", googleURL, 30);

                showSuccess("✅ Registrazione completata con successo!");

                // Load SVG buttons
                loadSVG('./img/add_to_apple_wallet.svg', 'appleSvgContainer');
                loadSVG('./img/add_to_google_wallet.svg', 'googleSvgContainer');

                document.getElementById("appleWalletButton").href = appleURL;
                document.getElementById("googleWalletButton").href = googleURL;

                setTimeout(() => {
                    if (otpSection) otpSection.style.display = "none";
                    resultSection.style.display = "block";
                }, 1500);

            } catch (error) {
                showError("Errore durante la verifica: " + error.message);
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = "Verifica e Registrati";
            }
        });
    }

    // Esponi funzioni globalmente se necessario
    window.getOTPValue = getOTPValue;
    window.resetOTP = resetOTP;
    window.showOTPError = showOTPError;
});

// Cookie Functions
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return "";
}


// ORDER FORM
document.addEventListener("DOMContentLoaded", async () => {
    let merch = [];
    let cart = [];

    // Caricamento prodotti
    async function fetchMerch() {
        try {
            const response = await fetch("data.json");
            const data = await response.json();

            merch = Object.entries(data).map(([name, info], index) => ({
                id: index + 1,
                name,
                price: info.price,
                img: info.image,
                sizes: info.sizes
            }));

            renderProducts();
        } catch (err) {
            console.error("Errore nel caricamento dei prodotti:", err);
        }
    }

    function renderProducts() {
        const container = document.getElementById("merch-products");
        container.innerHTML = "";
        merch.forEach(product => {
            const card = document.createElement("div");
            card.className = "merch-card";

            const sizeOptions = product.sizes
                .map(size => `<option value="${size}">${size}</option>`)
                .join("");

            card.innerHTML = `
        <img src="${product.img}" class="merch-product-img" alt="${product.name}">
        <h3>${product.name}</h3>
        <p><strong>€${product.price.toFixed(2)}</strong></p>
        <div class="merch-card-bottom">
            <select id="merch-size-${product.id}" class="merch-input">${sizeOptions}</select>
            <button onclick="addToCart(${product.id})" class="merch-button">Aggiungi al carrello</button>
        </div>
        `;

            container.appendChild(card);
        });
    }

    window.addToCart = function (productId) {
        const size = document.getElementById(`merch-size-${productId}`).value;
        const existingIndex = cart.findIndex(item => item.id === productId && item.size === size);

        if (existingIndex >= 0) {
            if (cart[existingIndex].qty < 5) {
                cart[existingIndex].qty++;
            } else {
                alert("Puoi aggiungere al massimo 5 articoli per taglia.");
                return;
            }
        } else {
            cart.push({ id: productId, size, qty: 1 });
        }

        renderCart();
    };

    function renderCart() {
        const container = document.getElementById("merch-cart-items");
        container.innerHTML = "";
        if (cart.length === 0) {
            container.innerHTML = "<p class='merch-empty'>Il carrello è vuoto.</p>";
            return;
        }

        cart.forEach((item, index) => {
            const product = merch.find(p => p.id === item.id);
            const row = document.createElement("div");
            row.className = "merch-cart-item";
            row.innerHTML = `
        <div><strong>${product.name}</strong> (${item.size}) x ${item.qty} - €${(product.price * item.qty).toFixed(2)}</div>
        <button onclick="removeCartItem(${index})" class="merch-remove">Rimuovi</button>
      `;
            container.appendChild(row);
        });
    }

    window.removeCartItem = function (index) {
        cart.splice(index, 1);
        renderCart();
    };

    window.handleSubmit = async function (e) {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Aggiungi almeno un articolo al carrello.");
            return;
        }

        const form = e.target;
        const name = form.querySelector('input[placeholder="Nome"]').value.trim();
        const surname = form.querySelector('input[placeholder="Cognome"]').value.trim();
        const phone = "+39" + form.querySelector('.merch-phone-field').value.trim();
        const email = form.querySelector('input[type="email"]').value.trim();
        const shop = form.querySelector('select').value;

        const recaptchaResponse = grecaptcha.getResponse(recaptchaOrderWidgetId);
        if (!recaptchaResponse) {
            alert("Completa il reCAPTCHA.");
            return;
        }


        const cartData = cart.map(item => {
            const product = merch.find(p => p.id === item.id);
            return {
                quantity: item.qty,
                type: product.name,
                size: item.size,
                price: product.price
            };
        });

        const payload = {
            name,
            surname,
            email,
            phone,
            shop,
            cart: cartData,
            recaptchaResponse
        };

        try {
            const res = await fetch(mainUrl + "/api/generate-order-number", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const resultText = await res.text();

            if (!res.ok) {
                throw new Error("Errore nella prenotazione: " + resultText);
            }

            form.style.display = "none";
            document.getElementById("confirmationMessage").style.display = "block";
            document.getElementById("orderNumberDisplay").textContent = resultText;

            cart = [];
            renderCart();
        } catch (err) {
            console.error(err);
            alert("Errore: " + err.message);
        }

    };

    // Pulsante "Fai un nuovo ordine"
    const newOrderBtn = document.getElementById("newOrderButton");
    if (newOrderBtn) {
        newOrderBtn.addEventListener("click", () => {
            document.querySelector("form").style.display = "block";
            document.getElementById("confirmationMessage").style.display = "none";
            document.querySelector("form").reset();
        });
    }

    // Inizio
    await fetchMerch();
});



window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1); // es. "menuModal"
    if (hash) {
        const modal = document.getElementById(hash);
        if (modal) {
            modal.style.display = 'block';
        }
    }
});



document.addEventListener('DOMContentLoaded', () => {

    const cookieConsentBanner = document.getElementById("cookieConsent");
    const acceptCookiesBtn = document.getElementById("acceptCookiesBtn");
    const rejectCookiesBtn = document.getElementById("rejectCookiesBtn");
    const cookieWarning = document.getElementById("cookieMsg");
    const cookieOrderWarning = document.getElementById("cookieOrderMsg");
    const dataForm = document.getElementById("data-form");
    const orderForm = document.getElementById("merch-box");

    let recaptchaLoaded = false;

    // Check if the user has already accepted cookies
    function checkCookieConsent() {
        if (!localStorage.getItem("cookieConsent")) {
            cookieConsentBanner.style.display = "block"; // Show the banner
            disableForm(); // Ensure the form is disabled initially
        } else {
            enableForm(); // Enable the form
            loadRecaptcha(); // Load reCAPTCHA
        }
    }

    // Enable the registration form
    const appleWalletURL = getCookie("appleWalletURL");
    const googleWalletURL = getCookie("googleWalletURL");
    function enableForm() {
        if (!appleWalletURL && !googleWalletURL) {
            dataForm.style.display = "flex";
        }
        orderForm.style.display = "block";
        cookieWarning.style.display = "none"; // Hide the cookie warning
        cookieOrderWarning.style.display = "none"; // Hide the cookie warning
    }

    // Disable the registration form
    function disableForm() {
        dataForm.style.display = "none";
        orderForm.style.display = "none";
        cookieWarning.style.display = "block"; // Show the cookie warning
        cookieOrderWarning.style.display = "block"; // Show the cookie order warning
    }


    function loadRecaptcha() {
        if (!recaptchaLoaded) {
            const script = document.createElement("script");
            script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
            recaptchaLoaded = true;
        }
    }

    // Callback when reCAPTCHA is loaded
    window.onRecaptchaLoad = function () {
        const recaptchaContainer = document.getElementById("recaptcha-container");
        const recaptchaContainerOrder = document.getElementById("recaptcha-container-order");
        if (recaptchaContainer) {
            recaptchaWidgetId = grecaptcha.render(recaptchaContainer, {
                sitekey: "6LeNBt0qAAAAAOkMEYknDVLtPCkhhSo7Fc4gh-r_", // Replace with your reCAPTCHA key
            });
        }
        if (recaptchaContainerOrder) {
            recaptchaOrderWidgetId = grecaptcha.render(recaptchaContainerOrder, {
                sitekey: "6LeNBt0qAAAAAOkMEYknDVLtPCkhhSo7Fc4gh-r_", // Replace with your reCAPTCHA key
            });
        }
    };

    // Handle click on "Accept"
    acceptCookiesBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        cookieConsentBanner.style.display = "none";
        enableForm();
        loadRecaptcha(); // Load reCAPTCHA after acceptance
    });

    // Handle click on "Reject"
    rejectCookiesBtn.addEventListener("click", function () {
        localStorage.removeItem("cookieConsent");
        cookieConsentBanner.style.display = "none";
        disableForm();
    });
    checkCookieConsent();
    const modals = document.querySelectorAll('.modal');

    document.querySelectorAll('.open-modal').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);

            if (modalId == "membershipModal") {
                modal.style.display = 'block';
                if (!localStorage.getItem("cookieConsent")) {
                    disableForm();
                } else {
                    enableForm();
                }
            }
            else {
                if (modal) {
                    modal.style.display = 'block';
                    history.replaceState(null, '', `#${modalId}`); // <-- aggiorna hash URL
                }
            }
        });
    });

    // Close modal
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                history.replaceState(null, '', window.location.pathname); // ← rimuove l'hash
            }
        });
    });


    // Close modal when clicking outside the modal content
    modals.forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.style.display = 'none';
                history.replaceState(null, '', window.location.pathname); // rimuove l'hash
            }
        });
    });

});