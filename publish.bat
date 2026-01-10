@echo off
echo Building library...
call npm run build:lib
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
echo Publishing package...
cd dist\ngx-data-mapper
call npm publish --access public
if %errorlevel% neq 0 (
    echo Publish failed!
    exit /b %errorlevel%
)

echo.
echo Successfully published!
cd ..\..
