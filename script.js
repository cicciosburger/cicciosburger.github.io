document.addEventListener("DOMContentLoaded", function () {
    const showMenuButton = document.getElementById("showMenuButton");
    const modal = document.getElementById("menuModal");
    const closeMenuBtn = document.getElementById("closeMenuBtn");

    showMenuButton.onclick = function () {
        modal.style.display = "block";
    };

    closeMenuBtn.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Mappatura degli allergeni con le classi CSS
    const allergeniMap = {
        "Glutine": {
            className: "glutine",
            emoji: "🌾"
        },
        "Latte": {
            className: "latte",
            emoji: "🥛"
        },
        "Uova": {
            className: "uova",
            emoji: "🥚"
        },
        "Frutta a guscio": {
            className: "frutta-a-guscio",
            emoji: "🌰"
        },
        "Arachidi": {
            className: "arachidi",
            emoji: "🥜"
        },
        "Soia": {
            className: "soia",
            emoji: "🌱"
        },
        "Pesce": {
            className: "pesce",
            emoji: "🐟"
        },
        "Crostacei": {
            className: "crostacei",
            emoji: "🦐"
        },
        "Molluschi": {
            className: "molluschi",
            emoji: "🐚"
        },
        "Sedano": {
            className: "sedano",
            emoji: "🥬"
        },
        "Lupini": {
            className: "lupini",
            emoji: "🌼"
        },
        "Sesamo": {
            className: "sesamo",
            emoji: "⚪"
        },
        "Senape": {
            className: "senape",
            emoji: "🟡"
        },
        "Solfiti": {
            className: "solfiti",
            emoji: "⚗️"
        },
    };

    // Load categories and products
    Promise.all([
            fetch('categories.json').then(response => response.json()),
            fetch('products.json').then(response => response.json())
        ])
        .then(([categoryData, productData]) => {
            const outerContainer = document.getElementById("generatedContentMenu");

            categoryData.payload.categories.forEach(category => {
                const categoryTitle = document.createElement("button");
                categoryTitle.classList.add("collapsible");
                categoryTitle.textContent = category.title;
                outerContainer.appendChild(categoryTitle);

                const categoryDiv = document.createElement("div");
                categoryDiv.classList.add("menu-grid", "content");
                outerContainer.appendChild(categoryDiv);



                category.items_assoc.forEach(item => {
                    const product = productData.payload.products.find(p => p.id === item.product_id);

                    if (product) {
                        const productDiv = document.createElement("div");
                        productDiv.classList.add("menu-item");

                        const title = document.createElement("h1");
                        title.classList.add("product-title");

                        const price = document.createElement("p");
                        price.classList.add("product-price");

                        // Check if the product title contains "green" (case-insensitive)
                        if (product.title.toLowerCase().includes("green")) {
                            const leafIcon = document.createElement("i");
                            leafIcon.classList.add("fas", "fa-leaf");
                            leafIcon.style.marginLeft = "10px"; // Add some spacing
                            title.appendChild(leafIcon);
                        }


                        if (product.price[0].price == 0) {
                            let titleExtracted, lowestPrice;
                            lowestPrice = product.variants[0].items[0].price_variation;
                            titleExtracted = product.title
                            if (product.title.includes("(")) {
                                let inputString = product.title;
                                const openParenIndex = inputString.indexOf("(");

                                if (openParenIndex !== -1) {
                                    titleExtracted = inputString.slice(0, openParenIndex).trim();
                                } else {
                                    titleExtracted = inputString.trim();
                                    lowestPrice = "";
                                }


                            } //menu
                            for (item in product.variants[0].items) {
                                if (item.price_variation < lowestPrice) {
                                    lowestPrice = item.price_variation;
                                }
                            }
                            title.prepend(document.createTextNode(titleExtracted)); // Add text before the icon
                            price.textContent = `da ${parseFloat(lowestPrice).toFixed(2).toString().replace(".",",")}€`;

                        } else {
                            title.prepend(document.createTextNode(product.title)); // Add text before the icon
                            price.textContent = `${parseFloat(product.price[0].price).toFixed(2).toString().replace(".", ",")}€`;
                        }

                        const image = document.createElement("img");
                        image.classList.add("product-img");
                        image.src = product.thumb.thumb;

                        const description = document.createElement("p");
                        description.classList.add("product-description");
                        description.textContent = product.ingredients;

                        productDiv.appendChild(image);
                        productDiv.appendChild(title);
                        productDiv.appendChild(description);
                        productDiv.appendChild(price);
                        if (product.allergens) {
                            // Contenitore in cui aggiungere le icone
                            const allergeniContainer = document.createElement("div");
                            allergeniContainer.classList.add("allergeni-container");


                            const allergeniText = document.createElement("p");
                            allergeniText.classList.add("allergeni-text");
                            // allergeniText.classList.add("product-description");
                            allergeniText.textContent = "Allergeni"
                            allergeniContainer.appendChild(allergeniText)
                            // Dividiamo la lista degli allergeni
                            listallergeni = product.allergens;
                            const allergeniArray = listallergeni.split(", ");

                            const allergeniInnerContainer = document.createElement("div");
                            allergeniInnerContainer.classList.add("allergeni-inner-container");
                            allergeniContainer.appendChild(allergeniInnerContainer);

                            // Iteriamo sugli allergeni e aggiungiamo le icone
                            allergeniArray.forEach(allergene => {
                                const allergeneData = allergeniMap[allergene];
                                if (allergeneData) {
                                    // Creiamo l'elemento div per l'icona
                                    const icona = document.createElement("div");
                                    icona.className = `icona ${allergeneData.className}`;
                                    icona.textContent = allergeneData.emoji; // Mostra solo l'icona (emoji)
                                    allergeniInnerContainer.appendChild(icona);
                                }
                            });

                            productDiv.appendChild(allergeniContainer);
                        }

                        categoryDiv.appendChild(productDiv);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading the files:', error);
        });

    // Event delegation for collapsible buttons
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("collapsible")) {
            const collapsibleButton = event.target;
            collapsibleButton.classList.toggle("active");

            const content = collapsibleButton.nextElementSibling;
            content.classList.toggle("open");

            if (content.style.maxHeight) {
                // Collapse the content
                content.style.maxHeight = null;
            } else {
                // Expand the content
                content.style.maxHeight = content.scrollHeight + 50 + "px"; // Use scrollHeight for dynamic height
            }
        }
    });
    // Get references to the modal and buttons
    const openMapModalButton = document.getElementById('open-map-modal');
    const inactiveModal = document.getElementById('inactive-modal');
    const closeInactiveModalButton = document.getElementById('close-inactive-modal');

    // Function to check if the <a> tag has an href attribute
    function checkHref() {
        const href = openMapModalButton.getAttribute('href');
        if (!href || href === '#') {
            inactiveModal.style.display = 'block'; // Show the "Food Truck non attivo!" modal
            return false; // Prevent further action
        }
        return true; // Allow further action
    }

    // Open the modal or navigate to the link when the button is clicked
    openMapModalButton.addEventListener('click', (e) => {
        // Check if the <a> tag has an href attribute
        if (!checkHref()) {
            e.preventDefault(); // Prevent default link behavior only if href is not set
        }
        // If href is set, the link will open normally
    });

    // Close the "Food Truck non attivo!" modal when the close button is clicked
    closeInactiveModalButton.addEventListener('click', () => {
        inactiveModal.style.display = 'none'; // Hide the modal
    });

    // Close the "Food Truck non attivo!" modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === inactiveModal) {
            inactiveModal.style.display = 'none'; // Hide the modal
        }
    });

    const showClockButton = document.getElementById("showClockButton");
    const modalClock = document.getElementById("clockModal");
    const closeClockBtn = document.getElementById("closeClockBtn");

    showClockButton.onclick = function () {
        modalClock.style.display = "block";
    };

    closeClockBtn.onclick = function () {
        modalClock.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modalClock) {
            modalClock.style.display = "none";
        }
    };

    // Membership Form Modal
    const showMembershipButton = document.getElementById("showFormButton");
    const membershipModal = document.getElementById("membershipModal");
    const closeMembershipBtn = document.getElementById("closeMembershipBtn");

    showMembershipButton.onclick = function () {
        membershipModal.style.display = "flex";
    };

    closeMembershipBtn.onclick = function () {
        membershipModal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == membershipModal) {
            membershipModal.style.display = "none";
        }
    };

    const barcodeData = getCookie("barcodeData");
    if (barcodeData) {
        // Display the barcode directly
        JsBarcode("#barcode", barcodeData, {
            format: "ean13",
            lineColor: "#000",
            width: 2,
            height: 100,
            displayValue: true,
        });
        document.getElementById("result").style.display = "block";
        document.getElementById("downloadBarcodeButton").style.display = "block";
        document.getElementById("data-form").style.display = "none";
    }

    // Form Submission
    const form = document.getElementById("data-form");
    const submitButton = document.getElementById("submit-button");
    const resultSection = document.getElementById("result");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validate reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            alert("Completa il reCAPTCHA.");
            return;
        }

        submitButton.disabled = true;

        const formData = new FormData(form);
        formData.set("email", formData.get("email").toLowerCase());

        const dob = new Date(formData.get("dob"));
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 16 || (age === 16 && today < new Date(dob.setFullYear(dob.getFullYear() + 16))) || age > 100) {
            alert("Devi avere almeno 16 anni per iscriverti.");
            submitButton.disabled = false;
            return;
        }

        const phone = formData.get("phone");
        const fullPhone = `+39${phone}`;

        const data = Object.fromEntries(formData.entries());
        data.phone = fullPhone;

        try {
            const response = await fetch("https://api.cicciosburger.it/api/generate-barcode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert("Errore: " + errorText);
                submitButton.disabled = false;
                return;
            }

            const barcodeCode = await response.text();

            // Save barcode data in a cookie
            setCookie("barcodeData", barcodeCode, 30);

            JsBarcode("#barcode", barcodeCode, {
                format: "ean13",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
            });

            form.style.display = "none";
            resultSection.style.display = "block";
            document.getElementById("downloadBarcodeButton").style.display = "block";

        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            submitButton.disabled = false;
        }
    });

    // Download Barcode
    document.getElementById("downloadBarcodeButton").addEventListener("click", function () {
        const barcodeElement = document.getElementById("barcode");
        console.log("Barcode Element:", barcodeElement);
        const svg=barcodeElement
        // const svg = barcodeElement.getElementsByTagName("svg");
        // console.log("SVG Element:", svg);
    
        if (!svg) {
            alert("Il codice a barre non è stato generato correttamente.");
            return;
        }
    
        // Add a small delay to ensure the SVG is fully rendered
        setTimeout(() => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
    
            // Convert SVG to canvas
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
    
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
    
                // Create a download link
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "barcode.png";
                link.click();
            };
        }, 100); // 100ms delay
    });
    

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

