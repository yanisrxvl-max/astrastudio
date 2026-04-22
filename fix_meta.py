import glob, re

files = glob.glob('*.html') + glob.glob('**/*.html')

new_meta = '<meta name="description"\n    content="Astra Studio — Direction créative pour marques beauté indépendantes. Un studio, une méthode, une ligne tenue dans la durée." />'
new_meta_inline = '<meta name="description" content="Astra Studio — Direction créative pour marques beauté indépendantes. Un studio, une méthode, une ligne tenue dans la durée." />'

for filepath in set(files):
    if "node_modules" in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace anything resembling meta description
    content = re.sub(r'<meta name="description"[^>]*>', new_meta_inline, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

