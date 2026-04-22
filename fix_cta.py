import glob

files = glob.glob('*.html') + glob.glob('**/*.html')

for filepath in set(files):
    if "node_modules" in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Standardize CTAs
    content = content.replace(">Planifier un échange<", ">Réserver un diagnostic de 20 min<")
    content = content.replace(">Planifier un échange stratégique<", ">Réserver un diagnostic de 20 min<")
    content = content.replace(">Planifier mon échange<", ">Réserver un diagnostic de 20 min<")
    content = content.replace("Planifier un échange →", "Réserver un diagnostic de 20 min →")
    content = content.replace(">Réserver mon audit<", ">Réserver mon audit — 490 €<")
    content = content.replace(">Candidater pour un accompagnement<", ">Réserver un diagnostic de 20 min<")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

