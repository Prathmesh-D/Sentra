@echo off
echo Creating a new release for Sentra Crypto
echo.
echo Example release notes:
echo "Initial release with full encryption features"
echo "Bug fixes and performance improvements"
echo "New feature: auto-delete files"
echo.

set /p VERSION="Enter version number (e.g., 1.0.1): "
set /p NOTES="Enter release notes: "

echo.
echo Creating git tag v%VERSION%...
git tag -a v%VERSION% -m "%NOTES%"

echo.
echo Pushing tag to GitHub...
git push origin v%VERSION%

echo.
echo Release created! GitHub Actions will automatically:
echo - Build the Electron app
echo - Create installers
echo - Upload to GitHub Releases
echo - Enable auto-updates for users
echo.
echo Check your GitHub repository's Actions tab for build progress.