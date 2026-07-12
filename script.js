let mainUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://127.0.0.1:8001' 
    : 'https://api.cicciosburger.it';
let recaptchaWidgetId;
let recaptchaOrderWidgetId;
let foodtruckMap;
let leafletLoaded = false;
let leafletLoading = false;

// Function to dynamically load Leaflet
async function loadLeaflet() {
    if (leafletLoaded) return Promise.resolve();
    if (leafletLoading) {
        // Wait for the existing load to complete
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (leafletLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    leafletLoading = true;
    console.log('🗺️ Starting to load Leaflet...');

    return new Promise((resolve, reject) => {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'leaflet.css';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'leaflet.js';
        script.onload = () => {
            leafletLoaded = true;
            leafletLoading = false;
            console.log('✅ Leaflet loaded successfully!');
            resolve();
        };
        script.onerror = () => {
            leafletLoading = false;
            console.error('❌ Failed to load Leaflet');
            reject(new Error('Failed to load Leaflet'));
        };
        document.head.appendChild(script);
    });
}

// Initialize the food truck map
async function initializeFoodTruckMap() {
    // Load Leaflet first
    try {
        await loadLeaflet();
    } catch (error) {
        console.error('Failed to load Leaflet:', error);
        return;
    }

    let lat = 38.2064711;
    let lng = 13.3252011;
    let validCoordinates = true;

    try {
        const res = await fetch(mainUrl + '/menu/static/coords.json');
        if (!res.ok) throw new Error("Non disponibile");
        const data = await res.json();

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
        mapContainer.innerHTML = `
            <div class="foodtruck-closed-container">
                <div class="foodtruck-closed-decoration"></div>
                <div class="foodtruck-closed-icon">🚚💤</div>
                <h2 class="foodtruck-closed-title">Temporaneamente chiuso</h2>
                <p class="foodtruck-closed-text">Ti aspettiamo per il prossimo evento!</p>
            </div>
        `;
        return;
    }

    // Only initialize if not already initialized
    if (foodtruckMap) {
        foodtruckMap.invalidateSize();
        return;
    }

    foodtruckMap = L.map('map').setView([lat, lng], 18);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | © OpenStreetMap',
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(foodtruckMap);

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

    const marker = L.marker([lat, lng], {
        icon: customDivIcon
    }).addTo(foodtruckMap);
    marker.on('click', () => {
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, '_blank');
    });

    window.addEventListener('load', () => {
        if (foodtruckMap) {
            foodtruckMap.invalidateSize();
        }
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const menuModal = document.getElementById('menuModal');
            if (menuModal && menuModal.style.display === 'block') {
                setTimeout(() => {
                    if (foodtruckMap) {
                        foodtruckMap.invalidateSize();
                    }
                }, 100);
            }
        });
    });

    const menuModal = document.getElementById('menuModal');
    if (menuModal) {
        observer.observe(menuModal, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const initialHash = window.location.hash;

    let allergeniIngredientiMap = {};
    let menuData = null;
    let scrollTargetId = null;

    Promise.all([
            fetch('allergeni.json').then(res => {
                if (!res.ok) throw new Error('Allergeni non trovati');
                return res.json();
            }),
            fetch(mainUrl + '/menu/static/menu.json')
            .then(response => {
                if (!response.ok) throw new Error('Remote menu not available');
                return response.json();
            })
            .catch(() => {
                return fetch('menu.json').then(localRes => {
                    if (!localRes.ok) throw new Error('Fallback menu.json non trovato');
                    return localRes.json();
                });
            })
        ]).then(([allergeniData, data]) => {
            allergeniIngredientiMap = allergeniData;
            menuData = data;
            let currentStore = "LUMIA";

            if (initialHash === '#foodtruck' || initialHash === '#noglutine') {
                currentStore = initialHash === '#foodtruck' ? "FOODTRUCK" : "GLUTENFREE";

                const productPage = document.getElementById('productListingPage');
                if (productPage) {
                    const landing = document.getElementById('landing-page');
                    if (landing) landing.style.display = 'none';
                    productPage.style.display = 'block';
                    window.scrollTo(0, 0);
                }
                history.replaceState(null, '', '#menu-' + currentStore.toLowerCase());
            } else if (initialHash.toLowerCase().startsWith('#menu-')) {
                currentStore = initialHash.substring(6).toUpperCase();

                const productPage = document.getElementById('productListingPage');
                if (productPage) {
                    const landing = document.getElementById('landing-page');
                    if (landing) landing.style.display = 'none';
                    productPage.style.display = 'block';
                    window.scrollTo(0, 0);
                }
            }

            generateMenu('productListingPage', currentStore);

            const storeButtons = document.querySelectorAll('.store-select-btn');
            storeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const selectedStore = button.getAttribute('data-store');
                    generateMenu('productListingPage', selectedStore);

                    document.getElementById('menuModal').style.display = 'none';

                    const productPage = document.getElementById('productListingPage');
                    productPage.style.display = 'block';
                    const scrollWrapper = document.getElementById('menu-scroll-wrapper');
                    if (scrollWrapper) {
                        scrollWrapper.scrollTop = 0;
                    }
                    window.scrollTo(0, 0);

                    history.pushState(null, '', '#menu-' + selectedStore.toLowerCase());
                });
            });
        })
        .catch(error => console.error('Error loading menu:', error));

    window.generateMenu = function generateMenu(modalId, menuType) {
        let contentId
        if (modalId == 'menuModal' || modalId == 'productListingPage') {
            contentId = 'generatedContentLocale'
        }

        const container = document.getElementById(contentId);
        container.innerHTML = '';

        // Foodtruck event banner: inject/remove inside scroll wrapper
        const scrollWrapper = document.getElementById('menu-scroll-wrapper');
        const existingBanner = document.getElementById('foodtruck-event-banner');
        if (existingBanner) existingBanner.remove();
        if (menuType === 'FOODTRUCK' && scrollWrapper) {
            const banner = document.createElement('div');
            banner.id = 'foodtruck-event-banner';
            banner.className = 'spiegazione ft-banner';
            const u = 'eventi';
            const d = 'cicciosburger.it';
            const title = document.createElement('h2');
            title.className = 'ft-banner-title';
            title.textContent = '🚚 BURGER TRUCK';
            const text = document.createElement('p');
            text.className = 'ft-banner-text';
            text.textContent = 'Vuoi il nostro furgone al tuo evento?';
            const bold = document.createElement('p');
            bold.className = 'ft-banner-bold';
            const a = document.createElement('a');
            a.href = 'mai' + 'lto:' + u + '@' + d;
            a.textContent = u + '@' + d;
            a.style.color = 'orange';
            a.style.textDecoration = 'underline';
            bold.textContent = 'Scrivici a ';
            bold.appendChild(a);
            banner.appendChild(title);
            banner.appendChild(text);
            banner.appendChild(bold);
            // Insert after the spiegazione div (menu explanation), not before
            const spiegazioneDiv = scrollWrapper.querySelector('.spiegazione:not(.ft-banner)');
            if (spiegazioneDiv && spiegazioneDiv.nextSibling) {
                scrollWrapper.insertBefore(banner, spiegazioneDiv.nextSibling);
            } else {
                scrollWrapper.insertBefore(banner, scrollWrapper.firstChild);
            }
        }

        if (!menuData) return;

        const navContainer = document.getElementById('category-nav');
        if (navContainer && (modalId == 'menuModal' || modalId == 'productListingPage')) {
            navContainer.innerHTML = '';
        }

        const menuExplanations = {
            "MENU(Panino + Patatine + Starter a scelta*** + Bibita)": {
                text: "BURGER + PATATINE + STARTER*** + BIBITA",
                bold: "+5,00€ al costo del panino"
            },
            "MENU(PANINO + PATATINE + BIBITA)": {
                text: "BURGER + PATATINE + BIBITA",
                bold: "+2,50€ al costo del panino"
            },
            "MENU(PANINO + PATATINE)": {
                text: "BURGER + PATATINE",
                bold: "+2,00€ al costo del panino"
            }
        };

        let hasMenuCategory = false;

        for (const [categoryName, products] of Object.entries(menuData)) {
            const filteredProducts = products.filter(p => p.available_in.includes(menuType));

            if (filteredProducts.length > 0) {
                if (menuExplanations[categoryName] && (modalId == 'menuModal' || modalId == 'productListingPage')) {
                    hasMenuCategory = true;
                    const expText = document.querySelector('#menu-scroll-wrapper .spiegazione-text');
                    const expBold = document.querySelector('#menu-scroll-wrapper .spiegazione-text-bold');

                    if (expText && expBold) {
                        expText.textContent = menuExplanations[categoryName].text;
                        expBold.textContent = menuExplanations[categoryName].bold;
                    }
                }

                const categoryTitle = document.createElement('h1');
                categoryTitle.classList.add('collapsible');

                const safeId = categoryName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                categoryTitle.id = safeId;

                if (categoryName.includes('(')) {
                    const parts = categoryName.split('(');
                    categoryTitle.textContent = parts[0].trim();

                    container.appendChild(categoryTitle);

                    const subtitle = document.createElement('p');
                    subtitle.className = 'category-subtitle';
                    subtitle.style.fontSize = "1.2rem";
                    subtitle.style.color = "#aaa";
                    subtitle.style.marginBottom = "15px";
                    subtitle.textContent = parts[1].replace(')', '').trim();
                    container.appendChild(subtitle);
                } else {
                    categoryTitle.textContent = categoryName;
                    container.appendChild(categoryTitle);
                }

                if (navContainer && (modalId == 'menuModal' || modalId == 'productListingPage')) {
                    const btn = document.createElement('button');
                    btn.className = 'category-nav-btn';
                    btn.setAttribute('data-target', safeId);
                    btn.textContent = categoryName.split('(')[0].trim();
                    btn.onclick = () => {
                        scrollTargetId = safeId;

                        document.querySelectorAll('.category-nav-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        categoryTitle.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        btn.scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',
                            block: 'nearest'
                        });
                    };
                    navContainer.appendChild(btn);
                }

                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('menu-grid', 'content');
                container.appendChild(categoryDiv);

                filteredProducts.forEach(product => {
                    const productDiv = createProductElement(product);
                    categoryDiv.appendChild(productDiv);
                });
            }
        }

        // Hide spiegazione div if no MENU category is present
        const spiegazioneDiv = document.querySelector('#menu-scroll-wrapper .spiegazione:not(.ft-banner)');
        if (spiegazioneDiv) {
            if (hasMenuCategory) {
                spiegazioneDiv.style.display = '';
            } else {
                spiegazioneDiv.style.display = 'none';
            }
        }

        if (navContainer && (modalId == 'menuModal' || modalId == 'productListingPage')) {
            const scrollWrapper = document.getElementById('menu-scroll-wrapper');
            if (scrollWrapper) {
                setupScrollSpy(scrollWrapper, navContainer);
            }
        }

        setupIngredientToggle(modalId, container);
    }

    function setupScrollSpy(scrollContainer, navContainer) {
        if (scrollContainer._scrollHandler) {
            scrollContainer.removeEventListener('scroll', scrollContainer._scrollHandler);
        }

        const scrollHandler = () => {
            const containerRect = scrollContainer.getBoundingClientRect();
            const headers = Array.from(scrollContainer.querySelectorAll('h1.collapsible'));

            const threshold = containerRect.top + 150;

            let activeHeader = null;

            for (const header of headers) {
                const headerRect = header.getBoundingClientRect();
                if (headerRect.top <= threshold) {
                    activeHeader = header;
                } else {
                    break;
                }
            }

            if (activeHeader) {
                if (scrollTargetId) {
                    if (activeHeader.id === scrollTargetId) {
                        scrollTargetId = null;
                    } else {
                        return;
                    }
                }

                const id = activeHeader.id;
                const activeBtn = navContainer.querySelector(`.category-nav-btn[data-target="${id}"]`);

                const currentlyActive = document.querySelectorAll('.category-nav-btn.active');
                const shouldUpdate = !activeBtn.classList.contains('active') || currentlyActive.length !== 1 || currentlyActive[0] !== activeBtn;

                if (shouldUpdate) {
                    document.querySelectorAll('.category-nav-btn').forEach(b => b.classList.remove('active'));
                    activeBtn.classList.add('active');
                    activeBtn.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                }
            }
        };

        scrollContainer.addEventListener('scroll', scrollHandler);
        scrollContainer._scrollHandler = scrollHandler;

        scrollHandler();
    }


    function createProductElement(product) {
        const productDiv = document.createElement('div');
        productDiv.classList.add('menu-item');

        product.allergeniIngredientiMap = {};
        let ingredienti = [];
        if (product.ingredients) {
            ingredienti = product.ingredients.split(",").map(i => i.trim());
        }

        ingredienti.forEach(ingrediente => {
            const nomeIngrediente = ingrediente.split(":")[0].trim();
            if (allergeniIngredientiMap.hasOwnProperty(nomeIngrediente)) {
                product.allergeniIngredientiMap[nomeIngrediente] = allergeniIngredientiMap[nomeIngrediente];
            }
        });

        const image = document.createElement('img');
        image.classList.add('product-img');
        image.src = product.thumb;
        image.loading = "lazy";
        productDiv.appendChild(image);

        const productInfoDiv = document.createElement('div');
        productInfoDiv.classList.add('menu-item-info');

        const title = document.createElement('h1');
        title.classList.add('product-title');
        title.textContent = product.title;

        if (product.title.toLowerCase().includes("green")) {
            const leafIcon = document.createElement('i');
            leafIcon.classList.add("fas", "fa-leaf");
            leafIcon.style.marginLeft = "10px";
            title.appendChild(leafIcon);
        }
        productInfoDiv.appendChild(title);

        const price = document.createElement('p');
        price.classList.add('product-price');
        price.textContent = typeof product.price === 'number' ?
            `${product.price.toFixed(2).toString().replace(".", ",")}€` :
            product.price;
        productInfoDiv.appendChild(price);

        let ingredients = [];
        if (product.ingredients) {
            ingredients = product.ingredients.split(",").map(i => i.trim());
        }

        const inlineText = document.createElement('p');
        inlineText.classList.add('product-description');
        inlineText.textContent = ingredients.join(", ");
        productInfoDiv.appendChild(inlineText);

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

    function setupIngredientToggle(modalId, container) {
        let toggleId
        if (modalId == 'menuModal' || modalId == 'productListingPage') {
            toggleId = 'toggleIngredientsLocale'
        } else if (modalId == 'foodtruck') {
            toggleId = 'toggleIngredientsFoodtruck'
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

            container.querySelectorAll('.collapsible.active').forEach(button => {
                const content = button.nextElementSibling;
                content.style.maxHeight = content.scrollHeight + 50 + 'px';
            });
        });
    }
});
const allowed_domains = new Set([
    "gmail.com", "outlook.com", "outlook.it", "hotmail.com", "live.com",
    "icloud.com", "me.com", "mac.com", "yahoo.com",
    "hotmail.it",
    "live.it",
    "yahoo.it",
    "libero.it", "virgilio.it", "tiscali.it", "alice.it",
    "tin.it", "email.it",
    "msn.com", "gmx.com", "gmx.net", "mail.com",
    "proton.me", "protonmail.com", "fastmail.com"
]);

