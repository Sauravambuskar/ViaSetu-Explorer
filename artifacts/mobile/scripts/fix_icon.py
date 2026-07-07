from PIL import Image

# Load and convert the original logo
logo = Image.open(r"e:\The Salebridge\APK\ViaSetu-Explorer\artifacts\mobile\assets\images\icon.png").convert("RGBA")

# Adaptive icon canvas: 1024x1024
# Safe zone (visible after OS masking): inner ~66% = ~672px
# We'll target the logo to fit within 660px to be safe
CANVAS = 1024
SAFE_SIZE = 660  # inner safe area

# Scale logo to fit within safe zone
logo_w, logo_h = logo.size
scale = min(SAFE_SIZE / logo_w, SAFE_SIZE / logo_h)
new_w = int(logo_w * scale)
new_h = int(logo_h * scale)
logo_resized = logo.resize((new_w, new_h), Image.LANCZOS)

# Create transparent foreground canvas
foreground = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))

# Center the logo
x = (CANVAS - new_w) // 2
y = (CANVAS - new_h) // 2
foreground.paste(logo_resized, (x, y), logo_resized)

# Save the adaptive icon foreground
foreground.save(r"e:\The Salebridge\APK\ViaSetu-Explorer\artifacts\mobile\assets\images\adaptive-icon.png")

# Also create a clean 1024x1024 main icon (black bg + logo centered)
main_icon = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 255))
main_icon.paste(logo_resized, (x, y), logo_resized)
main_icon.save(r"e:\The Salebridge\APK\ViaSetu-Explorer\artifacts\mobile\assets\images\icon.png")

print(f"Adaptive foreground: {foreground.size} (logo {new_w}x{new_h} centered)")
print(f"Main icon: {main_icon.size}")
print("Done!")
