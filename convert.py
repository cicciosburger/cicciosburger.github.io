import json

# Load the original JSON data
with open('products.json', 'r', encoding="utf8") as file:
    data = json.load(file)

# Extract and transform the products
transformed_products = []
for product in data['payload']['products']:
    transformed_product = {
        "id": product["id"],
        "title": product["title"],
        "price": product["price"][0]["price"],  # Extract only the price.price
        "ingredients": product["ingredients"],
        "allergens": product["allergens"],
        "thumb": product["thumb"]["thumb"]
    }
    transformed_products.append(transformed_product)

# Create the new JSON structure
new_data = {
    "products": transformed_products
}

# Save the transformed data to a new file
with open('clean_products.json', 'w', encoding="utf8") as file:
    json.dump(new_data, file, indent=4)

print("Transformation complete. Check 'clean_products.json'.")