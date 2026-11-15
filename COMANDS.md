# Ejecutar HaiLex

Abre dos terminales PowerShell en VS Code y ejecuta un bloque en cada una.

## Backend

```powershell
Set-Location 'C:\Users\pochi\OneDrive\Desktop\hailex\backend'
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend

```powershell
Set-Location 'C:\Users\pochi\OneDrive\Desktop\hailex\frontend'
npm.cmd run dev
```

Abre `http://127.0.0.1:5173` en el navegador.