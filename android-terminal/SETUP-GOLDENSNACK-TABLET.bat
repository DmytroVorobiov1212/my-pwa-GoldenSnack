@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

title Golden Snack - Lenovo Production Terminal Setup

set "PACKAGE=cz.goldensnack.productionterminal"
set "ADMIN_COMPONENT=%PACKAGE%/.TerminalDeviceAdminReceiver"
set "APK_NAME=GoldenSnack-Terminal.apk"
set "SCRIPT_DIR=%~dp0"
set "APK_PATH=%SCRIPT_DIR%%APK_NAME%"
set "TMP_PREFIX=%TEMP%\goldensnack-tablet-%RANDOM%-%RANDOM%"

if not "%~1"=="" set "APK_PATH=%~f1"

cls
echo ============================================================
echo   GOLDEN SNACK - LENOVO PRODUCTION TERMINAL PROVISIONING
echo ============================================================
echo.
echo This script will:
echo   1. Detect exactly one Android tablet over ADB.
echo   2. Verify that Android has zero configured accounts.
echo   3. Install/update the signed Golden Snack APK.
echo   4. Verify the application package.
echo   5. Set Golden Snack as Android Device Owner.
echo   6. Launch Golden Snack Vyroba.
echo.
echo This script WILL NOT factory-reset the tablet.
echo Pairing code and Admin PIN remain manual on purpose.
echo.
choice /C YN /N /M "Continue? [Y/N]: "
if errorlevel 2 goto :cancelled

echo.
echo [1/7] Locating ADB...
if exist "%SCRIPT_DIR%adb.exe" (
    set "ADB=%SCRIPT_DIR%adb.exe"
) else (
    where adb >nul 2>&1
    if errorlevel 1 goto :no_adb
    for /f "delims=" %%A in ('where adb') do if not defined ADB set "ADB=%%A"
)
echo [OK] ADB: !ADB!

if not exist "%APK_PATH%" goto :no_apk
echo [OK] APK: %APK_PATH%

echo.
echo [2/7] Checking connected Android device...
"!ADB!" start-server >nul 2>&1
"!ADB!" devices > "%TMP_PREFIX%-devices.txt"

set /a DEVICE_COUNT=0
set "SERIAL="
for /f "usebackq tokens=1,2" %%A in ("%TMP_PREFIX%-devices.txt") do (
    if "%%B"=="device" (
        set /a DEVICE_COUNT+=1
        set "SERIAL=%%A"
    )
)

if !DEVICE_COUNT! EQU 0 goto :no_device
if !DEVICE_COUNT! GTR 1 goto :too_many_devices

echo [OK] Device serial: !SERIAL!

"!ADB!" -s "!SERIAL!" shell getprop ro.product.model > "%TMP_PREFIX%-model.txt" 2>nul
"!ADB!" -s "!SERIAL!" shell getprop ro.build.version.release > "%TMP_PREFIX%-android.txt" 2>nul
set "MODEL="
set "ANDROID_VERSION="
set /p MODEL=<"%TMP_PREFIX%-model.txt"
set /p ANDROID_VERSION=<"%TMP_PREFIX%-android.txt"
echo [OK] Model: !MODEL!
echo [OK] Android: !ANDROID_VERSION!
if not "!ANDROID_VERSION!"=="5.0.1" (
    echo [WARN] Expected Lenovo production tablets use Android 5.0.1.
    echo        Continuing because the device is connected and responsive.
)

echo.
echo [3/7] Safety check: Android accounts...
"!ADB!" -s "!SERIAL!" shell dumpsys account > "%TMP_PREFIX%-accounts.txt" 2>&1
findstr /C:"Accounts: 0" "%TMP_PREFIX%-accounts.txt" >nul 2>&1
if errorlevel 1 goto :accounts_present
echo [OK] Accounts: 0

echo.
echo [4/7] Installing signed Golden Snack APK...
"!ADB!" -s "!SERIAL!" install -r "%APK_PATH%" > "%TMP_PREFIX%-install.txt" 2>&1
findstr /I /C:"Success" "%TMP_PREFIX%-install.txt" >nul 2>&1
if errorlevel 1 goto :install_failed
echo [OK] APK installed successfully.

echo.
echo [5/7] Verifying package...
"!ADB!" -s "!SERIAL!" shell pm path %PACKAGE% > "%TMP_PREFIX%-package.txt" 2>&1
findstr /I /C:"package:" "%TMP_PREFIX%-package.txt" >nul 2>&1
if errorlevel 1 goto :package_missing
echo [OK] Package %PACKAGE% is installed.

echo.
echo [6/7] Configuring Android Device Owner...
"!ADB!" -s "!SERIAL!" shell dumpsys device_policy > "%TMP_PREFIX%-policy-before.txt" 2>&1
findstr /I /C:"%PACKAGE%" "%TMP_PREFIX%-policy-before.txt" >nul 2>&1
if not errorlevel 1 (
    findstr /I /C:"Device Owner" "%TMP_PREFIX%-policy-before.txt" >nul 2>&1
    if not errorlevel 1 (
        echo [OK] Golden Snack already appears in Device Owner policy. Skipping set-device-owner.
        goto :launch_app
    )
)