function validateEmailDomain(input, errorSpanId = 'email-error') {
    const email = input.value.trim();
    const errorSpan = document.getElementById(errorSpanId);

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

function validateEmailComplete(input, errorSpanId = 'email-error') {
    const email = input.value.trim();
    const errorSpan = document.getElementById(errorSpanId);

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

        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

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

    function createErrorContainer(containerId) {
        const container = document.createElement('div');
        container.id = containerId;
        const form = document.getElementById("data-form");
        if (form && form.parentNode) {
            form.parentNode.insertBefore(container, form);
        }
        return container;
    }

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

    const otpInputs = document.querySelectorAll('.otp-input');

    if (otpInputs.length > 0) {
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }

                if (e.key === 'ArrowLeft' && index > 0) {
                    otpInputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();

                if (/^\d{6}$/.test(pastedData)) {
                    e.preventDefault();
                    pastedData.split('').forEach((char, i) => {
                        if (otpInputs[i]) {
                            otpInputs[i].value = char;
                        }
                    });
                    otpInputs[5].focus();
                }
            });

            input.addEventListener('click', (e) => {
                e.target.select();
            });
        });
    }

    function getOTPValue() {
        return Array.from(otpInputs)
            .map(input => input.value)
            .join('');
    }

    function resetOTP() {
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        if (otpInputs[0]) otpInputs[0].focus();
    }

    document.getElementById('back-to-register-btn').addEventListener('click', function () {
        document.getElementById('otp-section').style.display = 'none';

        document.getElementById('data-form').style.display = 'flex';

        const submitBtn = document.getElementById('submit-button');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Richiedi tessera";
        }

        if (typeof grecaptcha !== 'undefined' && typeof recaptchaWidgetId !== 'undefined') {
            try {
                grecaptcha.reset(recaptchaWidgetId);
            } catch (e) {
                console.warn("Recaptcha reset failed", e);
            }
        }

        resetOTP();
    });

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


    const appleWalletURL = getCookie("appleWalletURL");
    const googleWalletURL = getCookie("googleWalletURL");

    const form = document.getElementById("data-form");
    const resultSection = document.getElementById("result");
    const otpSection = document.getElementById("otp-section");
    const verifyOtpBtn = document.getElementById("verify-otp-btn");
    let registrationToken = null;

    if (appleWalletURL && googleWalletURL) {
        loadSVG('./img/add_to_apple_wallet.svg', 'appleSvgContainer');
        loadSVG('./img/add_to_google_wallet.svg', 'googleSvgContainer');

        document.getElementById("appleWalletButton").href = appleWalletURL;
        document.getElementById("googleWalletButton").href = googleWalletURL;

        form.style.display = "none";
        if (otpSection) otpSection.style.display = "none";
        resultSection.style.display = "block";
        return;
    }

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
            const response = await fetch(mainUrl + "/api/request-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 503) {
                    showError("Hai effettuato troppi tentativi. Riprova tra qualche minuto.");
                } else {
                    showError(errorData.error || "Errore sconosciuto durante la richiesta.");
                    if (typeof grecaptcha !== 'undefined' && typeof recaptchaWidgetId !== 'undefined') {
                        try {
                            grecaptcha.reset(recaptchaWidgetId);
                        } catch (e) {
                            console.warn("Recaptcha reset failed", e);
                        }
                    }
                }
                submitButton.disabled = false;
                submitButton.textContent = "Richiedi tessera";
                return;
            }

            const result = await response.json();
            registrationToken = result.registration_token;

            showSuccess(result.message || "Codice di verifica inviato alla tua email!");
            document.getElementById("user-email-display").textContent = formData.get("email");

            setTimeout(() => {
                form.style.display = "none";
                if (otpSection) {
                    otpSection.style.display = "flex";
                    otpSection.style.flexDirection = "column";
                    otpSection.style.alignItems = "center";
                    if (otpInputs[0]) otpInputs[0].focus();
                }
            }, 1000);

        } catch (error) {
            showError("Errore di connessione: " + error.message);
            submitButton.disabled = false;
            submitButton.textContent = "Richiedi tessera";
        }
    });

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
                    if (errorData.error === "Sessione scaduta o non valida. Ricomincia la registrazione." || errorData.error === "Troppi tentativi falliti. Ricomincia la registrazione.") {
                        document.getElementById('otp-section').style.display = 'none';

                        document.getElementById('data-form').style.display = 'flex';

                        const submitBtn = document.getElementById('submit-button');
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = "Richiedi tessera";
                        }

                        if (typeof grecaptcha !== 'undefined' && typeof recaptchaWidgetId !== 'undefined') {
                            try {
                                grecaptcha.reset(recaptchaWidgetId);
                            } catch (e) {
                                console.warn("Recaptcha reset failed", e);
                            }
                        }

                    }
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.textContent = "Verifica e Registrati";
                    return;
                }

                const verifyResult = await verifyResponse.json();

                const appleURL = mainUrl + verifyResult.apple_url;
                const googleURL = mainUrl + verifyResult.google_url;

                setCookie("appleWalletURL", appleURL, 30);
                setCookie("googleWalletURL", googleURL, 30);

                showSuccess("✅ Registrazione completata con successo!");

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

    window.getOTPValue = getOTPValue;
    window.resetOTP = resetOTP;
    window.showOTPError = showOTPError;
});

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


