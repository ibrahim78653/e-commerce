import os
from PIL import Image

def generate_icons():
    workspace_dir = r"c:\Users\LENOVO\Desktop\e-commerce"
    logo_path = os.path.join(workspace_dir, "frontend", "public", "logo-best.jpeg")
    public_dir = os.path.join(workspace_dir, "frontend", "public")
    
    if not os.path.exists(logo_path):
        print(f"Error: Base logo not found at {logo_path}")
        return
        
    print(f"Loading base logo from {logo_path}...")
    img = Image.open(logo_path)
    
    # 1. Generate favicon.ico (standard multi-size icon)
    favicon_path = os.path.join(public_dir, "favicon.ico")
    img.save(favicon_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated favicon.ico at {favicon_path}")
    
    # 2. Generate apple-touch-icon.png (180x180)
    apple_icon_path = os.path.join(public_dir, "apple-touch-icon.png")
    apple_img = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_img.save(apple_icon_path, format="PNG")
    print(f"Generated apple-touch-icon.png at {apple_icon_path}")
    
    # 3. Generate pwa-192x192.png
    pwa_192_path = os.path.join(public_dir, "pwa-192x192.png")
    pwa_192_img = img.resize((192, 192), Image.Resampling.LANCZOS)
    pwa_192_img.save(pwa_192_path, format="PNG")
    print(f"Generated pwa-192x192.png at {pwa_192_path}")
    
    # 4. Generate pwa-512x512.png
    pwa_512_path = os.path.join(public_dir, "pwa-512x512.png")
    pwa_512_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    pwa_512_img.save(pwa_512_path, format="PNG")
    print(f"Generated pwa-512x512.png at {pwa_512_path}")
    
    # 5. Create a basic mask-group.svg
    svg_path = os.path.join(public_dir, "mask-group.svg")
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="240" fill="#ffffff" stroke="#A94A4A" stroke-width="16"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Times New Roman', serif" font-size="160" font-weight="bold" fill="#A94A4A">BC</text>
</svg>"""
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated mask-group.svg at {svg_path}")

if __name__ == "__main__":
    generate_icons()