"!ADB!" -s "!SERIAL!" shell dpm set-device-owner %ADMIN_COMPONENT% > "%TMP_PREFIX%-dpm.txt" 2>&1
findstr /I /C:"Success: Device owner set" "%TMP_PREFIX%-dpm.txt" >nul 2>&1
if errorlevel 1 goto :device_owner_failed
echo [OK] Device Owner configured successfully.

:launch_app
echo.
echo [7/7] Launching Golden Snack Vyroba...
"!ADB!" -s "!SERIAL!" shell am force-stop %PACKAGE% >nul 2>&1
"!ADB!" -s "!SERIAL!" shell am start -n %PACKAGE%/.MainActivity > "%TMP_PREFIX%-launch.txt" 2>&1
if errorlevel 1 goto :launch_failed
echo [OK] Golden Snack launched.

echo.
echo ============================================================
echo   AUTOMATED SETUP COMPLETE
 echo ============================================================
echo.
echo Finish these steps on the tablet/admin panel:
echo.
echo   A. In Vyrobni terminaly create/select the real terminal
 echo      (for example Butler-02, Velteko-01, Masek-01).
echo   B. Generate a 6-digit pairing code and pair this Lenovo.
echo   C. Tap the TOP-LEFT corner 7 times within 5 seconds.
echo   D. Create the 6-digit Admin PIN. Do not share the PIN.
echo   E. After saving the PIN, kiosk/Lock Task should activate.
echo   F. Test Home, Recent Apps and Back - worker must not escape.
echo   G. Reboot the Lenovo once and verify auto-start + kiosk.
echo.
echo IMPORTANT: Never lose the Android signing keystore used for this APK.
echo Future APK updates must use the same signing key and adb install -r.
echo.
goto :success

:no_adb
echo.
echo [STOP] adb.exe was not found.
echo Put this BAT file into the platform-tools folder, or add ADB to PATH.
goto :failed

:no_apk
echo.
echo [STOP] %APK_NAME% was not found.
echo Expected: %APK_PATH%
echo.
echo Put %APK_NAME% next to this BAT file,
echo or drag the APK file onto this BAT file to run it.
goto :failed

:no_device
echo.
echo [STOP] No authorized Android device was detected.
echo.
type "%TMP_PREFIX%-devices.txt"
echo.
echo Enable USB debugging, reconnect USB, and accept the RSA prompt on Lenovo.
goto :failed

:too_many_devices
echo.
echo [STOP] More than one Android device is connected.
echo Disconnect all tablets except the one you are provisioning.
echo.
type "%TMP_PREFIX%-devices.txt"
goto :failed

:accounts_present
echo.
echo [STOP] Android does not report "Accounts: 0".
echo Device Owner must only be configured on a clean tablet with no accounts.
echo.
findstr /I /C:"Accounts:" "%TMP_PREFIX%-accounts.txt"
echo.
echo Remove Google/Lenovo accounts in Android Settings and run this script again.
echo Do NOT add a Google account during initial setup.
goto :failed

:install_failed
echo.
echo [STOP] APK installation failed.
echo ----- ADB OUTPUT -----
type "%TMP_PREFIX%-install.txt"
echo ----------------------
echo.
echo Do not uninstall the app if this tablet was already provisioned.
echo A signature/version problem must be fixed before continuing.
goto :failed

:package_missing
echo.
echo [STOP] APK reported success, but package verification failed.
echo ----- ADB OUTPUT -----
type "%TMP_PREFIX%-package.txt"
echo ----------------------
goto :failed

:device_owner_failed
echo.
echo [STOP] Device Owner configuration failed.
echo ----- DPM OUTPUT -----
type "%TMP_PREFIX%-dpm.txt"
echo ----------------------
echo.
echo Do not run random DPM commands. Fix the reported cause first.
goto :failed

:launch_failed
echo.
echo [STOP] Golden Snack could not be launched.
echo ----- ADB OUTPUT -----
type "%TMP_PREFIX%-launch.txt"
echo ----------------------
goto :failed

:cancelled
echo.
echo Setup cancelled. No changes were made by this script.
goto :cleanup

:success
echo Setup finished successfully.
goto :cleanup_pause

:failed
echo.
echo Setup stopped safely. Fix the item above and run the script again.

goto :cleanup_pause

:cleanup_pause
call :cleanup_files
pause
exit /b

:cleanup
call :cleanup_files
exit /b

:cleanup_files
del /q "%TMP_PREFIX%-devices.txt" 2>nul
del /q "%TMP_PREFIX%-model.txt" 2>nul
del /q "%TMP_PREFIX%-android.txt" 2>nul
del /q "%TMP_PREFIX%-accounts.txt" 2>nul
del /q "%TMP_PREFIX%-install.txt" 2>nul
del /q "%TMP_PREFIX%-package.txt" 2>nul
del /q "%TMP_PREFIX%-policy-before.txt" 2>nul
del /q "%TMP_PREFIX%-dpm.txt" 2>nul
del /q "%TMP_PREFIX%-launch.txt" 2>nul
exit /b
