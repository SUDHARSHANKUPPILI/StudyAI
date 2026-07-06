"""Simple Python web application for Google App Engine."""

import os
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    """Landing page."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hello – Google App Engine</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #e0e0e0;
    }
    .card {
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 3rem 4rem;
      text-align: center;
      max-width: 540px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: fadeUp 0.7s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #4ecdc4;
      border: 1px solid #4ecdc4;
      border-radius: 999px;
      padding: 4px 14px;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 2.4rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #4ecdc4, #45b7d1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #aaa; line-height: 1.7; margin-bottom: 1.5rem; }
    .links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .links a {
      padding: 0.55rem 1.4rem;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-primary {
      background: linear-gradient(90deg, #4ecdc4, #45b7d1);
      color: #0f3460;
    }
    .btn-secondary {
      border: 1px solid rgba(255,255,255,0.2);
      color: #e0e0e0;
    }
    .links a:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Google App Engine</div>
    <h1>Hello, World! 🚀</h1>
    <p>
      Your Python Flask application is up and running on
      <strong>Google App Engine Standard</strong>.
    </p>
    <div class="links">
      <a href="/health" class="btn-primary">Health Check</a>
      <a href="https://console.cloud.google.com/appengine" target="_blank" class="btn-secondary">GCP Console</a>
    </div>
  </div>
</body>
</html>
"""


@app.route("/health")
def health():
    """JSON health-check endpoint."""
    return jsonify(status="ok", service="hello-gae")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
