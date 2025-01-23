document.addEventListener("DOMContentLoaded", function() {
    const showMenuButton = document.getElementById("showMenuButton");
    const modal = document.getElementById("menuModal");
    const closeMenuBtn = document.getElementById("closeMenuBtn");

    showMenuButton.onclick = function() {
        modal.style.display = "block";
    }

    closeMenuBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }


    Promise.all([
            fetch('categories.json').then(response => response.json()),
            fetch('products.json').then(response => response.json())
        ])
        .then(([categoryData, productData]) => {
            const outerContainer = document.getElementById("outer-modal");

            categoryData.payload.categories.forEach(category => {

                const categoryTitle = document.createElement("h2");
                categoryTitle.classList.add("category-title");
                categoryTitle.textContent = category.title;

                outerContainer.appendChild(categoryTitle);


                const categoryDiv = document.createElement("div");
                categoryDiv.classList.add("menu-grid");
                outerContainer.appendChild(categoryDiv);

                category.items_assoc.forEach(item => {
                    const product = productData.payload.products.find(p => p.id === item.product_id);

                    if (product) {
                        const productDiv = document.createElement("div");
                        productDiv.classList.add("menu-item");

                        const title = document.createElement("h1");
                        title.classList.add("product-title");
                        title.textContent = product.title;

                        const price = document.createElement("p");
                        price.classList.add("product-price");
                        price.textContent = `${product.price[0].price}€`;

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
});