import json

def converti_catalogo(file_input, file_output):
    # 1. Legge i dati dal file JSON originale
    try:
        with open(file_input, 'r', encoding='utf-8') as f:
            dati_originali = json.load(f)
    except FileNotFoundError:
        print(f"Errore: Il file '{file_input}' non è stato trovato.")
        return
    except json.JSONDecodeError:
        print(f"Errore: Il file '{file_input}' non contiene un JSON valido.")
        return

    # 2. Crea la nuova struttura richiesta
    nuova_struttura = {
        "valid_shops": [
            "stadio",
            "lumia",
            "sperlinga"
        ],
        "available_sizes": dati_originali
    }

    # 3. Scrive la nuova struttura nel file di output
    with open(file_output, 'w', encoding='utf-8') as f:
        # indent=4 formatta il JSON rendendolo leggibile
        # ensure_ascii=False mantiene intatti eventuali caratteri speciali
        json.dump(nuova_struttura, f, indent=4, ensure_ascii=False)
        
    print(f"✅ Conversione completata con successo!")
    print(f"I dati trasformati sono stati salvati in: '{file_output}'")

# --- Esecuzione dello script ---
if __name__ == "__main__":
    # Nomi dei file di input e output
    FILE_SORGENTE = "data.json"
    FILE_DESTINAZIONE = "data-server.json"
    
    converti_catalogo(FILE_SORGENTE, FILE_DESTINAZIONE)