let mainUrl = 'https://api.cicciosburger.it'
let recaptchaWidgetId;
let recaptchaOrderWidgetId;
let foodtruckMap;

document.addEventListener("DOMContentLoaded", async () => {
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
});

document.addEventListener('DOMContentLoaded', function () {

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

            if (window.location.hash === '#foodtruck') {
                currentStore = "FOODTRUCK";

                const productPage = document.getElementById('productListingPage');
                if (productPage) {
                    const landing = document.getElementById('landing-page');
                    if (landing) landing.style.display = 'none';
                    productPage.style.display = 'block';
                    window.scrollTo(0, 0);
                }
                history.replaceState(null, '', '#productListingPage');
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

                    history.pushState(null, '', '#productListingPage');
                });
            });
        })
        .catch(error => console.error('Error loading menu:', error));

    function generateMenu(modalId, menuType) {
        let contentId
        if (modalId == 'menuModal' || modalId == 'productListingPage') {
            contentId = 'generatedContentLocale'
        }

        const container = document.getElementById(contentId);
        container.innerHTML = '';

        if (!menuData) return;

        const navContainer = document.getElementById('category-nav');
        if (navContainer && (modalId == 'menuModal' || modalId == 'productListingPage')) {
            navContainer.innerHTML = '';
        }

        const menuExplanations = {
            "MENU(Panino + Patatine + Starter a scelta*** + Bibita)": {
                text: "BURGER + PATATINE + STARTER*** + BIBITA",
                bold: "+3,50€ al costo del panino"
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

        for (const [categoryName, products] of Object.entries(menuData)) {
            const filteredProducts = products.filter(p => p.available_in.includes(menuType));

            if (filteredProducts.length > 0) {
                if (menuExplanations[categoryName] && (modalId == 'menuModal' || modalId == 'productListingPage')) {
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
        const ingredienti = product.ingredients?.split(",").map(i => i.trim()) || [];

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

        const ingredients = product.ingredients?.split(",").map(i => i.trim()) || [];

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
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').trim();

                if (/^\d{6}$/.test(pastedData)) {
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
            cart.push({
                id: productId,
                size,
                qty: 1
            });
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
            loadRecaptcha();
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

        if (hash) {
            const modal = document.getElementById(hash);
            if (modal) {
                if (landing) landing.style.display = 'none';
                modal.style.display = 'block';

                if (hash === "membershipModal") {
                    if (!localStorage.getItem("cookieConsent")) {
                        disableForm();
                    } else {
                        enableForm();
                    }
                }
            } else {
                if (landing) landing.style.display = 'flex';
            }
        } else {
            if (landing) landing.style.display = 'flex';
        }
        window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', window.handleRouting);

    window.handleRouting();



    acceptCookiesBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        cookieConsentBanner.style.display = "none";
        enableForm();
        loadRecaptcha();
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

});