import sys
import subprocess

subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])

from PIL import Image

def remove_green_screen(input_path, output_path):
    print(f"Processando {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        if g > 150 and r < 100 and b < 100:
            new_data.append((255, 255, 255, 0)) # Transparente
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Salvo em {output_path}")

remove_green_screen(
    r"C:\Users\MaykonSilva\.gemini\antigravity-ide\brain\4dfb1b37-41a0-43d1-9ba9-9978ae653a21\kevin_sprite_sheet_1790798465194.png",
    r"C:\Users\MaykonSilva\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\Área de Trabalho\Arquivos Gerais\Automações\cmsw_figth\game\public\assets\sprites\kevin.png"
)

remove_green_screen(
    r"C:\Users\MaykonSilva\.gemini\antigravity-ide\brain\4dfb1b37-41a0-43d1-9ba9-9978ae653a21\vini_dog_sprite_sheet_1790798475303.png",
    r"C:\Users\MaykonSilva\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\Área de Trabalho\Arquivos Gerais\Automações\cmsw_figth\game\public\assets\sprites\vini_dog.png"
)
print("Sucesso!")
