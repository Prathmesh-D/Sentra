$ErrorActionPreference = "Stop"

# Load .env from backend folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = if (Test-Path (Join-Path $scriptDir "backend")) { Join-Path $scriptDir "backend" } else { $scriptDir }
$envFile = Join-Path $backendDir ".env"

$mongoUri = $null
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^MONGO_URI\s*=\s*(.+)$') {
            $mongoUri = $Matches[1].Trim()
        }
    }
}
if (-not $mongoUri) { $mongoUri = $env:MONGO_URI }
if (-not $mongoUri) {
    Write-Host "[ERROR] MONGO_URI not found in .env or environment." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== MongoDB Atlas Wake-Up Ping ===" -ForegroundColor Cyan
Write-Host "[INFO] Sending ping to database cluster..." -ForegroundColor Yellow

# Build classpath from backend/lib jars
$libDir = Join-Path $backendDir "lib"
$jars = (Get-ChildItem -Path $libDir -Filter *.jar | ForEach-Object { $_.FullName }) -join ";"

# Create temp Java source that pings the DB
$tempDir = Join-Path $env:TEMP "sentra-dbping"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$javaSource = @"
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class DbPing {
    public static void main(String[] args) {
        String uri = args[0];
        String masked = uri.substring(0, Math.min(uri.length(), 30)) + "...";
        System.out.println("[INFO] Connecting to: " + masked);
        try (MongoClient client = MongoClients.create(uri)) {
            MongoDatabase db = client.getDatabase("admin");
            Document result = db.runCommand(new Document("ping", 1));
            System.out.println("[OK]   Ping response: " + result.toJson());
            System.out.println("[OK]   Database cluster is ACTIVE and responding.");
        } catch (Exception e) {
            System.out.println("[WARN] " + e.getMessage());
            System.out.println("[INFO] If the cluster was paused, Atlas is now resuming it.");
            System.out.println("[INFO] Wait 1-2 minutes and run this script again.");
            System.exit(1);
        }
    }
}
"@

$sourceFile = Join-Path $tempDir "DbPing.java"
[System.IO.File]::WriteAllText($sourceFile, $javaSource, (New-Object System.Text.UTF8Encoding $false))

# Compile
Write-Host "[INFO] Compiling ping utility..." -ForegroundColor Gray
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Java not found on PATH." -ForegroundColor Red
    exit 1
}
$compileOut = & javac -cp $jars -d $tempDir $sourceFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed." -ForegroundColor Red
    exit 1
}

# Run
& java -cp "$tempDir;$jars" DbPing $mongoUri

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
