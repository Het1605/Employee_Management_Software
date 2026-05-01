# Employee Management Software

A professional, modular Employee Management System built with **FastAPI (Python)** and **React (JavaScript)**.

## 🚀 Quick Start (Local Development)

1. **Setup Environment**:
   - Create a `.env` file in the root directory (use `.env.example` as a template).
   - Ensure `DATABASE_URL` and `SECRET_KEY` are set.

2. **Run with Docker**:
   ```bash
   docker-compose up --build
   ```
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000/docs

---

## 🌐 Production Deployment Guide

This project is optimized for deployment behind an **Nginx Reverse Proxy**.

### Recommended Nginx Configuration
If you are deploying to a domain (e.g., `example.com`), use the following configuration as a template:

```nginx
server {
    listen 80;
    server_name example.com; # Replace with your domain

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 🛠️ Technical Highlights
- **Backend**: Domain-driven modular model structure (`app/models/`).
- **Security**: JWT-based authentication with `bcrypt` password hashing.
- **Frontend**: Multi-stage Docker build served by Nginx for high performance.
- **Reports**: HTML-to-PDF generation using `WeasyPrint`.

---

## 📁 Project Structure
- `backend/`: FastAPI application, modular models, and services.
- `frontend/`: React application with unified routing and role-based dashboards.
- `docker-compose.yml`: Production-ready container orchestration.
