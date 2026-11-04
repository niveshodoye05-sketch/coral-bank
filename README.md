# Coral Bank (fictional demo)

A modern, animated bank website built with HTML, CSS, JavaScript, Python (Flask) and PHP.
Coral Bank is not a real bank. No real accounts, money or personal data are used.

## Run it

Frontend only (works on its own, with local fallbacks):

    python3 -m http.server 8000      # then open http://127.0.0.1:8000

With the Python API (live rates, loan maths, contact form, demo login):

    pip install flask flask-cors
    python3 api/app.py               # http://127.0.0.1:5000

With PHP for the contact form instead (from this folder):

    php -S 127.0.0.1:8000

The contact form tries Flask first, then PHP, then falls back to demo mode.
Demo login: `demo` / `coral123`.

## Features

- Scroll-reveal animations, scroll progress bar, sticky blurred header
- Animated phone mockup (counting balance, drawing chart, floating cards)
- Rotating headline word, 3D tilt cards, magnetic buttons
- Infinite exchange-rate ticker (API with fallback)
- Sliding-ink tabs, filterable Knowledge Hub
- Loan calculator with animated donut (local + Flask API)
- Dark mode (remembered), mobile circular-reveal menu
- Branch finder with a stylised map
- Respects `prefers-reduced-motion`

## Structure

    index.html
    css/style.css
    js/main.js
    api/app.py          Flask API
    php/contact.php     PHP contact handler
    data/               saved messages (created at runtime)