document.addEventListener("DOMContentLoaded", function () {
    const cookieConsentBanner = document.getElementById("cookieConsent");
    const acceptCookiesBtn = document.getElementById("acceptCookiesBtn");
    const rejectCookiesBtn = document.getElementById("rejectCookiesBtn");
    const membershipModal = document.getElementById("membershipModal");
    const cookieWarning = document.getElementById("cookieWarning");
    const dataForm = document.getElementById("data-form");
    const recaptchaContainer = document.getElementById("recaptcha-container");

    // Flag per tracciare se il reCAPTCHA è già stato caricato
    let recaptchaLoaded = false;

    // Controlla se l'utente ha già accettato i cookie
    function checkCookieConsent() {
        if (!localStorage.getItem("cookieConsent")) {
            cookieConsentBanner.style.display = "block"; // Mostra il banner
        } else {
            enableForm(); // Abilita il modulo
            loadRecaptcha(); // Carica il reCAPTCHA
        }
    }

    // Abilita il modulo di registrazione
    function enableForm() {
        dataForm.style.display = "flex";
        cookieWarning.style.display = "none";
    }

    // Disabilita il modulo di registrazione
    function disableForm() {
        dataForm.style.display = "none";
        cookieWarning.style.display = "block";
    }

    // Carica il reCAPTCHA solo dopo il consenso
    function loadRecaptcha() {
        if (!recaptchaLoaded) {
            const script = document.createElement("script");
            script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            // Imposta il flag per evitare di caricare il reCAPTCHA più volte
            recaptchaLoaded = true;
        }
    }

    // Callback per quando il reCAPTCHA è caricato
    window.onRecaptchaLoad = function () {
        console.log("reCAPTCHA caricato con successo.");
        const recaptchaContainer = document.getElementById("recaptcha-container");
        if (recaptchaContainer) {
            grecaptcha.render(recaptchaContainer, {
                sitekey: "6LeNBt0qAAAAAOkMEYknDVLtPCkhhSo7Fc4gh-r_", // Sostituisci con la tua chiave reCAPTCHA
            });
        } else {
            console.error("Elemento reCAPTCHA non trovato.");
        }
    };

    // Gestisci il clic su "Accetta"
    acceptCookiesBtn.addEventListener("click", function () {
        setCookie("cookieConsent", "accepted", 180);
        cookieConsentBanner.style.display = "none";
        enableForm();
        loadRecaptcha(); // Carica il reCAPTCHA dopo l'accettazione
    });

    // Gestisci il clic su "Rifiuta"
    rejectCookiesBtn.addEventListener("click", function () {
        localStorage.removeItem("cookieConsent");
        cookieConsentBanner.style.display = "none";
        disableForm();
    });

    // Controlla lo stato dei cookie quando il modulo viene aperto
    document.getElementById("showFormButton").addEventListener("click", function () {
        if (!localStorage.getItem("cookieConsent")) {
            disableForm();
        } else {
            enableForm();
        }
    });

    // Esegui il controllo all'avvio
    checkCookieConsent();
});