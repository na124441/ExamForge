import os
from PIL import Image, ImageDraw, ImageFont

def generate_icons(output_dir="frontend/public"):
    os.makedirs(output_dir, exist_ok=True)
    
    # Load source icon if exists
    src_path = os.path.join(output_dir, "logo-icon-transparent.png")
    if not os.path.exists(src_path):
        src_path = os.path.join(output_dir, "logo-icon.png")
    
    src_img = None
    if os.path.exists(src_path):
        src_img = Image.open(src_path).convert("RGBA")

    sizes = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-192.png", 192, True),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),
        ("badge-72.png", 72, False),
    ]

    for filename, size, is_maskable in sizes:
        # Create base canvas with ExamForge signature theme background
        canvas = Image.new("RGBA", (size, size), (13, 37, 32, 255)) # Deep Emerald #0D2520
        draw = ImageDraw.Draw(canvas)
        
        # Subtle rounded border or inner glow
        corner_r = int(size * 0.22) if not is_maskable else 0
        
        if not is_maskable:
            # Draw rounded rect gradient aesthetic
            draw.rounded_rectangle(
                [(0, 0), (size - 1, size - 1)],
                radius=corner_r,
                fill=(13, 37, 32, 255),
                outline=(45, 122, 107, 255),
                width=max(1, int(size * 0.02))
            )
            # Inner ambient circle
            center_x, center_y = size // 2, size // 2
            glow_r = int(size * 0.38)
            draw.ellipse(
                [(center_x - glow_r, center_y - glow_r), (center_x + glow_r, center_y + glow_r)],
                fill=(20, 58, 50, 255)
            )

        # Place logo in center
        if src_img:
            scale_factor = 0.55 if is_maskable else 0.65
            target_w = int(size * scale_factor)
            ratio = target_w / float(src_img.size[0])
            target_h = int(src_img.size[1] * ratio)
            
            resized_logo = src_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            offset_x = (size - target_w) // 2
            offset_y = (size - target_h) // 2
            canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
        else:
            # Fallback if no image found: Draw crisp geometric insignia
            pad = int(size * 0.25)
            draw.polygon(
                [(size // 2, pad), (size - pad, pad * 2), (size - pad, size - pad), (size // 2, size - pad // 2), (pad, size - pad), (pad, pad * 2)],
                fill=(138, 216, 184, 255),
                outline=(255, 244, 226, 255)
            )

        target_file = os.path.join(output_dir, filename)
        canvas.save(target_file, "PNG")
        print(f"  ✓ Generated {filename} ({size}x{size})")

if __name__ == "__main__":
    generate_icons()
