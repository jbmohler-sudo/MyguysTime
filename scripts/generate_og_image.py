"""Generate public/images/og-myguystime.png (1200x630) via headless Chromium.

Brand orange background, logo mark (white circle + orange check), headline
"Simple Time Cards for Contractor Crews - $12/mo flat". Clean vector-style
render, no AI art. Uses the local Playwright install.
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images" / "og-myguystime.png"

HTML = """<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;background:#f97316;position:relative;font-family:Arial,Helvetica,sans-serif;overflow:hidden">
  <div style="position:absolute;right:-180px;bottom:-180px;width:640px;height:640px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
  <div style="position:absolute;right:-60px;top:-140px;width:380px;height:380px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
  <div style="position:absolute;left:80px;top:70px;display:flex;align-items:center;gap:26px">
    <div style="width:96px;height:96px;border-radius:24px;background:#ffffff;display:flex;align-items:center;justify-content:center">
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none"><path d="M4 12.5L9.5 18L20 6.5" stroke="#f97316" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div style="font-size:44px;font-weight:bold;color:#ffffff">My Guys Time</div>
  </div>
  <div style="position:absolute;left:80px;top:250px;max-width:1040px">
    <div style="font-size:78px;font-weight:800;color:#ffffff;line-height:1.12">Simple Time Cards for<br>Contractor Crews</div>
    <div style="margin-top:36px;font-size:40px;font-weight:600;color:#ffedd5">$12/mo flat &mdash; whole crew, no per-seat fees</div>
  </div>
  <div style="position:absolute;left:80px;bottom:64px;display:flex;align-items:center;gap:14px">
    <div style="width:22px;height:22px;border-radius:50%;background:#ffffff"></div>
    <div style="font-size:26px;color:#fff7ed">myguystime.com</div>
  </div>
</div>
</body></html>"""

CHROME = r"C:\Users\jbmoh\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME)
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.set_content(HTML)
    page.screenshot(path=str(OUT))
    browser.close()

size = OUT.stat().st_size
print(f"[og-image] wrote {OUT} ({size} bytes)")
