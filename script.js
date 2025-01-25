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

    // Load categories and products
    Promise.all([
        fetch('categories.json').then(response => response.json()),
        fetch('products.json').then(response => response.json())
    ])
    .then(([categoryData, productData]) => {
        const outerContainer = document.getElementById("outer-modal");

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

                    if (product.title.includes("(")) {
                        let inputString = product.title;
                        const openParenIndex = inputString.indexOf("(");
                        const closeParenIndex = inputString.indexOf(")");
                        let titleExtracted, priceExtracted;

                        if (openParenIndex !== -1 && closeParenIndex !== -1) {
                            titleExtracted = inputString.slice(0, openParenIndex).trim();
                            priceExtracted = inputString.slice(openParenIndex + 1, closeParenIndex).trim();
                        } else {
                            titleExtracted = inputString.trim();
                            priceExtracted = "Nessun prezzo disponibile!";
                        }

                        title.prepend(document.createTextNode(titleExtracted)); // Add text before the icon
                        price.textContent = priceExtracted;
                    } else {
                        title.prepend(document.createTextNode(product.title)); // Add text before the icon
                        if (product.price[0].price == 0) {
                            price.textContent = ``;
                        } else {
                            price.textContent = `${product.price[0].price.toString().replace(".", ",")}€`;
                        }
                    }

                    const image = document.createElement("img");
                    image.classList.add("product-img");
                    image.src = product.thumb.thumb;

                    const description = document.createElement("p");
                    description.classList.add("product-description");
                    description.textContent = product.short_description;

                    productDiv.appendChild(image);
                    productDiv.appendChild(title);
                    productDiv.appendChild(description);
                    productDiv.appendChild(price);

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
});