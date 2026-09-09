@echo off
REM ============================================================
REM  تشغيل متجر محمود علي لوكال - سكريبت اعداد لمرة واحدة
REM  بينسخ ملف المفاتيح + بينزل الحزم + بيشغل السيرفر
REM ============================================================
cd /d "D:\mahmoud-ali-store"

echo ==== [1/3] Copying Supabase .env.local ====
if exist ".env.local" (
  echo .env.local already exists - skipping copy
) else (
  copy "C:\Users\DELL\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\Claude-3p\local-agent-mode-sessions\1d639894\00000000\3e8758b8\outputs\mahmoud-ali-store\.env.local" ".env.local"
)
if not exist ".env.local" (
  echo.
  echo [ERROR] .env.local not found. Tell Claude and he will create it.
  pause
  exit /b 1
)

echo.
echo ==== [2/3] Installing packages ^(1-2 min, first time only^) ====
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] npm install failed. Copy the message above and send it to Claude.
  pause
  exit /b 1
)

echo.
echo ==== [3/3] Starting local server ====
echo Open the http://localhost URL printed below in your browser.
echo Press Ctrl+C here to stop the server.
echo.
call npm run dev
