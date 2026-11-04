"""Coral Bank (fictional) demo API - Flask.

Run:
    pip install flask flask-cors
    python app.py
Then open index.html (or serve the folder with `python -m http.server 8000`).
Nothing here touches real banking data. The login is a hard-coded demo user.
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # demo only: allow the static page to call the API

DATA = Path(__file__).resolve().parent.parent / "data"
DATA.mkdir(exist_ok=True)
MESSAGES = DATA / "messages.jsonl"

RATES = [
    {"pair": "USD/MUR", "buy": 44.10, "sell": 45.60},
    {"pair": "EUR/MUR", "buy": 48.20, "sell": 50.10},
    {"pair": "GBP/MUR", "buy": 56.00, "sell": 58.40},
    {"pair": "ZAR/MUR", "buy": 2.45, "sell": 2.62},
    {"pair": "INR/MUR", "buy": 0.52, "sell": 0.56},
    {"pair": "AUD/MUR", "buy": 28.60, "sell": 30.20},
]
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@app.get("/api/rates")
def rates():
    return jsonify(rates=RATES, updated=datetime.now(timezone.utc).isoformat(), note="Fictional demo rates")


@app.get("/api/loan")
def loan():
    try:
        amount = float(request.args["amount"])
        rate = float(request.args["rate"])
        years = int(request.args["years"])
    except (KeyError, ValueError):
        return jsonify(error="amount, rate and years are required numbers"), 400
    if not (1_000 <= amount <= 100_000_000 and 0 <= rate <= 40 and 1 <= years <= 40):
        return jsonify(error="values out of range"), 400

    r, n = rate / 100 / 12, years * 12
    monthly = amount / n if r == 0 else amount * r * (1 + r) ** n / ((1 + r) ** n - 1)
    total = monthly * n
    return jsonify(monthly=monthly, total=total, interest=total - amount)


@app.post("/api/contact")
def contact():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()[:80]
    email = str(body.get("email", "")).strip()[:120]
    message = str(body.get("message", "")).strip()[:2000]
    if not name or not EMAIL_RE.match(email) or len(message) < 5:
        return jsonify(ok=False, error="invalid input"), 400
    with MESSAGES.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(), "name": name,
                            "email": email, "message": message}) + "\n")
    return jsonify(ok=True)


@app.post("/api/login")
def login():
    body = request.get_json(silent=True) or {}
    ok = body.get("username") == "demo" and body.get("password") == "coral123"
    return jsonify(ok=ok), (200 if ok else 401)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
