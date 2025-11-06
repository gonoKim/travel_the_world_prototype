# GitHub Pages + Route 53 (Custom Domain)

## 1) GitHub Pages
- Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- Optional: Add **Custom domain** (e.g., `map.example.com`). Enable **Enforce HTTPS**.

## 2) Route 53 (subdomain strongly recommended)
- In your hosted zone, create a **CNAME** record:
  - **Name**: `map.example.com`
  - **Value/Target**: `USERNAME.github.io.`
- Wait for DNS to propagate. In GitHub Pages, set **Custom domain** to `map.example.com`.

> Apex root (e.g., `example.com`) with GitHub Pages is not ideal on Route 53 because ALIAS to external hostnames isn't supported. Prefer a subdomain like `map.example.com`.
