# GitHub Secrets Configuration

To enable automated releases, you need to add the following secrets to your GitHub repository.

## How to Add Secrets

1. Go to your repository: https://github.com/Prathmesh-D/Sentra
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

## Required Secrets

### 1. MONGO_URI
**Value:** Your MongoDB Atlas connection string
```
mongodb+srv://SentraAdmin:L1i1OunmTvpcolAM@sentraauth.onrz4g3.mongodb.net/sentra?retryWrites=true&w=majority&appName=SentraAuth
```

### 2. SECRET_KEY
**Value:** A secure random string for Flask sessions
```
sentra-production-secret-key-2025-v1
```
*(You can generate a new one with: `python -c "import secrets; print(secrets.token_hex(32))")*

### 3. JWT_SECRET_KEY
**Value:** A secure random string for JWT tokens
```
sentra-jwt-production-key-2025-v1
```
*(You can generate a new one with: `python -c "import secrets; print(secrets.token_hex(32))")*

## Quick Setup Steps

1. **Add MONGO_URI**
   - Name: `MONGO_URI`
   - Secret: `mongodb+srv://SentraAdmin:L1i1OunmTvpcolAM@sentraauth.onrz4g3.mongodb.net/sentra?retryWrites=true&w=majority&appName=SentraAuth`

2. **Add SECRET_KEY**
   - Name: `SECRET_KEY`
   - Secret: `sentra-production-secret-key-2025-v1`

3. **Add JWT_SECRET_KEY**
   - Name: `JWT_SECRET_KEY`
   - Secret: `sentra-jwt-production-key-2025-v1`

## Security Notes

⚠️ **IMPORTANT:** 
- Never commit these values to Git
- Use strong, randomly generated keys for production
- The MongoDB URI contains your database password - keep it secret!
- The secrets in GitHub Actions are encrypted and secure

## After Adding Secrets

Once all secrets are added:
1. Commit and push the updated workflow file
2. Create a new release tag: `git tag v1.0.14 -m "Release with CI secrets" && git push origin v1.0.14`
3. The GitHub Actions workflow will use these secrets to build the release

## Verify Secrets Are Set

You can check if secrets are configured (but not their values) in:
**Settings → Secrets and variables → Actions → Repository secrets**

You should see:
- ✅ MONGO_URI
- ✅ SECRET_KEY
- ✅ JWT_SECRET_KEY
