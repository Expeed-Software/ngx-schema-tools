@echo off
setlocal

if "%~1"=="" (
    echo Usage: publish.bat ^<library-name^>
    echo.
    echo Available libraries:
    echo   ngx-data-mapper
    echo   ngx-schema-editor
    echo   ngx-dyna-form
    exit /b 1
)

set LIBRARY=%~1

if not exist "projects\%LIBRARY%" (
    echo Error: Library '%LIBRARY%' not found in projects folder.
    echo.
    echo Available libraries:
    echo   ngx-data-mapper
    echo   ngx-schema-editor
    echo   ngx-dyna-form
    exit /b 1
)

echo Building %LIBRARY%...
call ng build %LIBRARY%
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo.
echo Checking npm login status...
call npm whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Not logged in. Logging into npm...
    call npm login
    if %errorlevel% neq 0 (
        echo npm login failed!
        exit /b %errorlevel%
    )
) else (
    for /f %%i in ('npm whoami') do echo Logged in as: %%i
)

echo.
echo Publishing %LIBRARY%...
cd dist\%LIBRARY%
call npm publish --access public
if %errorlevel% neq 0 (
    echo Publish failed!
    cd ..\..
    exit /b %errorlevel%
)

echo.
echo Successfully published %LIBRARY%!
cd ..\..
endlocal
