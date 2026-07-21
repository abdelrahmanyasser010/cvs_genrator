import json
import subprocess
import time
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 5591
BASE = f"http://localhost:{PORT}"
ART = ROOT / "test-artifacts"
ART.mkdir(exist_ok=True)

sample = {
    "personalInfo": {
        "name": "أحمد علي",
        "title": "محاسب مالي",
        "email": "ahmed@example.com",
        "phone": "+201000000000",
        "location": "القاهرة، مصر",
        "links": {}
    },
    "careerProfile": {"field": "accountant", "specialization": "financial_accounting", "level": "senior", "years": "8"},
    "professionalSummary": "محاسب مالي بخبرة في الإغلاق الشهري والتسويات وإعداد التقارير المالية.",
    "experience": [{"role":"محاسب مالي","company":"شركة حقيقية","start":"2020","end":"Present","bullets":["أعددت تقارير مالية شهرية وراجعت التسويات البنكية.","دعمت عملية الإغلاق الشهري وتابعت المستندات المحاسبية."]}],
    "education": [{"degree":"بكالوريوس تجارة","school":"جامعة القاهرة","year":"2019"}],
    "skills": {"core":["Excel","التسويات البنكية","إعداد التقارير"]},
    "projects": [], "languages": [], "certificates": [], "awards": [],
    "meta": {"locale":"ar","templateId":"ats","versionId":"default","versionName":"السيرة الرئيسية"}
}

server = subprocess.Popen(
    ["node", "local-server.js"], cwd=ROOT,
    env={**__import__('os').environ, "PORT": str(PORT)},
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)
try:
    for _ in range(50):
        try:
            import urllib.request
            urllib.request.urlopen(f"{BASE}/app/onboarding.html", timeout=0.5)
            break
        except Exception:
            time.sleep(0.1)
    else:
        raise RuntimeError("server failed to start")

    with sync_playwright() as p:
        launch_args = {"headless": True, "args": ["--no-sandbox"]}
        configured = os.environ.get("CHROMIUM_PATH")
        if configured:
            launch_args["executable_path"] = configured
        elif Path("/usr/bin/chromium").exists():
            launch_args["executable_path"] = "/usr/bin/chromium"
        browser = p.chromium.launch(**launch_args)
        for width, height in [(320, 720), (390, 844), (768, 1024), (1024, 768), (1366, 900)]:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
            errors = []
            page.on("pageerror", lambda exc, errors=errors: errors.append(str(exc)))
            page.goto(f"{BASE}/app/onboarding.html", wait_until="domcontentloaded")
            page.evaluate("""(career) => {
                localStorage.clear();
                localStorage.setItem('cv_studio_active_version_id','default');
                localStorage.setItem('cv_studio_version_default', JSON.stringify(career));
                localStorage.setItem('cv_studio_career', JSON.stringify(career));
                localStorage.setItem('cv_studio_versions_registry', JSON.stringify([{id:'default',name:'السيرة الرئيسية',updatedAt:new Date().toISOString(),level:'senior',field:'accountant'}]));
            }""", sample)
            page.goto(f"{BASE}/app/editor.html", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector("#sections-list .section-row", timeout=10000)
            assert not errors, f"page errors at {width}: {errors}"
            assert page.locator("#preview-frame").count() == 1
            assert page.locator("#local-data-banner").count() == 1
            if width <= 1024:
                page.click("#mob-btn-coach")
                page.wait_for_timeout(150)
                assert page.locator("body.mobile-coach-mode").count() == 1
                assert page.locator("#editor-right-panel").is_visible()
                page.screenshot(path=str(ART / f"coach-{width}.png"), full_page=False)
                page.click("#mob-btn-edit")
                assert page.locator("#editor-left-panel").is_visible()
            else:
                assert page.locator(".editor-topbar").is_visible()
                page.click("#coach-toggle-btn")
                page.wait_for_timeout(100)
                assert page.locator("body.coach-collapsed").count() in (0, 1)
            page.screenshot(path=str(ART / f"editor-{width}.png"), full_page=False)
            page.close()

        # Endpoint must reject arbitrary or unauthenticated calls.
        page = browser.new_page()
        page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        page.goto(f"{BASE}/app/onboarding.html")
        result = page.evaluate("""async () => {
          const r = await fetch('/api/ai/generate', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:'hello'})});
          return {status:r.status, body:await r.json()};
        }""")
        assert result["status"] == 403
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=4)
    except subprocess.TimeoutExpired:
        server.kill()

print("E2E smoke checks passed.")
