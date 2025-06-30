import json
from collections import defaultdict

def convert_to_menu_json(categories_path, products_path, output_path):
    # Load the input JSON files
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories_data = json.load(f)
    
    with open(products_path, 'r', encoding='utf-8') as f:
        products_data = json.load(f)

    # Create a dictionary to map product IDs to product details
    product_map = {product['id']: product for product in products_data['products']}

    # Initialize the new menu structure
    menu = defaultdict(list)

    # Process each category
    for category in categories_data['payload']['categories']:
        category_name = category['title']
        
        # Process each product in the category
        for item in category['items_assoc']:
            product_id = item['product_id']
            product = product_map.get(product_id)
            
            if product:
                # Create the new product structure with available_in
                new_product = {
                    'title': product['title'],
                    'price': product['price'],
                    'ingredients': product.get('ingredients', ''),
                    'allergens': product.get('allergens', {}),
                    'thumb': product.get('thumb', ''),
                    'available_in': ['LOCALE', 'FOODTRUCK']  # Default to both
                }
                
                # Add to the category in our new menu
                menu[category_name].append(new_product)

    # Convert defaultdict to regular dict for JSON serialization
    menu = dict(menu)

    # Save the new menu.json file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(menu, f, ensure_ascii=False, indent=2)

    print(f"Successfully converted to {output_path}")

# Example usage
if __name__ == "__main__":
    convert_to_menu_json(
        categories_path='categories.json',
        products_path='clean_products.json',
        output_path='menu.json'
    )