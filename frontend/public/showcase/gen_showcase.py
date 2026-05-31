"""
One-time script to regenerate 8 showcase images in course-cover illustration style.
Run from the project root: python frontend/public/showcase/gen_showcase.py --force
"""
import os, base64, json, time, sys
import urllib.request, urllib.error

API_KEY = "AIzaSyAZDxZ3Kr9HJcjHmJjp5zrqXOKQpgkCZ3Q"
MODEL   = "gemini-3.1-flash-image-preview"
URL     = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

STYLE = (
    "Style: clean minimalist e-learning course cover illustration, "
    "warm Malaysian-inspired colour palette (terracotta, sage green, warm cream, deep teal), "
    "subtle batik or songket textile pattern as background texture, "
    "soft gradient lighting, professional digital art, no text, no letters, square format, "
    "suitable as a course card thumbnail, vibrant yet elegant."
)

PROMPTS = [
    ("showcase-1.jpg",
     f"KL city skyline at dusk featuring the iconic Petronas Twin Towers glowing against a warm sunset sky, tropical palm silhouettes in the foreground. {STYLE}"),
    ("showcase-2.jpg",
     f"Malaysian food feast illustration: nasi lemak wrapped in banana leaf, rendang, teh tarik, satay sticks, roti canai, arranged on a wooden table with batik cloth. {STYLE}"),
    ("showcase-3.jpg",
     f"Colourful Malaysian multicultural festival scene: Malay, Chinese and Indian cultural costumes, lanterns, flowers and traditional patterns celebrating together. {STYLE}"),
    ("showcase-4.jpg",
     f"Diverse group of international university students from different countries studying Bahasa Melayu together around a table, books open, smiling. {STYLE}"),
    ("showcase-5.jpg",
     f"Foreign workers and expats in a modern bright classroom learning Bahasa Melayu, teacher at whiteboard, engaged and attentive. {STYLE}"),
    ("showcase-6.jpg",
     f"Busy Malaysian night market hawker street: steaming wok, colourful food stalls, string lights overhead, vendors in traditional aprons. {STYLE}"),
    ("showcase-7.jpg",
     f"Tropical Malaysian kampung village at golden hour: wooden stilted houses, lush jungle greenery, river reflection, warm dusk light. {STYLE}"),
    ("showcase-8.jpg",
     f"International students exploring Georgetown Penang: colourful street art murals, heritage shophouses, bicycles, warm afternoon light. {STYLE}"),
]

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
FORCE   = "--force" in sys.argv

def generate(filename: str, prompt: str) -> bool:
    out_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(out_path) and not FORCE:
        print(f"  SKIP {filename} (already exists -- use --force to overwrite)")
        return True

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }).encode()

    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  ERROR {filename}: HTTP {e.code} -- {e.read().decode()[:200]}")
        return False
    except Exception as e:
        print(f"  ERROR {filename}: {e}")
        return False

    for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            b64 = part["inlineData"]["data"]
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(b64))
            size_kb = os.path.getsize(out_path) // 1024
            print(f"  OK    {filename}  ({size_kb} KB)")
            return True

    print(f"  WARN  {filename}: no image in response")
    return False

if __name__ == "__main__":
    print(f"Generating {len(PROMPTS)} course-cover style showcase images\n")
    for i, (fname, prompt) in enumerate(PROMPTS):
        print(f"[{i+1}/{len(PROMPTS)}] {fname}")
        ok = generate(fname, prompt)
        if i < len(PROMPTS) - 1:
            time.sleep(4)
    print("\nDone.")
