"""Run the official local MobSF API without exposing an HTTP server.

Usage: tools/mobsf-venv/Scripts/python.exe scripts/security-mobsf.py INPUT OUTPUT
INPUT is a native Android source ZIP or an APK. Reports stay in tmp/security.
No external malware service receives the application.
"""
import json
import os
from pathlib import Path
import secrets
import sys

def main():
    root = Path(__file__).resolve().parents[1]
    home = root / "tmp/security/mobsf-home"
    home.mkdir(parents=True, exist_ok=True)
    secret = home / "secret"
    if not secret.exists():
        secret.write_text(secrets.token_hex(32), encoding="utf-8")
    os.environ.update({
        "MOBSF_HOME_DIR": str(home),
        "MOBSF_SECRET_KEY": secret.read_text(encoding="utf-8"),
        "MOBSF_API_ONLY": "1",
        "MOBSF_DOMAIN_MALWARE_SCAN": "0",
        "MOBSF_VT_ENABLED": "",
        "CI": "1",
        "DJANGO_SETTINGS_MODULE": "mobsf.MobSF.settings",
    })
    # JADX defaults to 70% of host RAM; leave room for the Android emulator.
    os.environ.setdefault("JAVA_OPTS", "-Xmx4g")
    sys.path.insert(0, str(root / "tools/MobSF"))
    import django
    django.setup()
    from django.core.management import call_command
    from django.test import Client
    from django.conf import settings
    from mobsf.MobSF.init import api_key
    from mobsf.StaticAnalyzer.models import StaticAnalyzerAndroid

    call_command("makemigrations", "StaticAnalyzer", interactive=False, verbosity=0)
    call_command("migrate", interactive=False, verbosity=0)
    client = Client(HTTP_HOST="localhost", HTTP_AUTHORIZATION=api_key(settings.MOBSF_HOME))
    source, output = Path(sys.argv[1]), Path(sys.argv[2])
    with source.open("rb") as handle:
        uploaded = client.post("/api/v1/upload", {"file": handle})
    if uploaded.status_code != 200:
        raise RuntimeError(uploaded.content.decode())
    payload = uploaded.json()
    # MobSF's rescan updates an existing row; on a first APK it must insert.
    existing = StaticAnalyzerAndroid.objects.filter(MD5=payload['hash']).exists()
    payload['re_scan'] = '1' if existing else '0'
    print("Uploaded:", payload.get("file_name"), payload.get("hash"), flush=True)
    scanned = client.post("/api/v1/scan", payload)
    if scanned.status_code != 200:
        raise RuntimeError(scanned.content.decode())
    output.parent.mkdir(parents=True, exist_ok=True)
    output.with_suffix('.scan.json').write_text(scanned.content.decode(), encoding='utf-8')
    report = client.post("/api/v1/report_json", {"hash": payload["hash"]})
    if report.status_code != 200:
        raise RuntimeError(report.content.decode())
    output.write_text(json.dumps(report.json(), indent=2), encoding="utf-8")
    print("Report:", output, flush=True)


if __name__ == "__main__":
    main()
