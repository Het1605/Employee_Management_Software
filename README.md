# Employee Management System - Production Deployment

This project is a modular, containerized Employee Management System. It is delivered as a set of pre-built Docker images to ensure a seamless, "zero-setup" deployment experience.

## 📦 Handover Files
Please ensure you have the following 4 files in a single directory:
1.  **`frontend.tar`**: Compiled React application and Nginx Gateway.
2.  **`backend.tar`**: Compiled FastAPI application and services.
3.  **`docker-compose.yml`**: Deployment instructions (previously `docker-compose.production.yml`).
4.  **`.env`**: Database and security configurations.

---

## 🚀 Deployment Instructions

Follow these steps to deploy the system on any Linux/AMD64 server:

### 1. Load the Docker Images
Import the pre-built images into your local Docker daemon:
```bash
docker load -i frontend.tar
docker load -i backend.tar
```

### 2. Configure Environment
Verify the `.env` file contains your desired secrets (Database passwords, Secret keys, etc.). The system is configured to automatically sync these with the containers.

### 3. Start the System
Run the following command to start the Database, Backend, and Frontend:
```bash
docker-compose up -d
```

---

## 🌐 Accessing the System

Once started, the system is unified under a single entry point:

*   **Main Application**: [http://localhost:3000](http://localhost:3000)
*   **API Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
*   **Admin Credentials**: Found in the `.env` file under `DEFAULT_ADMIN_EMAIL`.

### 🛡️ Architecture & Security
- **Unified Gateway**: The Frontend Nginx container acts as a reverse proxy for the Backend. 
- **Port Mapping**: The system is mapped to Port 3000 to avoid common conflicts with Port 80.
- **Persistence**: Data is stored in Docker volumes (`postgres_data` and `uploads_data`) to prevent data loss on restarts.
- **Relative API Routing**: The React application uses relative paths (`/api`) to ensure compatibility with any domain or IP without reconfiguration.

---

### 🛠️ Technical Highlights
- **Backend**: FastAPI with a modular domain-driven architecture.
- **Frontend**: React.js with role-based dashboard routing.
- **Features**: JWT Authentication, HTML-to-PDF reports, and automated salary slip dispatch.
- **Mobile Support**: Fully compatible with the Field Tracking mobile application.
