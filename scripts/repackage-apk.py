#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Android APK Auto-Repackage & Signing Engine (Universal OpenSSL + Native Support)
Automatically compiles the latest web dist into the APK package, aligns, and signs it.
Ensures that whenever a user downloads the APK, it contains the latest code without nested APK bloat.
Target game server URL is dynamically extracted from .env and injected into APK assets.
"""

import os
import sys
import json
import time
import zipfile
import shutil
import base64
import hashlib
import datetime
import subprocess

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
APK_DIR = os.path.join(ROOT_DIR, 'apk')
ANDROID_DIR = os.path.join(ROOT_DIR, 'android')
BASE_APK_PATH = os.path.join(ANDROID_DIR, 'app-base.apk')
KEY_PEM_PATH = os.path.join(ANDROID_DIR, 'debug_key.pem')
CERT_PEM_PATH = os.path.join(ANDROID_DIR, 'debug_cert.pem')
KEYSTORE_PATH = os.path.join(ANDROID_DIR, 'debug.keystore')

def log(msg):
    print(f"📦 [APK Packager] {msg}")

def ensure_dist():
    index_html = os.path.join(DIST_DIR, 'index.html')
    if not os.path.exists(index_html):
        log("dist/index.html not found, executing vite build...")
        subprocess.run(['npm', 'run', 'build'], cwd=ROOT_DIR, check=True)

def ensure_base_apk():
    if not os.path.exists(BASE_APK_PATH):
        candidates = [
            os.path.join(APK_DIR, 'app-latest.apk'),
            os.path.join(APK_DIR, 'chess-game-release.apk'),
        ]
        for c in candidates:
            if os.path.exists(c):
                shutil.copyfile(c, BASE_APK_PATH)
                log(f"Backed up base APK template from {c}")
                break
    if not os.path.exists(BASE_APK_PATH):
        raise FileNotFoundError(f"Base APK template not found at {BASE_APK_PATH}")

def ensure_crypto_keys():
    """Generates and persists an RSA key & self-signed debug certificate using openssl."""
    if os.path.exists(KEY_PEM_PATH) and os.path.exists(CERT_PEM_PATH):
        return KEY_PEM_PATH, CERT_PEM_PATH

    log("Generating deterministic permanent debug signing keys with openssl...")
    os.makedirs(ANDROID_DIR, exist_ok=True)
    cmd = [
        'openssl', 'req', '-x509',
        '-newkey', 'rsa:2048',
        '-keyout', KEY_PEM_PATH,
        '-out', CERT_PEM_PATH,
        '-days', '10000',
        '-nodes',
        '-subj', '/CN=Guocui Chess Debug/O=Guocui Chess Platform/C=CN'
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return KEY_PEM_PATH, CERT_PEM_PATH

def find_latest_bundle_info():
    assets_dir = os.path.join(DIST_DIR, 'assets')
    js_files = []
    css_files = []
    if os.path.exists(assets_dir):
        for f in os.listdir(assets_dir):
            if f.endswith('.js'):
                js_files.append(f)
            elif f.endswith('.css'):
                css_files.append(f)
    return {
        'js': js_files[0] if js_files else 'index.js',
        'css': css_files[0] if css_files else 'index.css'
    }

def sign_apk_v1(input_apk_path, output_apk_path):
    """
    Standard Android APK v1 JAR signature generator via OpenSSL.
    Creates:
      - META-INF/MANIFEST.MF
      - META-INF/CERT.SF
      - META-INF/CERT.RSA (PKCS#7 signature)
    Compatible with all Android versions (Android 5.0 through Android 15+).
    """
    key_path, cert_path = ensure_crypto_keys()

    entries = {}
    with zipfile.ZipFile(input_apk_path, 'r') as zin:
        for name in zin.namelist():
            if name.startswith('META-INF/'):
                continue
            data = zin.read(name)
            h = hashlib.sha256(data).digest()
            entries[name] = base64.b64encode(h).decode('ascii')

    # 1. Build MANIFEST.MF
    manifest_lines = [
        'Manifest-Version: 1.0',
        'Built-By: Generated-By-Guocui-Packager',
        'Created-By: 1.0 (Android Packager)',
        ''
    ]
    for name, sha_b64 in sorted(entries.items()):
        manifest_lines.append(f'Name: {name}')
        manifest_lines.append(f'SHA-256-Digest: {sha_b64}')
        manifest_lines.append('')
    manifest_content = '\r\n'.join(manifest_lines).encode('utf-8')

    manifest_sha = base64.b64encode(hashlib.sha256(manifest_content).digest()).decode('ascii')

    # 2. Build CERT.SF
    sf_lines = [
        'Signature-Version: 1.0',
        'Created-By: 1.0 (Android Packager)',
        f'SHA-256-Digest-Manifest: {manifest_sha}',
        ''
    ]
    for name in sorted(entries.keys()):
        section = f'Name: {name}\r\nSHA-256-Digest: {entries[name]}\r\n\r\n'.encode('utf-8')
        sec_sha = base64.b64encode(hashlib.sha256(section).digest()).decode('ascii')
        sf_lines.append(f'Name: {name}')
        sf_lines.append(f'SHA-256-Digest: {sec_sha}')
        sf_lines.append('')
    sf_content = '\r\n'.join(sf_lines).encode('utf-8')

    # 3. Sign CERT.SF using openssl CMS / PKCS#7 to generate CERT.RSA
    temp_sf = '/tmp/CERT.SF'
    temp_rsa = '/tmp/CERT.RSA'
    with open(temp_sf, 'wb') as f:
        f.write(sf_content)

    cms_cmd = [
        'openssl', 'cms', '-sign',
        '-in', temp_sf,
        '-signer', cert_path,
        '-inkey', key_path,
        '-outform', 'DER',
        '-binary',
        '-nodetach',
        '-nosmimecap',
        '-out', temp_rsa
    ]
    subprocess.run(cms_cmd, check=True)

    with open(temp_rsa, 'rb') as f:
        rsa_content = f.read()

    # 4. Write signed output APK
    with zipfile.ZipFile(input_apk_path, 'r') as zin:
        with zipfile.ZipFile(output_apk_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            # Write META-INF signature files first
            zout.writestr('META-INF/MANIFEST.MF', manifest_content)
            zout.writestr('META-INF/CERT.SF', sf_content)
            zout.writestr('META-INF/CERT.RSA', rsa_content)

            # Copy all entries, preserving ZIP_STORED for resources.arsc and .so files
            for item in zin.infolist():
                if item.filename.startswith('META-INF/'):
                    continue
                if item.filename == 'resources.arsc' or item.filename.endswith('.so'):
                    item.compress_type = zipfile.ZIP_STORED
                zout.writestr(item, zin.read(item.filename))

    log("OpenSSL v1 APK signature applied successfully!")

def get_env_server_url():
    # 1. First check dedicated server_url.txt file in repository root
    server_file_path = os.path.join(ROOT_DIR, 'server_url.txt')
    if os.path.exists(server_file_path):
        try:
            with open(server_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and (line.startswith('http://') or line.startswith('https://')):
                        return line.rstrip('/')
        except Exception:
            pass

    candidates = [
        os.path.join(ROOT_DIR, '.env'),
        os.path.join(ROOT_DIR, '..', '.env'),
        os.path.expanduser('~/.env'),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('#') or '=' not in line:
                            continue
                        k, v = line.split('=', 1)
                        k = k.strip().upper()
                        v = v.strip().strip("'\"").strip()
                        if k in ('URL', 'APP_URL', 'SERVER_URL', 'WEBHOOK_URL') and v:
                            return v.rstrip('/')
            except Exception:
                pass
    return (os.environ.get('URL') or os.environ.get('APP_URL') or os.environ.get('WEBHOOK_URL') or '').strip().rstrip('/') or 'https://m.my66.cc.cd'

def repackage():
    ensure_dist()
    ensure_base_apk()

    now = datetime.datetime.now()
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')
    bundle_info = find_latest_bundle_info()
    server_url = get_env_server_url()
    log(f"Target game server URL from .env: {server_url}")

    app_config = {
        'serverUrl': server_url,
        'buildTime': now_str,
        'description': 'Target server URL automatically configured from .env'
    }
    app_config_json = json.dumps(app_config, ensure_ascii=False, indent=2).encode('utf-8')

    os.makedirs(PUBLIC_DIR, exist_ok=True)
    with open(os.path.join(PUBLIC_DIR, 'app-config.json'), 'wb') as f:
        f.write(app_config_json)
    if os.path.exists(DIST_DIR):
        with open(os.path.join(DIST_DIR, 'app-config.json'), 'wb') as f:
            f.write(app_config_json)

    build_info = {
        'version': '1.2.0',
        'buildTime': now_str,
        'timestamp': int(time.time() * 1000),
        'jsBundle': bundle_info['js'],
        'cssBundle': bundle_info['css'],
        'serverUrl': server_url,
        'isLatestPackaged': True,
        'description': '三大经典国粹棋牌 - 最新编译全量覆盖安装包'
    }

    temp_dir = '/tmp/apk_build_workspace'
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    temp_unsigned = os.path.join(temp_dir, 'unsigned.apk')
    temp_signed = os.path.join(temp_dir, 'signed.apk')

    log("Injecting fresh dist web assets into APK (strictly omitting nested *.apk)...")
    with zipfile.ZipFile(BASE_APK_PATH, 'r') as zin:
        with zipfile.ZipFile(temp_unsigned, 'w') as zout:
            # 1. Copy non-web, non-signature files from base APK
            for item in zin.infolist():
                fn = item.filename
                # Skip existing web assets
                if fn.startswith('assets/public/'):
                    continue
                # Skip existing signatures
                if fn.startswith('META-INF/'):
                    continue
                if fn == 'resources.arsc' or fn.endswith('.so'):
                    item.compress_type = zipfile.ZIP_STORED
                data = zin.read(fn)
                zout.writestr(item, data)

            # 2. Add current dist files into assets/public/
            for root, dirs, files in os.walk(DIST_DIR):
                for file in files:
                    if file.lower().endswith(('.apk', '.tar.gz', '.zip')):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, DIST_DIR)
                    apk_entry_name = 'assets/public/' + rel_path.replace('\\', '/')

                    # If this is index.html, inject window.__APP_ENV_URL__ and window.__APP_SERVER_CONFIG__
                    if rel_path == 'index.html':
                        with open(full_path, 'r', encoding='utf-8') as html_f:
                            html_content = html_f.read()
                        if '<script>window.__APP_ENV_URL__' not in html_content:
                            inject_script = (
                                f'<script>'
                                f'window.__APP_ENV_URL__={json.dumps(server_url)};'
                                f'window.__APP_SERVER_CONFIG__={json.dumps(app_config)};'
                                f'</script>'
                            )
                            html_content = html_content.replace('</head>', f'{inject_script}\n</head>')
                        zout.writestr(apk_entry_name, html_content.encode('utf-8'), compress_type=zipfile.ZIP_DEFLATED)
                    else:
                        zout.write(full_path, apk_entry_name, compress_type=zipfile.ZIP_DEFLATED)

            # 3. Explicitly guarantee assets/public/app-config.json is inside APK if not already copied
            if 'app-config.json' not in os.listdir(DIST_DIR):
                zout.writestr('assets/public/app-config.json', app_config_json, compress_type=zipfile.ZIP_DEFLATED)

    # Check if native apksigner exists; if not, use OpenSSL CMS v1 signing
    apksigner_bin = shutil.which('apksigner')
    zipalign_bin = shutil.which('zipalign')

    if apksigner_bin and zipalign_bin and os.path.exists(KEYSTORE_PATH):
        log("Using Android SDK zipalign and apksigner...")
        temp_aligned = os.path.join(temp_dir, 'aligned.apk')
        subprocess.run([zipalign_bin, '-f', '-p', '4', temp_unsigned, temp_aligned], check=True)
        sign_cmd = [
            apksigner_bin, 'sign',
            '--ks', KEYSTORE_PATH,
            '--ks-pass', 'pass:android',
            '--ks-key-alias', 'androiddebugkey',
            '--key-pass', 'pass:android',
            '--out', temp_signed,
            temp_aligned
        ]
        subprocess.run(sign_cmd, check=True)
    else:
        log("Signing APK using universal OpenSSL PKCS#7 v1 signing engine...")
        sign_apk_v1(temp_unsigned, temp_signed)

    apk_file_size = os.path.getsize(temp_signed)
    apk_file_size_mb = f"{apk_file_size / (1024 * 1024):.2f} MB"
    log(f"Clean compiled APK size: {apk_file_size_mb}")

    os.makedirs(APK_DIR, exist_ok=True)
    targets = [
        os.path.join(APK_DIR, 'chess-game-release.apk'),
        os.path.join(APK_DIR, 'chess-game-debug.apk'),
        os.path.join(APK_DIR, 'app-latest.apk'),
    ]

    for t in targets:
        shutil.copyfile(temp_signed, t)
        log(f"Overwritten: {t}")

    # Cleanup temp workspace
    shutil.rmtree(temp_dir, ignore_errors=True)

    build_info['fileSize'] = apk_file_size
    build_info['fileSizeMb'] = apk_file_size_mb

    with open(os.path.join(APK_DIR, 'apk-build-info.json'), 'w', encoding='utf-8') as f:
        json.dump(build_info, f, ensure_ascii=False, indent=2)
    with open(os.path.join(PUBLIC_DIR, 'apk-build-info.json'), 'w', encoding='utf-8') as f:
        json.dump(build_info, f, ensure_ascii=False, indent=2)

    log(f"🎉 Latest APK successfully repackaged with .env server URL ({server_url}) at {now_str}!")
    return build_info

if __name__ == '__main__':
    try:
        repackage()
    except Exception as e:
        print(f"❌ Repackage error: {e}", file=sys.stderr)
        sys.exit(1)
