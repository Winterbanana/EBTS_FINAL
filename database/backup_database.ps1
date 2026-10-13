param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    [string]$MySqlBinDirectory = 'C:\xampp\mysql\bin'
)

$dumpExecutable = Join-Path $MySqlBinDirectory 'mysqldump.exe'
if (-not (Test-Path -LiteralPath $dumpExecutable -PathType Leaf)) {
    throw "mysqldump.exe was not found at '$dumpExecutable'. Start XAMPP or provide -MySqlBinDirectory."
}

$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($resolvedOutputPath)
if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    throw "The output directory does not exist: '$outputDirectory'."
}
if (Test-Path -LiteralPath $resolvedOutputPath) {
    throw "Refusing to overwrite the existing backup '$resolvedOutputPath'. Choose a new path."
}

try {
    & $dumpExecutable `
        '--host=127.0.0.1' `
        '--user=root' `
        '--default-character-set=utf8mb4' `
        '--single-transaction' `
        '--routines' `
        '--events' `
        '--triggers' `
        '--hex-blob' `
        '--databases' `
        'wcc_equipment_system' `
        "--result-file=$resolvedOutputPath"

    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump failed with exit code $LASTEXITCODE."
    }

    $backup = Get-Item -LiteralPath $resolvedOutputPath
    if ($backup.Length -eq 0) {
        throw 'mysqldump produced an empty backup file.'
    }

    Write-Output "Database backup saved to: $($backup.FullName)"
    Write-Output "Backup size: $($backup.Length) bytes"
} catch {
    if (Test-Path -LiteralPath $resolvedOutputPath) {
        Remove-Item -LiteralPath $resolvedOutputPath -Force
    }
    throw
}
