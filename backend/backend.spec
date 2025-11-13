# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path

# Get the current directory (backend folder)
current_dir = Path.cwd()
# Get the parent directory (reactui folder)
parent_dir = current_dir.parent

a = Analysis(
    ["run.py"],
    pathex=[str(current_dir), str(parent_dir)],
    binaries=[],
    datas=[
        # Include config files
        ("app", "app"),
        (str(parent_dir / "crypto"), "crypto"),
    ],
    hiddenimports=[
        "flask", "flask_cors", "werkzeug", "jinja2",
        "pymongo", "cryptography", "cryptography.hazmat",
        "cryptography.hazmat.primitives", "boto3", "python-dotenv",
        "requests", "werkzeug.security", "datetime", "pathlib",
        "os", "sys", "json", "uuid", "hashlib", "base64", "secrets",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="sentra-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