document.addEventListener("DOMContentLoaded", async () => {
    let merch = [];
    let cart = [];

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
            <button onclick="addToCart(${product.id}, this)" class="merch-button">Aggiungi al carrello</button>
        </div>
        `;

            container.appendChild(card);
        });
    }

    window.addToCart = function (productId, btn) {
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
            cart.push({
                id: productId,
                size,
                qty: 1
            });
        }

        // Feedback animation for the clicked button
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = "Aggiunto! ✓";
            btn.classList.add("clicked");
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove("clicked");
                btn.disabled = false;
            }, 1000);
        }

        renderCart();
    };

    function renderCart() {
        const container = document.getElementById("merch-cart-items");
        container.innerHTML = "";
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="merch-cart-empty-container">
                    <svg style="width: 40px; height: 40px; color: #555; margin-bottom: 12px;" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
                    </svg>
                    <p class="merch-empty">Il tuo carrello è vuoto.</p>
                    <p class="merch-empty-sub">Aggiungi qualche prodotto del nostro Merch per iniziare!</p>
                </div>
            `;
            updateFloatingCartButton();
            return;
        }

        let total = 0;
        cart.forEach((item, index) => {
            const product = merch.find(p => p.id === item.id);
            total += product.price * item.qty;

            const row = document.createElement("div");
            row.className = "merch-cart-item";
            row.innerHTML = `
                <div class="merch-cart-item-details">
                    <span class="merch-cart-item-qty">${item.qty}x</span>
                    <div class="merch-cart-item-info">
                        <span class="merch-cart-item-name">${product.name}</span>
                        <span class="merch-cart-item-size">Taglia: ${item.size}</span>
                    </div>
                </div>
                <div class="merch-cart-item-actions">
                    <span class="merch-cart-item-price">€${(product.price * item.qty).toFixed(2)}</span>
                    <button onclick="removeCartItem(${index})" class="merch-remove" aria-label="Rimuovi prodotto">
                        <svg style="width: 16px; height: 16px;" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });

        const totalRow = document.createElement("div");
        totalRow.className = "merch-cart-total";
        totalRow.innerHTML = `
            <span>Totale ordine:</span>
            <strong>€${total.toFixed(2)}</strong>
        `;
        container.appendChild(totalRow);

        updateFloatingCartButton();
    }

    // Floating cart button logic
    const floatBtn = document.getElementById("floating-cart-btn");
    const orderModal = document.getElementById("orderModal");
    const cartContainer = document.getElementById("merch-cart-items") ? document.getElementById("merch-cart-items").closest(".merch-card") : null;
    let isCartIntersecting = false;

    function updateFloatingCartButtonVisibility() {
        if (!floatBtn) return;
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const isOrderModalOpen = window.location.hash === "#orderModal";
        if (totalItems > 0 && !isCartIntersecting && isOrderModalOpen) {
            floatBtn.classList.add("visible");
        } else {
            floatBtn.classList.remove("visible");
        }
    }

    function updateFloatingCartButton() {
        if (!floatBtn) return;
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const countSpan = floatBtn.querySelector(".floating-cart-count");
        if (countSpan) {
            countSpan.textContent = totalItems;
        }
        
        updateFloatingCartButtonVisibility();

        if (totalItems > 0) {
            // Pulse animation
            floatBtn.classList.remove("pulse");
            void floatBtn.offsetWidth; // trigger reflow
            floatBtn.classList.add("pulse");
        }
    }

    if (floatBtn && orderModal && cartContainer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isCartIntersecting = entry.isIntersecting;
                updateFloatingCartButtonVisibility();
            });
        }, {
            root: orderModal,
            threshold: 0.1
        });
        observer.observe(cartContainer);

        floatBtn.addEventListener("click", () => {
            cartContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        window.addEventListener("popstate", updateFloatingCartButtonVisibility);
        window.addEventListener("hashchange", updateFloatingCartButtonVisibility);
        window.updateFloatingCartButtonVisibility = updateFloatingCartButtonVisibility;
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
            document.getElementById("merch-products").style.display = "none";
            document.querySelector("#merch-active-content .merch-card").style.display = "none";
            document.getElementById("confirmationMessage").style.display = "block";
            document.getElementById("orderNumberDisplay").textContent = resultText;

            cart = [];
            renderCart();
        } catch (err) {
            console.error(err);
            alert("Errore: " + err.message);
        }

    };

    const newOrderBtn = document.getElementById("newOrderButton");
    if (newOrderBtn) {
        newOrderBtn.addEventListener("click", () => {
            document.querySelector("form").style.display = "block";
            document.getElementById("merch-products").style.display = "";
            document.querySelector("#merch-active-content .merch-card").style.display = "";
            document.getElementById("confirmationMessage").style.display = "none";
            document.querySelector("form").reset();
        });
    }

    await fetchMerch();
});



document.addEventListener('DOMContentLoaded', () => {

    const cookieConsentBanner = document.getElementById("cookieConsent");
    const acceptCookiesBtn = document.getElementById("acceptCookiesBtn");
    const rejectCookiesBtn = document.getElementById("rejectCookiesBtn");
    const cookieWarning = document.getElementById("cookieMsg");
    const cookieOrderWarning = document.getElementById("cookieOrderMsg");
    const dataForm = document.getElementById("data-form");
    const orderForm = document.getElementById("merch-active-content");

    let recaptchaLoaded = false;


    function checkCookieConsent() {
        if (!localStorage.getItem("cookieConsent")) {
            cookieConsentBanner.style.display = "block";
            disableForm();
        } else {
            enableForm();
        }
    }

    const appleWalletURL = getCookie("appleWalletURL");
    const googleWalletURL = getCookie("googleWalletURL");

    function enableForm() {
        if (!appleWalletURL && !googleWalletURL) {
            dataForm.style.display = "flex";
        }
        orderForm.style.display = "block";
        cookieWarning.style.display = "none";
        cookieOrderWarning.style.display = "none";
    }

    function disableForm() {
        dataForm.style.display = "none";
        orderForm.style.display = "none";
        cookieWarning.style.display = "block";
        cookieOrderWarning.style.display = "block";
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

    window.onRecaptchaLoad = function () {
        const recaptchaContainer = document.getElementById("recaptcha-container");
        const recaptchaContainerOrder = document.getElementById("recaptcha-container-order");
        if (recaptchaContainer) {
            recaptchaWidgetId = grecaptcha.render(recaptchaContainer, {
                sitekey: "6LeNBt0qAAAAAOkMEYknDVLtPCkhhSo7Fc4gh-r_",
            });
        }
        if (recaptchaContainerOrder) {
            recaptchaOrderWidgetId = grecaptcha.render(recaptchaContainerOrder, {
                sitekey: "6LeNBt0qAAAAAOkMEYknDVLtPCkhhSo7Fc4gh-r_",
            });
        }
    };


    window.handleRouting = function () {
        const hash = window.location.hash.substring(1);
        const landing = document.getElementById('landing-page');

        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        
        // Pulisci gli overlay del feedback se usciamo dalla rotta di feedback
        if (!hash.startsWith('feedback')) {
            const lOverlay = document.getElementById('loadingOverlay');
            const gOverlay = document.getElementById('googleMapsModal');
            if (lOverlay) lOverlay.classList.remove('active');
            if (gOverlay) gOverlay.classList.remove('active');
        }

        if (hash) {
            let modalId = hash;
            let doSpecialRoute = false;
            let newStore = null;

            // Integrazione Gestione Feedback Modal
            let idScontrino = null;
            if (hash.startsWith('feedback')) {
                modalId = 'feedbackModal';
                const paramIndex = hash.indexOf('?');
                if (paramIndex !== -1) {
                    const params = new URLSearchParams(hash.substring(paramIndex + 1));
                    idScontrino = params.get('id_scontrino');
                }
            } else if (hash === 'foodtruck' || hash === 'noglutine') {
                modalId = 'productListingPage';
                doSpecialRoute = true;
                newStore = hash === 'foodtruck' ? "FOODTRUCK" : "GLUTENFREE";
                history.replaceState(null, '', '#menu-' + newStore.toLowerCase());
            } else if (hash.startsWith('menu-')) {
                modalId = 'productListingPage';
                doSpecialRoute = true;
                newStore = hash.substring(5).toUpperCase();
            }

            const modal = document.getElementById(modalId);
            if (modal) {
                if (landing) landing.style.display = 'none';
                modal.style.display = 'block';

                if (modalId === 'feedbackModal') {
                    if (idScontrino) {
                        verifyReceipt(idScontrino);
                    } else {
                        showReceiptError("Scontrino Mancante", "Per favore, inquadra il QR Code sullo scontrino per lasciare un feedback.");
                    }
                }

                if (doSpecialRoute) {
                    if (typeof window.generateMenu === 'function') {
                        window.generateMenu('productListingPage', newStore);
                    }
                }

                if (modalId === "membershipModal" || modalId === "orderModal") {
                    if (!localStorage.getItem("cookieConsent")) {
                        disableForm();
                    } else {
                        enableForm();
                        loadRecaptcha();
                    }
                }

                // Lazy load Leaflet when menu modal is opened
                if (modalId === "menuModal") {
                    initializeFoodTruckMap();
                }
            } else {
                if (landing) landing.style.display = 'flex';
            }
        } else {
            if (landing) landing.style.display = 'flex';
        }
        if (typeof window.updateFloatingCartButtonVisibility === 'function') {
            window.updateFloatingCartButtonVisibility();
        }
        window.scrollTo(0, 0);
    };





    acceptCookiesBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        cookieConsentBanner.style.display = "none";
        enableForm();
        const hash = window.location.hash.substring(1);
        if (hash === "membershipModal" || hash === "orderModal") {
            loadRecaptcha();
        }
    });

    rejectCookiesBtn.addEventListener("click", function () {
        localStorage.removeItem("cookieConsent");
        cookieConsentBanner.style.display = "none";
        disableForm();
    });

    checkCookieConsent();

    document.querySelectorAll('.open-modal').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = button.getAttribute('data-modal');

            history.pushState(null, '', `#${modalId}`);
            window.handleRouting();
        });
    });

    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const targetId = closeBtn.getAttribute('data-target');

            if (targetId && targetId !== 'home') {
                history.replaceState(null, '', `#${targetId}`);
                window.handleRouting();
            } else {
                history.replaceState(null, '', window.location.pathname);
                window.handleRouting();
            }
        });
    });

    // --- INTEGRATO DA FEEDBACK PROJECT ---
    const feedbackFormEl = document.getElementById('feedbackForm');
    const reviewInputEl = document.getElementById('review');
    const charCountEl = document.getElementById('charCount');
    const loadingOverlayEl = document.getElementById('loadingOverlay');
    const googleMapsModalEl = document.getElementById('googleMapsModal');
    const closeModalBtnEl = document.getElementById('closeModalBtn');
    const copyReviewBtnEl = document.getElementById('copyReviewBtn');
    const reviewTextPreviewEl = document.getElementById('reviewTextPreview');
    const leaveGoogleReviewBtnEl = document.getElementById('leaveGoogleReviewBtn');
    
    const photosInputEl = document.getElementById('photos');
    const photoPreviewContainerEl = document.getElementById('photoPreviewContainer');
    const dropzoneEl = document.getElementById('dropzone');
    const dropzonePromptEl = document.getElementById('dropzonePrompt');

    const receiptStatusContainerEl = document.getElementById('receiptStatusContainer');
    const feedbackFormWrapperEl = document.getElementById('feedbackFormWrapper');
    const receiptStatusTitleEl = document.getElementById('receiptStatusTitle');
    const receiptStatusMessageEl = document.getElementById('receiptStatusMessage');

    let validFilesToUpload = [];
    let currentReceiptId = null;
    let currentBonusToken = null;
    let currentUploadToken = null;
    let currentShopId = null;

    function showReceiptError(title, message) {
        if (receiptStatusTitleEl) {
            receiptStatusTitleEl.textContent = title;
            receiptStatusTitleEl.style.color = '#ef4444';
        }
        if (receiptStatusMessageEl) receiptStatusMessageEl.textContent = message;
        if (receiptStatusContainerEl) receiptStatusContainerEl.style.display = 'block';
        if (feedbackFormWrapperEl) feedbackFormWrapperEl.style.display = 'none';
    }

    async function verifyReceipt(id) {
        if (!receiptStatusTitleEl || !receiptStatusMessageEl || !receiptStatusContainerEl || !feedbackFormWrapperEl) return;
        
        receiptStatusTitleEl.textContent = "Verifica Scontrino...";
        receiptStatusTitleEl.style.color = 'white'; // reset color
        receiptStatusMessageEl.textContent = "Controllo validità e data...";
        receiptStatusContainerEl.style.display = 'block';
        feedbackFormWrapperEl.style.display = 'none';
        
        // 1. Pre-validazione Front-end Data
        try {
            if (id.length < 62) throw new Error("ID Scontrino troppo corto o malformato");
            
            const dateStr = id.substring(43, 51);
            const dd = parseInt(dateStr.substring(0, 2), 10);
            const mm = parseInt(dateStr.substring(2, 4), 10);
            const yyyy = parseInt(dateStr.substring(4, 8), 10);
            
            const timeStr = id.substring(51, 57);
            const hh = parseInt(timeStr.substring(0, 2), 10);
            const mi = parseInt(timeStr.substring(2, 4), 10);
            const ss = parseInt(timeStr.substring(4, 6), 10);
            
            const receiptDateTime = new Date(yyyy, mm - 1, dd, hh, mi, ss);
            const now = new Date();
            
            const diffMs = now - receiptDateTime;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours > 24 || diffHours < -0.25) { // 24 ore max, tolleranza di 15 minuti per disallineamenti di orologio
                showReceiptError("Scontrino Scaduto", "I feedback possono essere inviati solo entro 24 ore dall'emissione dello scontrino.");
                return;
            }
        } catch (e) {
            showReceiptError("Errore", "Scontrino malformato.");
            return;
        }

        // 2. Validazione Server / ZMENU
        try {
            const response = await fetch(`${mainUrl}/v1/feedback/verify-receipt/${id}`);
            const data = await response.json();

            if (!response.ok) {
                showReceiptError("Errore Scontrino", data.detail || "Impossibile verificare lo scontrino.");
                return;
            }

            // Scontrino Valido
            currentReceiptId = id;
            currentUploadToken = data.upload_token; // Salva token di caricamento foto
            currentShopId = data.shop_id; // Salva lo shop_id dello scontrino
            
            receiptStatusContainerEl.style.display = 'none';
            feedbackFormWrapperEl.style.display = 'block';
            
            const emailContactGroup = document.getElementById('emailContactGroup');
            if (emailContactGroup) {
                emailContactGroup.style.display = data.has_loyalty_card ? 'none' : 'block';
            }
            
            const loyaltyBanner = document.getElementById('loyaltyBanner');
            if (loyaltyBanner) {
                if (data.has_loyalty_card) {
                    if (!data.min_amount_reached) {
                        loyaltyBanner.innerHTML = "ℹ️ Non hai raggiunto l'ordine minimo (10€) per ricevere punti bonus per il feedback, ma siamo grati per la tua recensione! ❤️";
                        loyaltyBanner.style.backgroundColor = "rgba(52, 152, 219, 0.12)";
                        loyaltyBanner.style.color = "#2980b9";
                        loyaltyBanner.style.border = "1px solid rgba(52, 152, 219, 0.25)";
                    } else if (data.eligible_for_points) {
                        loyaltyBanner.innerHTML = "🎁 Riceverai <strong>10 Punti Fedeltà</strong> per la tua prima recensione di oggi!";
                        loyaltyBanner.style.backgroundColor = "rgba(46, 204, 113, 0.15)";
                        loyaltyBanner.style.color = "#27ae60";
                        loyaltyBanner.style.border = "1px solid rgba(46, 204, 113, 0.3)";
                    } else {
                        loyaltyBanner.innerHTML = "Hai già inviato un feedback oggi. Non riceverai punti aggiuntivi, ma siamo grati della tua preziosa recensione! ❤️";
                        loyaltyBanner.style.backgroundColor = "rgba(243, 156, 18, 0.15)";
                        loyaltyBanner.style.color = "#d35400";
                        loyaltyBanner.style.border = "1px solid rgba(243, 156, 18, 0.3)";
                    }
                    loyaltyBanner.style.display = 'block';
                } else {
                    loyaltyBanner.innerHTML = "ℹ️ Non abbiamo rilevato una tessera valida per questo ordine. Ti ricordiamo che puoi creare una tessera su <a href='https://cicciosburger.it' target='_blank' style='color: inherit; text-decoration: underline; font-weight: bold;'>cicciosburger.it</a>";
                    loyaltyBanner.style.backgroundColor = "rgba(52, 152, 219, 0.12)";
                    loyaltyBanner.style.color = "#2980b9";
                    loyaltyBanner.style.border = "1px solid rgba(52, 152, 219, 0.25)";
                    loyaltyBanner.style.display = 'block';
                } 
            }

        } catch (error) {
            showReceiptError("Errore di Connessione", "Impossibile collegarsi al server.");
        }
    }

    function setupStarRating(containerId, inputId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const input = document.getElementById(inputId);
        const stars = container.querySelectorAll('.star');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                input.value = value;
                updateStars(stars, value);
                const groupEl = container.closest('.form-group');
                if (groupEl) {
                    groupEl.classList.remove('invalid-rating');
                }
            });

            star.addEventListener('mouseover', () => {
                const value = star.getAttribute('data-value');
                updateStars(stars, value, true);
            });

            star.addEventListener('mouseout', () => {
                updateStars(stars, input.value);
            });
        });
    }

    function updateStars(starsNodeList, value, hover = false) {
        starsNodeList.forEach(star => {
            const starValue = star.getAttribute('data-value');
            if (starValue <= value) {
                star.classList.add(hover ? 'hover' : 'active');
            } else {
                star.classList.remove('hover', 'active');
            }
        });
        if (!hover) {
            starsNodeList.forEach(star => star.classList.remove('hover'));
        }
    }

    if (feedbackFormEl) {
        setupStarRating('starsRating', 'stars');
        setupStarRating('foodRating', 'food_quality');
        setupStarRating('serviceRating', 'service_quality');
        setupStarRating('speedRating', 'speed_quality');
        setupStarRating('cleanlinessRating', 'cleanliness');

        if (reviewInputEl && charCountEl) {
            reviewInputEl.addEventListener('input', () => {
                charCountEl.textContent = reviewInputEl.value.length;
            });
        }

        if (dropzoneEl && photosInputEl && photoPreviewContainerEl) {
            dropzoneEl.addEventListener('click', (e) => {
                if (!photoPreviewContainerEl.contains(e.target)) {
                    photosInputEl.click();
                }
            });

            photoPreviewContainerEl.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            dropzoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzoneEl.classList.add('dragover');
            });

            ['dragleave', 'dragend', 'drop'].forEach(type => {
                dropzoneEl.addEventListener(type, () => {
                    dropzoneEl.classList.remove('dragover');
                });
            });

            dropzoneEl.addEventListener('drop', (e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                handleFilesSelection(files);
            });

            photosInputEl.addEventListener('change', () => {
                const files = Array.from(photosInputEl.files);
                handleFilesSelection(files);
            });
        }
    }

    function handleFilesSelection(files) {
        let errorMsg = "";
        if (validFilesToUpload.length + files.length > 3) {
            errorMsg = "⚠️ Puoi caricare al massimo 3 foto complessive.";
            renderPhotoGrid(errorMsg);
            return;
        }

        files.forEach(file => {
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > 5) {
                errorMsg = `❌ "${file.name}" supera il limite consentito di 5MB.`;
            } else if (!validFilesToUpload.some(f => f.name === file.name && f.size === file.size)) {
                validFilesToUpload.push(file);
            }
        });

        renderPhotoGrid(errorMsg);
    }

    function renderPhotoGrid(errorMsg = "") {
        if (!photoPreviewContainerEl) return;
        photoPreviewContainerEl.innerHTML = '';
        
        validFilesToUpload.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                removeFile(index);
            };
            
            card.appendChild(img);
            card.appendChild(deleteBtn);
            photoPreviewContainerEl.appendChild(card);
        });

        if (dropzonePromptEl) {
            if (validFilesToUpload.length >= 3) {
                dropzonePromptEl.style.display = 'none';
            } else {
                dropzonePromptEl.style.display = 'flex';
            }
        }

        if (errorMsg) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'photo-error-message';
            errorDiv.textContent = errorMsg;
            photoPreviewContainerEl.appendChild(errorDiv);
        }
    }

    function removeFile(index) {
        validFilesToUpload.splice(index, 1);
        renderPhotoGrid();
    }
    
    async function uploadImages() {
        if (validFilesToUpload.length === 0) return [];
        
        const imageIds = [];
        for (const file of validFilesToUpload) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch(`${mainUrl}/v1/feedback/upload-image`, {
                    method: 'POST',
                    headers: {
                        'X-Upload-Token': currentUploadToken
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    imageIds.push(data.id);
                } else {
                    const errData = await response.json();
                    alert(errData.detail || `Errore nel caricamento di ${file.name}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
        return imageIds;
    }

    if (feedbackFormEl) {
        feedbackFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Resetta stili di errore precedenti
            document.querySelectorAll('#feedbackModal .form-group').forEach(grp => {
                grp.classList.remove('invalid-rating');
            });

            const ratings = [
                { id: 'food_quality', name: 'Qualità del cibo' },
                { id: 'service_quality', name: 'Servizio e cortesia' },
                { id: 'speed_quality', name: 'Velocità' },
                { id: 'cleanliness', name: 'Pulizia' },
                { id: 'stars', name: 'Voto Generale' }
            ];

            let firstInvalidGroup = null;
            let hasError = false;

            for (const item of ratings) {
                const val = parseInt(document.getElementById(item.id).value);
                if (isNaN(val)) {
                    hasError = true;
                    const inputEl = document.getElementById(item.id);
                    const groupEl = inputEl.closest('.form-group');
                    if (groupEl) {
                        groupEl.classList.add('invalid-rating');
                        if (!firstInvalidGroup) {
                            firstInvalidGroup = groupEl;
                        }
                    }
                }
            }

            if (hasError) {
                if (firstInvalidGroup) {
                    firstInvalidGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Validazione formato email di contatto tramite Regex (se visibile ed inserita)
            const emailContactGroup = document.getElementById('emailContactGroup');
            const contactEmailEl = document.getElementById('contact_email');
            if (emailContactGroup && emailContactGroup.style.display !== 'none' && contactEmailEl) {
                const contactEmail = contactEmailEl.value.trim();
                const groupEl = contactEmailEl.closest('.form-group');
                if (groupEl) groupEl.classList.remove('invalid-email');
                
                if (contactEmail) {
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(contactEmail)) {
                        if (groupEl) {
                            groupEl.classList.add('invalid-email');
                            groupEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        return;
                    }
                }
            }

            const stars = parseInt(document.getElementById('stars').value);
            const food = parseInt(document.getElementById('food_quality').value);
            const service = parseInt(document.getElementById('service_quality').value);
            const speed = parseInt(document.getElementById('speed_quality').value);
            const clean = parseInt(document.getElementById('cleanliness').value);

            if (loadingOverlayEl) loadingOverlayEl.classList.add('active');
            
            const imageIds = await uploadImages();

            const contactEmail = contactEmailEl ? contactEmailEl.value.trim() : null;
            
            const payload = {
                id_scontrino: currentReceiptId,
                stars: stars,
                food_quality: food,
                service_quality: service,
                speed_quality: speed,
                cleanliness: clean,
                order_type: document.getElementById('order_type').value,
                review: reviewInputEl.value.trim(),
                contact_email: contactEmail || null,
                consent_contact: document.getElementById('consentContact').checked,
                image_ids: imageIds
            };

            try {
                const response = await fetch(`${mainUrl}/v1/feedback/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (loadingOverlayEl) loadingOverlayEl.classList.remove('active');

                if (!response.ok) {
                    alert(data.detail ? JSON.stringify(data.detail) : "Errore durante l'invio del feedback.");
                    return;
                }

                currentBonusToken = data.bonus_token;

                if (payload.stars === 5 && googleMapsModalEl && reviewTextPreviewEl) {
                    reviewTextPreviewEl.textContent = payload.review || "Grazie per il servizio fantastico!";
                    
                    const earnedPointsMessage = document.getElementById('earnedPointsMessage');
                    if (earnedPointsMessage) {
                        if (data.points_awarded > 0) {
                            earnedPointsMessage.textContent = `Hai appena ricevuto ${data.points_awarded} Punti Fedeltà! 🎁`;
                        } else {
                            earnedPointsMessage.textContent = "";
                        }
                    }
                    
                    // Associa il link Google Maps corretto allo shop_id del locale dello scontrino
                    const googleLinks = {
                        1: "https://g.page/r/CbsPCzOzinijEBM/review",
                        2: "https://g.page/r/CZUYaLApJkg6EBM/review",
                        3: "https://g.page/r/CWi3u76szxXbEBM/review",
                        5: "https://g.page/r/CfxNiBYtEtLjEBM/review",
                        7: "https://g.page/r/CarxQuOMfjwYEBM/review"
                    };
                    const defaultLink = "https://g.page/r/CbsPCzOzinijEBM/review";
                    if (leaveGoogleReviewBtnEl) {
                        leaveGoogleReviewBtnEl.href = googleLinks[currentShopId] || defaultLink;
                    }
                    
                    googleMapsModalEl.classList.add('active');
                } else {
                    resetFormState();
                    const title = "Feedback Inviato!";
                    const message = data.points_awarded > 0 
                        ? `Grazie mille! Ti sono stati accreditati ${data.points_awarded} Punti Fedeltà. Puoi chiudere questa pagina.`
                        : "Grazie per il tuo feedback! Puoi chiudere questa pagina.";
                    showReceiptError(title, message);
                    if (receiptStatusTitleEl) receiptStatusTitleEl.style.color = '#2ecc71'; // Verde successo
                }

            } catch (error) {
                if (loadingOverlayEl) loadingOverlayEl.classList.remove('active');
                alert("Errore di connessione. Riprova più tardi.");
                console.error(error);
            }
        });
    }

    if (leaveGoogleReviewBtnEl) {
        leaveGoogleReviewBtnEl.addEventListener('click', async (e) => {
            if (currentBonusToken) {
                try {
                    await fetch(`${mainUrl}/v1/feedback/bonus-points`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bonus_token: currentBonusToken })
                    });
                    currentBonusToken = null;
                } catch (e) {
                    console.error("Failed to assign bonus points", e);
                }
            }
        });
    }

    function resetAllStars() {
        const categories = ['starsRating', 'foodRating', 'serviceRating', 'speedRating', 'cleanlinessRating'];
        categories.forEach(cat => {
            const container = document.getElementById(cat);
            if (container) {
                const stars = container.querySelectorAll('.star');
                updateStars(stars, 0);
            }
        });
    }

    function resetFormState() {
        if (feedbackFormEl) feedbackFormEl.reset();
        resetAllStars();
        if (charCountEl) charCountEl.textContent = '0';
        validFilesToUpload = [];
        if (photoPreviewContainerEl) photoPreviewContainerEl.innerHTML = '';
        if (dropzonePromptEl) dropzonePromptEl.style.display = 'flex';
        currentBonusToken = null;
        currentUploadToken = null;
        const emailContactGroup = document.getElementById('emailContactGroup');
        if (emailContactGroup) emailContactGroup.style.display = 'none';
    }

    if (closeModalBtnEl) {
        closeModalBtnEl.addEventListener('click', () => {
            if (googleMapsModalEl) googleMapsModalEl.classList.remove('active');
            resetFormState();
            showReceiptError("Feedback Inviato", "Grazie mille! Puoi chiudere questa pagina.");
        });
    }

    if (copyReviewBtnEl) {
        copyReviewBtnEl.addEventListener('click', () => {
            if (reviewTextPreviewEl) {
                navigator.clipboard.writeText(reviewTextPreviewEl.textContent).then(() => {
                    const originalText = copyReviewBtnEl.textContent;
                    copyReviewBtnEl.textContent = "Copiato!";
                    setTimeout(() => {
                        copyReviewBtnEl.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert("Impossibile copiare il testo.");
                });
            }
        });
    }

    // Rimuove l'errore email durante la digitazione
    const contactEmailInput = document.getElementById('contact_email');
    if (contactEmailInput) {
        contactEmailInput.addEventListener('input', () => {
            const groupEl = contactEmailInput.closest('.form-group');
            if (groupEl) {
                groupEl.classList.remove('invalid-email');
            }
        });
    }

    // Inizializza il routing a caricamento completo
    window.addEventListener('popstate', window.handleRouting);
    window.handleRouting();

});