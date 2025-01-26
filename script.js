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
                    console.log(product.price.price);
                    if (product.price[0].price==0){
                        let titleExtracted,lowestPrice;
                        lowestPrice=product.variants[0].items[0].price_variation;
                        titleExtracted = product.title
                        if (product.title.includes("(")) {
                            let inputString = product.title;
                            const openParenIndex = inputString.indexOf("(");

                            if (openParenIndex !== -1) {
                                titleExtracted = inputString.slice(0, openParenIndex).trim();
                            } else {
                                titleExtracted = inputString.trim();
                                lowestPrice= "";
                            }

                            
                        }//menu
                        for(item in product.variants[0].items){
                            if(item.price_variation<lowestPrice){
                                lowestPrice=item.price_variation;
                            }
                        }
                        title.prepend(document.createTextNode(titleExtracted)); // Add text before the icon
                        price.textContent = `da ${parseFloat(lowestPrice).toFixed(2).toString().replace(".",",")}€`;
                        
                    } 
                    else {
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
});