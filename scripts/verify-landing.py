"""Landing page hydration + visual verification against vite preview.

Desktop (1440x900) and mobile (390x844) screenshots of hero / pricing / final
CTA. Confirms hydration works by clicking the 'Start as Admin' demo button and
asserting the URL changes to /demo/admin.
"""
import pathlib
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
OUT = pathlib.Path("C:/Umbrella/MyGuysTime/docs/work-orders/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

CHROME = r"C:\Users\jbmoh\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe"

def shoot(page, name, scroll_selector=None):
    if scroll_selector:
        page.eval_on_selector(scroll_selector, "el => el.scrollIntoView({block:'center'})")
        time.sleep(0.8)
    page.screenshot(path=str(OUT / name), full_page=False)
    print(f"[shot] {name}")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME)

    # Desktop
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"PAGEERROR: {e}"))
    page.goto(BASE, wait_until="domcontentloaded")
    time.sleep(3.0)
    print("[dom] has #pricing:", page.query_selector("#pricing") is not None)
    shoot(page, "desktop-hero.png", "section:nth-of-type(1)")
    shoot(page, "desktop-pricing.png", "#pricing")
    shoot(page, "desktop-final-cta.png", "main > section:last-of-type")

    # Hydration check: demo role button must navigate.
    page.goto(BASE, wait_until="domcontentloaded")
    time.sleep(3.0)
    page.click("text=Start as Admin")
    page.wait_for_url("**/demo/admin", timeout=8000)
    print(f"[hydration] demo button navigated to {page.url}")
    page.go_back(wait_until="domcontentloaded")
    time.sleep(2.0)

    # Mobile 390px
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(BASE, wait_until="domcontentloaded")
    time.sleep(3.0)
    shoot(page, "mobile-hero.png", "section:nth-of-type(1)")
    shoot(page, "mobile-pricing.png", "#pricing")
    shoot(page, "mobile-final-cta.png", "main > section:last-of-type")

    real_errors = [e for e in errors if "hydrate" not in e.lower() and "posthog" not in e.lower()]
    print(f"[console] {len(real_errors)} real errors")
    for e in real_errors[:5]:
        print("  -", e[:200])
    browser.close()
print("[done]")
