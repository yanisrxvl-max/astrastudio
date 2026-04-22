import glob

# Files to update
files = glob.glob('*.html') + glob.glob('**/*.html') + glob.glob('data/*.json')

for filepath in set(files):
    if "node_modules" in filepath:
        continue
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Prices
        content = content.replace("690 €", "490 €")
        content = content.replace("1 800 €", "1 500 €")
        content = content.replace("1800 €", "1500 €")
        
        # Locations
        content = content.replace("Paris · À distance · Sur site", "Vichy · À distance")
        content = content.replace("Paris · À distance", "Vichy · À distance")
        content = content.replace("Paris &amp; à distance", "Vichy &amp; à distance")
        content = content.replace("Studio fondé en 2026 — Paris", "Studio fondé en 2026 — Vichy")
        content = content.replace("Astra Studio Paris", "Astra Studio")
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

