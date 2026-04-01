$ErrorActionPreference = "Stop"

function Assert-CommandAvailable {
    param([string]$Command)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Command. Ensure it is installed and on PATH."
    }
}

function Load-EnvFile {
    param([string]$EnvPath)
    if (-not (Test-Path $EnvPath)) {
        Write-Host "[WARN] .env not found at $EnvPath"
        return
    }

    Get-Content $EnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
        $idx = $line.IndexOf("=")
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        if (-not [string]::IsNullOrWhiteSpace($key)) {
            if (-not (Test-Path "env:$key")) {
                Set-Item -Path "env:$key" -Value $val
            }
        }
    }
}

Assert-CommandAvailable "java"

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = Join-Path $backendRoot "src\main\java"
$buildDir = Join-Path $backendRoot "build"
$libDir = Join-Path $backendRoot "lib"

# Load environment variables from backend/.env
$envFile = Join-Path $backendRoot ".env"
Load-EnvFile $envFile

# Ensure required runtime envs are set
if (-not $env:HOST) { $env:HOST = "127.0.0.1" }
if (-not $env:PORT) { $env:PORT = "5000" }
if (-not $env:BACKEND_BASE_DIR) { $env:BACKEND_BASE_DIR = $backendRoot }
if (-not $env:DATA_DIR) { $env:DATA_DIR = Join-Path $backendRoot "data" }
if (-not $env:LOG_FILE) { $env:LOG_FILE = Join-Path $backendRoot "logs\app.log" }

# Collect Java sources
$sources = Get-ChildItem -Path $srcDir -Recurse -Filter *.java | ForEach-Object { $_.FullName }
if ($sources.Count -eq 0) {
    throw "No Java sources found under $srcDir"
}

function Ensure-DependencyJars {
    param([string]$LibDir)

    New-Item -ItemType Directory -Force -Path $LibDir | Out-Null

    $deps = @(
        @{ name = "mongodb-driver-sync-4.11.2.jar"; url = "https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-sync/4.11.2/mongodb-driver-sync-4.11.2.jar" },
        @{ name = "mongodb-driver-core-4.11.2.jar"; url = "https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-core/4.11.2/mongodb-driver-core-4.11.2.jar" },
        @{ name = "bson-4.11.2.jar"; url = "https://repo1.maven.org/maven2/org/mongodb/bson/4.11.2/bson-4.11.2.jar" },
        @{ name = "jbcrypt-0.4.jar"; url = "https://repo1.maven.org/maven2/org/mindrot/jbcrypt/0.4/jbcrypt-0.4.jar" },
        @{ name = "jackson-databind-2.17.2.jar"; url = "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.17.2/jackson-databind-2.17.2.jar" },
        @{ name = "jackson-core-2.17.2.jar"; url = "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.17.2/jackson-core-2.17.2.jar" },
        @{ name = "jackson-annotations-2.17.2.jar"; url = "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.17.2/jackson-annotations-2.17.2.jar" }
    )

    foreach ($dep in $deps) {
        $target = Join-Path $LibDir $dep.name
        if (-not (Test-Path $target)) {
            Write-Host "[JAVA] Downloading $($dep.name)..."
            Invoke-WebRequest -Uri $dep.url -OutFile $target
        }
    }
}

$gradleWrapper = Join-Path $backendRoot "gradlew.bat"
if (Test-Path $gradleWrapper) {
    Write-Host "[JAVA] Building backend with Gradle wrapper..."
    & $gradleWrapper shadowJar --no-daemon

    $jarOut = Join-Path $buildDir "libs\sentra-backend-dev.jar"
    if (-not (Test-Path $jarOut)) {
        throw "Build succeeded but jar not found at $jarOut"
    }

    Write-Host "[JAVA] Starting backend..."
    & java -jar $jarOut
    return
}

if (Get-Command gradle -ErrorAction SilentlyContinue) {
    Write-Host "[JAVA] Building backend with Gradle..."
    & gradle shadowJar --no-daemon

    $jarOut = Join-Path $buildDir "libs\sentra-backend-dev.jar"
    if (-not (Test-Path $jarOut)) {
        throw "Build succeeded but jar not found at $jarOut"
    }

    Write-Host "[JAVA] Starting backend..."
    & java -jar $jarOut
    return
}

Assert-CommandAvailable "javac"

Write-Host "[JAVA] Gradle not found. Falling back to direct javac build with downloaded dependencies."
Ensure-DependencyJars -LibDir $libDir

$buildClassesDir = Join-Path $backendRoot "build\classes"
New-Item -ItemType Directory -Force -Path $buildClassesDir | Out-Null
$sourcesFile = Join-Path $buildClassesDir "sources.txt"
Set-Content -Path $sourcesFile -Value $sources

$compileCp = "$libDir\*"
$runCp = "$buildClassesDir;$libDir\*"

Write-Host "[JAVA] Compiling backend sources..."
& javac -encoding UTF-8 -d $buildClassesDir -cp $compileCp "@${sourcesFile}"

Write-Host "[JAVA] Starting backend..."
& java -cp $runCp com.sentra.backend.Main
