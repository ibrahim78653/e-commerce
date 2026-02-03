# Windows Setup Fix

## ⚠️ PowerShell Execution Policy Issue

If you see "running scripts is disabled" error, fix it:

### Option 1: Enable for Current Session (Recommended)
Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option 2: Use CMD Instead
Open Command Prompt (cmd.exe) instead of PowerShell and run:
```cmd
cd frontend
npm install
```

### Option 3: Bypass for Single Command
```powershell
powershell -ExecutionPolicy Bypass -Command "npm install"
```

---

After fixing the execution policy:

```bash
cd frontend
npm install
npm run dev
```

Then in another terminal:
```bash
cd backend
uvicorn main:app --reload
```
