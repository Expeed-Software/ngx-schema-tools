@echo off
echo Building library...
call npm run build:lib
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo.
echo Logging into npm...
call npm login
if %errorlevel% neq 0 (
    echo npm login failed!
    exit /b %errorlevel%
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
