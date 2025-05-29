let recaptchaWidgetId;
let recaptchaOrderWidgetId;

document.addEventListener("DOMContentLoaded", function () {
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
            fetch('clean_products.json').then(response => response.json())
        ])
        .then(([categoryData, productData]) => {
            const allergeniIngredientiMap = {
                "bun": "Glutine",
                "nutella": "Frutta a guscio, Soia, Latte",
                "tiramisù": "Glutine, Latte, Uova",
                "brookies": "Glutine, Latte, Uova",
                "bocconcini di pollo tritato pastellati fatti a mano": "Glutine, Latte",
                "polpettine di pollo fatte a mano con speciale panatura super croccante": "Glutine, Latte",
                "polpettine di carne fatte a mano con speciale panatura al formaggio": "Glutine, Uova, Latte",
                "provola dolce con tripla pastellatura a mano": "Glutine, Latte",
                "nuggets vegetali": "Uova, Soia, Latte, Sedano, Senape, Glutine",
                "Alette di pollo pastellate e fritte laccate con salsa thai": "Uova, Senape",
                "Maxi nuggets di pollo con panatura super croccante accompagnato con cheddar calda": "Glutine, Latte",
                "polpettine vegetali": "Uova, Soia, Latte, Anidride solforosa e solfiti, Glutine",
                "burger di manzo 170g": "Latte(Senza lattosio), Glutine, Uova",
                "doppio burger di manzo 170g": "Latte(Senza lattosio), Glutine, Uova",
                "burger di pollo pastellato e fritto": "Latte(Senza lattosio), Glutine",
                "burger di pollo fritto con panatura super croccante": "Latte(Senza lattosio), Glutine",
                "sovracoscia di pollo alla piastra": null,
                "burger vegetale": "Latte, Uova",
                "cheddar": "Latte",
                "doppio cheddar": "Latte",
                "triplo cheddar": "Latte",
                "brie": "Latte",
                "tuma caramellata al miele": "Latte",
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
                "patate con buccia": null,
                "crema cheddar home made": "Glutine, Latte",
                "salsa Ciccio's": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa white Ciccio's": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "maionese al tartufo": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "maionese senapata al miele": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "maionese": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa bbq": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa hot thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa ciccio's 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
            };

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
                    const product = productData.products.find(p => p.id === item.product_id);

                    if (product) {
                        product.allergeniIngredientiMap = {};
                        const ingredienti = product.ingredients?.split(",").map(i => i.trim()) || [];

                        ingredienti.forEach(ingrediente => {
                            const nomeIngrediente = ingrediente.split(":")[0].trim();
                            if (allergeniIngredientiMap.hasOwnProperty(nomeIngrediente)) {
                                product.allergeniIngredientiMap[nomeIngrediente] = allergeniIngredientiMap[nomeIngrediente];
                            }
                        });
                        const productDiv = document.createElement("div");
                        productDiv.classList.add("menu-item");

                        const productInfoDiv = document.createElement("div");
                        productInfoDiv.classList.add("menu-item-info");

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

                        title.prepend(document.createTextNode(product.title)); // Add text before the icon
                        if (typeof product.price === "number") {
                            price.textContent = `${product.price.toFixed(2).toString().replace(".", ",")}€`;
                        } else {
                            price.textContent = product.price;
                        }
                        const image = document.createElement("img");
                        image.classList.add("product-img");
                        image.src = product.thumb;
                        image.loading = "lazy";

                        const ingredients = product.ingredients?.split(",").map(i => i.trim()) || [];

                        const inlineText = document.createElement("p");
                        inlineText.classList.add("product-description");
                        inlineText.textContent = ingredients.join(", ");

                        const detailedContainer = document.createElement("div");
                        detailedContainer.classList.add("ingredient-detail");
                        // Rendi visibile il dettaglio solo se lo switch è attivo
                        if (document.getElementById("toggleIngredients").checked) {
                            detailedContainer.classList.add("show");
                        }

                        ingredients.forEach(name => {
                            const row = document.createElement("div");
                            row.className = "ingredient-row";

                            const nameSpan = document.createElement("span");
                            nameSpan.textContent = name;

                            const allergenSpan = document.createElement("span");
                            allergenSpan.className = "allergens";

                            const found = Object.entries(product.allergeniIngredientiMap || {}).find(([key]) =>
                                key.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(key.toLowerCase())
                            );

                            allergenSpan.textContent = found ? found[1] : "Nessun allergene noto";

                            row.appendChild(nameSpan);
                            row.appendChild(allergenSpan);
                            detailedContainer.appendChild(row);
                        });

                        productInfoDiv.appendChild(inlineText);
                        productInfoDiv.appendChild(detailedContainer);


                        productDiv.appendChild(image);
                        productInfoDiv.appendChild(title);
                        productInfoDiv.appendChild(price);
                        // NEW IF
                        if (product.allergens && typeof product.allergens === "object") {
                            const allergeniContainer = document.createElement("div");
                            allergeniContainer.classList.add("allergeni-container");

                            // const allergeniText = document.createElement("p");
                            // allergeniText.classList.add("allergeni-text");
                            // allergeniText.textContent = "Allergeni";
                            // allergeniContainer.appendChild(allergeniText);

                            // Iterate over allergen categories (e.g., Bread, Beef)
                            for (const [category, allergeniStr] of Object.entries(product.allergens)) {
                                const allergeniBoxContainer = document.createElement("div")
                                const categoryTitle = document.createElement("p");
                                categoryTitle.classList.add("allergeni-text");
                                categoryTitle.textContent = category;
                                allergeniBoxContainer.appendChild(categoryTitle);

                                const allergeniArray = allergeniStr.split(", ");

                                const allergeniInnerContainer = document.createElement("div");
                                allergeniInnerContainer.classList.add("allergeni-inner-container");

                                allergeniArray.forEach(allergene => {
                                    const allergeneData = allergeniMap[allergene];
                                    if (allergeneData) {
                                        const icona = document.createElement("div");
                                        icona.className = `icona ${allergeneData.className}`;
                                        icona.textContent = allergeneData.emoji;
                                        allergeniInnerContainer.appendChild(icona);
                                    }
                                });

                                allergeniBoxContainer.appendChild(allergeniInnerContainer);
                                allergeniContainer.appendChild(allergeniBoxContainer)
                            }

                            productInfoDiv.appendChild(allergeniContainer);
                        }

                        productDiv.appendChild(productInfoDiv);

                        categoryDiv.appendChild(productDiv);
                    }
                });
            });
            document.getElementById("toggleIngredients").addEventListener("change", e => {
                const show = e.target.checked;
                document.querySelectorAll(".product-description").forEach(p => {
                    p.style.display = show ? "none" : "block";
                });
                document.querySelectorAll(".ingredient-detail").forEach(div => {
                    div.classList.toggle("show", show);
                });

                // 🔄 Recalculate maxHeight for all open collapsibles
                document.querySelectorAll(".collapsible.active").forEach(button => {
                    const content = button.nextElementSibling;
                    if (content.classList.contains("open")) {
                        // Temporarily unset maxHeight to allow correct scrollHeight
                        content.style.maxHeight = null;
                        content.style.maxHeight = content.scrollHeight + 50 + "px";
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

    const barcodeData = getCookie("barcodeData");

    function loadJsBarcodeScript(callback) {
        // Create script element
        console.log("Barcode script loaded")
        var script = document.createElement('script');
        script.src = './JsBarcode.ean-upc.min.js';
        script.onload = callback; // Execute callback once the script is loaded
        document.head.appendChild(script);
    }
    if (barcodeData) {
        // Display the barcode directly
        loadJsBarcodeScript(function () {
            JsBarcode("#barcode", barcodeData, {
                format: "ean13",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
            });
        });
        document.getElementById("result").style.display = "block";
        document.getElementById("downloadBarcodeButton").style.display = "block";
        document.getElementById("data-form").style.display = "none";
    }

    // Form Submission
    const submitButton = document.getElementById("submit-button");
    const resultSection = document.getElementById("result");
    const form = document.getElementById("data-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validate reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
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
        console.log(JSON.stringify(data))
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
            loadJsBarcodeScript(function () {
                JsBarcode("#barcode", barcodeCode, {
                    format: "ean13",
                    lineColor: "#000",
                    width: 2,
                    height: 100,
                    displayValue: true,
                });
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
        const svg = barcodeElement

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


// ORDER FORM
document.addEventListener("DOMContentLoaded", function () {
    const addToCartBtn = document.getElementById("addToCart");
    const sendOrderBtn = document.getElementById("sendOrder");
    const cartList = document.getElementById("cart");

    let cart = [];
    let typeData = {}; // Store JSON data for types and sizes


    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            typeData = data;

            const typeSelect = document.getElementById("order-type");
            typeSelect.innerHTML = "";

            Object.keys(typeData).forEach(type => {
                let option = document.createElement("option");
                option.value = type;
                // Show price with two decimals in the dropdown
                const price = typeData[type].price.toFixed(2); // Ensure 2 decimal places
                option.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${price}€`;
                typeSelect.appendChild(option);
            });

            updateSizeOptions();
        });

    function updateSizeOptions() {
        const typeSelect = document.getElementById("order-type");
        const sizeSelect = document.getElementById("order-size");
        sizeSelect.innerHTML = "";

        const selectedType = typeSelect.value;
        if (typeData[selectedType]) {
            typeData[selectedType].sizes.forEach(size => {
                let option = document.createElement("option");
                option.value = size.toLowerCase();
                option.textContent = size;
                sizeSelect.appendChild(option);
            });
        }
    }

    document.getElementById("order-type").addEventListener("change", updateSizeOptions);

    addToCartBtn.addEventListener("click", () => {
        const quantity = parseInt(document.getElementById("order-quantity").value);
        const type = document.getElementById("order-type").value;
        const size = document.getElementById("order-size").value;

        let found = false;

        cart = cart.map(item => {
            if (item.type === type && item.size === size) {
                found = true;
                return {
                    ...item,
                    quantity: Math.min(item.quantity + quantity, 5)
                };
            }
            return item;
        });

        if (!found) {
            const price = typeData[type].price;
            cart.push({
                quantity,
                type,
                size,
                price
            });
        }

        updateCart();
    });

    function updateCart() {
        cartList.innerHTML = "";
        cart.forEach((item, index) => {
            let itemDiv = document.createElement("div");
            itemDiv.classList.add("itemDiv");

            let itemQuantity = document.createElement("p");
            itemQuantity.classList.add("itemQuantity");
            itemQuantity.textContent = `${item.quantity}`;

            let itemInternalDiv = document.createElement("div");
            itemInternalDiv.classList.add("itemInternalDiv");

            let itemTitle = document.createElement("p");
            itemTitle.classList.add("itemTitle");
            itemTitle.textContent = item.type;

            let itemSize = document.createElement("p");
            itemSize.classList.add("itemSize");
            itemSize.textContent = `Taglia: ${item.size}`;

            let itemPrice = document.createElement("p");
            itemPrice.classList.add("itemPrice");
            const totalPrice = (item.quantity * item.price).toFixed(2); // Format total price to 2 decimals
            itemPrice.textContent = `Prezzo: ${totalPrice}€`;

            let removeBtn = document.createElement("button");
            removeBtn.textContent = "Rimuovi";
            removeBtn.classList.add("remove");
            removeBtn.addEventListener("click", () => {
                cart.splice(index, 1);
                updateCart();
            });

            itemInternalDiv.appendChild(itemTitle);
            itemInternalDiv.appendChild(itemSize);
            itemInternalDiv.appendChild(itemPrice);

            itemDiv.appendChild(itemQuantity);
            itemDiv.appendChild(itemInternalDiv);
            itemDiv.appendChild(removeBtn);
            cartList.appendChild(itemDiv);
        });
    }

    sendOrderBtn.addEventListener("click", async () => {
        if (cart.length === 0) {
            alert("Il carrello è vuoto!");
            return;
        }

        const recaptchaResponse = grecaptcha.getResponse(recaptchaOrderWidgetId);
        if (!recaptchaResponse) {
            alert("Completa il reCAPTCHA.");
            return;
        }

        const name = document.getElementById("order-name").value;
        const surname = document.getElementById("order-surname").value;
        const email = document.getElementById("order-email").value;
        const partialPhone = document.getElementById("order-phone").value;
        const phone = `+39${partialPhone}`;
        const shop = document.getElementById("order-shop").value;

        if (!name || !surname || !email || !partialPhone) {
            alert("Compila tutti i campi obbligatori.");
            return;
        }

        // Disable the button to prevent multiple clicks
        sendOrderBtn.disabled = true;
        sendOrderBtn.textContent = "Invio in corso..."; // Update button text to indicate processing

        // Add CAPTCHA response to the order data
        const orderData = {
            name,
            surname,
            email,
            phone,
            shop,
            cart,
            recaptchaResponse,
        };

        try {
            const response = await fetch("https://api.cicciosburger.it/api/generate-order-number", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error("Errore nell'invio dell'ordine.");
            }

            const orderNumber = await response.text(); // Get the raw text response

            // Hide the form and cart
            document.getElementById("orderContainer").style.display = "none";

            // Show the confirmation message
            const confirmationMessage = document.getElementById("confirmationMessage");
            const orderNumberDisplay = document.getElementById("orderNumberDisplay");
            orderNumberDisplay.textContent = orderNumber; // Set the order number
            confirmationMessage.style.display = "block"; // Make the confirmation message visible

            // Add event listener for the "Make a New Order" button
            const newOrderButton = document.getElementById("newOrderButton");
            newOrderButton.addEventListener("click", () => {
                // Reset the modal to its original state
                resetOrderModal();
            });
        } catch (error) {
            console.error("Errore nell'invio dell'ordine:", error);
            alert("Si è verificato un errore durante l'invio dell'ordine. Riprova più tardi.");
        } finally {
            // Re-enable the button and reset its text
            sendOrderBtn.disabled = false;
            sendOrderBtn.textContent = "Invia Ordine";
        }
    });

    // Function to reset the modal to its original state
    function resetOrderModal() {
        // Show the form and cart
        document.getElementById("orderContainer").style.display = "block";

        // Hide the confirmation message
        document.getElementById("confirmationMessage").style.display = "none";

        // Clear the cart
        cart = [];
        updateCart();
    }
});


document.addEventListener('DOMContentLoaded', () => {

    const cookieConsentBanner = document.getElementById("cookieConsent");
    const acceptCookiesBtn = document.getElementById("acceptCookiesBtn");
    const rejectCookiesBtn = document.getElementById("rejectCookiesBtn");
    const cookieWarning = document.getElementById("cookieMsg");
    const cookieOrderWarning = document.getElementById("cookieOrderMsg");
    const dataForm = document.getElementById("data-form");
    const orderForm = document.getElementById("orderForm");

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
    function enableForm() {
        dataForm.style.display = "flex";
        orderForm.style.display = "flex";
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
        console.log("reCAPTCHA loaded successfully.");
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
            console.log(modalId)
            console.log(modal)
            if (modalId == "membershipModal") {
                if (!localStorage.getItem("cookieConsent")) {
                    disableForm();
                } else {
                    enableForm();
                }
            }
            if (modalId == "inactive-modal") {
                // Check if the <a> tag has an href attribute
                if (!button.getAttribute('href')) {
                    event.preventDefault()
                    modal.style.display = 'block';
                }
            } else {
                if (modal) modal.style.display = 'block';
            }
        });
    });

    // Close modal
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    // Optional: Close modal when clicking outside the modal content
    modals.forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});