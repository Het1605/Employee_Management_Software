from PIL import Image, ImageChops

def crop_white(im):
    if im.mode != 'RGB':
        im = im.convert('RGB')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

path = 'frontend/public/favicon.png'
img = Image.open(path)
cropped = crop_white(img)
w, h = cropped.size
new_size = max(w, h)
new_img = Image.new('RGB', (new_size, new_size), (255, 255, 255))
new_img.paste(cropped, ((new_size - w) // 2, (new_size - h) // 2))
final_img = new_img.resize((512, 512), Image.Resampling.LANCZOS)
final_img.save(path)
print("Done")
