import json, os, sys

def validate():
    error = False

    print("1. Controllo Sintassi JSON...")
    files_to_check = ['menu.json', 'allergeni.json', 'data.json']
    for file in files_to_check:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                json.load(f)
            print(f"  [OK] {file} sintassi valida.")
        except json.JSONDecodeError as e:
            print(f"  [ERROR] {file} ha un errore di sintassi alla riga {e.lineno}, colonna {e.colno}: {e.msg}")
            error = True
        except FileNotFoundError:
            print(f"  [ERROR] File mancante: {file}")
            error = True

    if error:
        return False

    with open('menu.json', 'r', encoding='utf-8') as f:
        menu = json.load(f)
    with open('allergeni.json', 'r', encoding='utf-8') as f:
        allergeni = json.load(f)
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("\n2. Controllo Immagini Mancanti...")
    for category, items in menu.items():
        for item in items:
            if 'thumb' in item and item['thumb']:
                path = item['thumb'].lstrip('./')
                if not os.path.exists(path):
                    print(f"  [ERROR] Immagine mancante in menu.json: {path} (Prodotto: {item.get('title', 'Sconosciuto')})")
                    error = True

    for name, item in data.items():
        if 'image' in item and item['image']:
            path = item['image'].lstrip('./')
            if not os.path.exists(path):
                print(f"  [ERROR] Immagine mancante in data.json: {path} (Prodotto: {name})")
                error = True

    print("\n3. Controllo Schema menu.json...")
    for category, items in menu.items():
        for i, item in enumerate(items):
            title = item.get('title', f'Prodotto #{i} in {category}')
            if 'title' not in item or not str(item['title']).strip():
                print(f"  [ERROR] Manca il 'title' nel prodotto #{i} in {category}")
                error = True
            if 'price' not in item or str(item['price']).strip() == '':
                print(f"  [ERROR] Manca il 'price' in: {title}")
                error = True
            if 'available_in' not in item or not isinstance(item['available_in'], list):
                print(f"  [ERROR] Manca array 'available_in' in: {title}")
                error = True

    print("\n4. Controllo Allergeni...")
    for category, items in menu.items():
        for item in items:
            if 'ingredients' in item and item['ingredients']:
                # Ignoriamo i menù combo
                if '+' in item['ingredients']:
                    continue
                    
                ingredients = [i.strip() for i in str(item['ingredients']).split(',')]
                for ing in ingredients:
                    name = ing.split(':')[0].strip()
                    if name not in allergeni:
                        print(f"  [ERROR] Manca allergene per: '{name}' (nel prodotto '{item.get('title')}')")
                        error = True

    if error:
        print("\n[FALLITO] ALCUNI TEST SONO FALLITI. Controlla gli errori sopra.")
        return False
    else:
        print("\n[SUCCESSO] TUTTI I TEST PASSATI! Pronto per il push.")
        return True

if __name__ == '__main__':
    if not validate():
        sys.exit(1)
