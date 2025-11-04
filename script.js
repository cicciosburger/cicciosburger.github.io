let recaptchaWidgetId;
let recaptchaOrderWidgetId;
let recaptchaHappyOrderWidgetId;


document.addEventListener("DOMContentLoaded", async () => {
  // Default coordinates
  let lat = 38.2064711;
  let lng = 13.3252011;

  // Try to fetch coords.json from remote API
  try {
    const res = await fetch('https://api.cicciosburger.it/menu/static/coords.json');
    if (!res.ok) throw new Error("Non disponibile");
    const data = await res.json();
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      lat = data.lat;
      lng = data.lng;
    } else {
      throw new Error("Parsing fallito");
    }
  } catch (err) {
    console.warn("Coordinate non disponibili, uso default:", err);
  }

  // Initialize the map
  const map = L.map('map').setView([lat, lng], 18);

  // Tiles
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> | © OpenStreetMap',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

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
  const marker = L.marker([lat, lng], { icon: customDivIcon }).addTo(map);
  marker.on('click', () => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  });

  // Fix map sizing
  window.addEventListener('load', () => {
    map.invalidateSize();
  });
});


document.addEventListener('DOMContentLoaded', function() {

    
    // Allergeni map (keep your existing one)
    const allergeniIngredientiMap = {
                "bun": "Glutine, Uova",
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
                "burger di pollo pastellato e fritto": "Latte(Senza lattosio), Glutine",
                "burger di pollo fritto con panatura super croccante": "Latte(Senza lattosio), Glutine",
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
                "maionese al basilico": "Senape, può contenere tracce di Arachidi e derivati e Pesce",
                "maionese": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa bbq": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa hot thai 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "salsa ciccio's 60ml": "Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce",
                "robiolina con pomodoro semi-dry": "Latte, Solfiti, può contenere tracce di Frutta a guscio e Pesce",
                "tzatziki": "Latte",
                "grana": "Latte",
                "roast beef": null,
                "pecorino al peperoncino":"Latte",
                "cipolla caramellata alla birra":"Glutine", 
                "nduja":null, 
                "giri saltati":null, 
                "olio al limone":null, 
                "scaglie di parmigiano reggiano":"Latte(Senza lattosio)", 
                "primo sale di pecora fresco":"Latte", 
                "salsa al guanciale":"Senape, Uova, può contenere tracce di Arachidi e derivati e Pesce", 
                "gocce di peperoncino":null
            };

    // Allergeni icons map (keep your existing one)
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

    // Global menu data
    let menuData = null;

    fetch('https://api.cicciosburger.it/menu/static/menu.json')
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
        if(modalId == 'menuModal'){
            contentId='generatedContentLocale'
        }
        else if(modalId == 'foodtruck'){
            contentId='generatedContentFoodtruck'
        }
        else if(modalId == 'menuSpeciale'){
            contentId='generatedContentMenuSpeciale'
        }
        else{
            contentId='generatedContentGhiotto'
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

        // Allergens display
        if (product.allergens && typeof product.allergens === 'object') {
            const allergeniContainer = document.createElement('div');
            allergeniContainer.classList.add('allergeni-container');

            for (const [category, allergeniStr] of Object.entries(product.allergens)) {
                const allergeniBoxContainer = document.createElement('div');
                const categoryTitle = document.createElement('p');
                categoryTitle.classList.add('allergeni-text');
                categoryTitle.textContent = category;
                allergeniBoxContainer.appendChild(categoryTitle);

                const allergeniArray = allergeniStr.split(", ");
                const allergeniInnerContainer = document.createElement('div');
                allergeniInnerContainer.classList.add('allergeni-inner-container');

                allergeniArray.forEach(allergene => {
                    const allergeneData = allergeniMap[allergene];
                    if (allergeneData) {
                        const icona = document.createElement('div');
                        icona.className = `icona ${allergeneData.className}`;
                        icona.textContent = allergeneData.emoji;
                        allergeniInnerContainer.appendChild(icona);
                    }
                });

                allergeniBoxContainer.appendChild(allergeniInnerContainer);
                allergeniContainer.appendChild(allergeniBoxContainer);
            }
            productInfoDiv.appendChild(allergeniContainer);
        }

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
        
        coll.addEventListener('click', function() {
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
        if(modalId == 'menuModal'){
            toggleId = 'toggleIngredientsLocale'
        }
        else if(modalId == 'foodtruck'){
            toggleId = 'toggleIngredientsFoodtruck'
        }
        else if(modalId == 'menuSpeciale'){
            toggleId = 'toggleIngredientsMenuSpeciale'
        }
        else{
            toggleId = 'toggleIngredientsGhiotto'
        }
        const toggle = document.getElementById(toggleId);
        
        if (!toggle) return;
        
        toggle.addEventListener('change', function() {
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

// ------------------------------------------------------------


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
        const res = await fetch("https://api.cicciosburger.it/api/generate-order-number", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const resultText = await res.text(); 
        console.log("Risposta API (text):", resultText);

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
    function enableForm() {
        dataForm.style.display = "flex";
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
        console.log("reCAPTCHA loaded successfully.");
        const recaptchaContainer = document.getElementById("recaptcha-container");
        const recaptchaContainerOrder = document.getElementById("recaptcha-container-order");
        const recaptchaHappyContainerOrder = document.getElementById("happy-recaptcha-container-order");
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
        if (recaptchaHappyContainerOrder) {
            recaptchaHappyOrderWidgetId = grecaptcha.render(recaptchaHappyContainerOrder, {
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

            console.log(modalId);
            console.log(modal);

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







// 

document.addEventListener("DOMContentLoaded", function () {
    const addToCartBtn = document.getElementById("happy-addToCart");
    const sendOrderBtn = document.getElementById("happy-sendOrder");
    const cartList = document.getElementById("happy-cart");

    let cart = [];
    let typeData = {};

    fetch("free.json")
        .then(response => response.json())
        .then(data => {
            typeData = data;

            const dropdownContainer = document.querySelector("#happy-custom-type-select .dropdown");
            const selected = document.querySelector("#happy-custom-type-select .selected");
            const hiddenInput = document.getElementById("happy-order-type");

            dropdownContainer.innerHTML = "";

            Object.keys(typeData).forEach(type => {
                const item = document.createElement("div");
                item.classList.add("dropdown-item");

                const img = document.createElement("img");
                img.src = typeData[type].image;
                img.alt = type;
                img.classList.add("dropdown-img");

                const label = document.createElement("span");
                label.textContent = type;

                item.appendChild(img);
                item.appendChild(label);

                item.addEventListener("click", () => {
                    selected.innerHTML = "";
                    selected.appendChild(img.cloneNode());
                    selected.appendChild(document.createTextNode(` ${type}`));
                    hiddenInput.value = type;

                    dropdownContainer.classList.remove("show");
                    updateSizeOptions();
                });

                dropdownContainer.appendChild(item);
            });

            selected.addEventListener("click", () => {
                dropdownContainer.classList.toggle("show");
            });
        });

    function updateSizeOptions() {
        const typeSelect = document.getElementById("happy-order-type");
        const sizeSelect = document.getElementById("happy-order-size");
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

    document.getElementById("happy-order-type").addEventListener("change", updateSizeOptions);

    addToCartBtn.addEventListener("click", () => {
        const type = document.getElementById("happy-order-type").value;
        const size = document.getElementById("happy-order-size").value;

        if (!type || !size) {
            alert("Seleziona un prodotto e una taglia");
            return;
        }

        cart = [];
        cart.push({
            type,
            size
        });

        updateCart();
    });

    function updateCart() {
        cartList.innerHTML = "";
        if (cart.length === 0) {
            cartList.innerHTML = "<p>Nessun prodotto selezionato</p>";
            return;
        }

        const item = cart[0];
        
        let itemImage = document.createElement("img");
        itemImage.classList.add("itemImage");
        itemImage.src = typeData[item.type].image;
        itemImage.alt = item.type;

        let itemDiv = document.createElement("div");
        itemDiv.classList.add("itemDiv");

        let itemInternalDiv = document.createElement("div");
        itemInternalDiv.classList.add("itemInternalDiv");

        let itemTitle = document.createElement("p");
        itemTitle.classList.add("itemTitle");
        itemTitle.textContent = item.type;

        let itemSize = document.createElement("p");
        itemSize.classList.add("itemSize");
        itemSize.textContent = `Taglia: ${item.size}`;

        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Rimuovi";
        removeBtn.classList.add("remove");
        removeBtn.addEventListener("click", () => {
            cart = [];
            updateCart();
        });

        itemInternalDiv.appendChild(itemTitle);
        itemInternalDiv.appendChild(itemSize);
        itemInternalDiv.appendChild(removeBtn);

        itemDiv.appendChild(itemImage);
        itemDiv.appendChild(itemInternalDiv);

        cartList.appendChild(itemDiv);
    }

    sendOrderBtn.addEventListener("click", async () => {
        if (cart.length === 0) {
            alert("Il carrello è vuoto!");
            return;
        }

        const recaptchaResponse = grecaptcha.getResponse(recaptchaHappyOrderWidgetId);
        if (!recaptchaResponse) {
            alert("Completa il reCAPTCHA.");
            return;
        }

        const name = document.getElementById("happy-order-name").value;
        const surname = document.getElementById("happy-order-surname").value;
        const email = document.getElementById("happy-order-email").value;
        const partialPhone = document.getElementById("happy-order-phone").value;
        const phone = `+39${partialPhone}`;
        const shop = "stadio";

        if (!name || !surname || !email || !partialPhone) {
            alert("Compila tutti i campi obbligatori.");
            return;
        }

        sendOrderBtn.disabled = true;
        sendOrderBtn.textContent = "Invio in corso...";

        const formattedCart = cart.map(item => ({
            quantity: 1,  // Always set to 1
            type: item.type,
            size: item.size,
            price: 0      // Always set to 0
        }));

        const orderData = {
            name,
            surname,
            email,
            phone,
            shop,
            cart: formattedCart,  // Use the formatted cart
            recaptchaResponse,
        };

        try {
            const response = await fetch("https://api.cicciosburger.it/api/generate-happy-order-number", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error("Errore nell'invio dell'ordine.");
            }

            const orderNumber = await response.text();

            document.getElementById("happyOrderContainer").style.display = "none";

            const confirmationMessage = document.getElementById("happy-confirmationMessage");
            const orderNumberDisplay = document.getElementById("happy-orderNumberDisplay");
            orderNumberDisplay.textContent = orderNumber;
            confirmationMessage.style.display = "block";

            document.getElementById("happy-newOrderButton").addEventListener("click", () => {
                resetOrderModal();
            });
        } catch (error) {
            console.error("Errore nell'invio dell'ordine:", error);
            alert("Si è verificato un errore durante l'invio dell'ordine. Riprova più tardi.");
        } finally {
            sendOrderBtn.disabled = false;
            sendOrderBtn.textContent = "Invia Ordine";
        }
    });

    function resetOrderModal() {
        document.getElementById("happyOrderContainer").style.display = "block";
        document.getElementById("happy-confirmationMessage").style.display = "none";
        cart = [];
        updateCart();
        document.getElementById("happyOrderForm").reset();
        document.querySelector("#happy-custom-type-select .selected").innerHTML = "Seleziona un prodotto";
        document.getElementById("happy-order-type").value = "";
        document.getElementById("happy-order-size").innerHTML = "";
    }
});