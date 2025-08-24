# Script final para renombrar archivos que contengan nombres en español

Write-Host "Renombrado de archivos - Espanol a Ingles" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Diccionario de nombres de archivos (español -> inglés)
$fileRenames = @{
    'TiposAmbientes.json' = 'EnvironmentTypes.json'
    'TiposArtefactos.json' = 'ArtifactTypes.json'
    'TiposInstalaciones.json' = 'InstallationTypes.json'
    'FactoresDemanda.json' = 'DemandFactors.json'
    'ReglasPuestaTierra.json' = 'GroundingRules.json'
    'NormasConstantes.json' = 'NormConstants.json'
}

# Función para hacer backup de un archivo
function Backup-File {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $backupPath = "$FilePath.backup"
        Copy-Item $FilePath $backupPath
        Write-Host "Backup creado: $backupPath" -ForegroundColor Green
    }
}

# Función para restaurar backup
function Restore-Backup {
    param([string]$FilePath)
    $backupPath = "$FilePath.backup"
    if (Test-Path $backupPath) {
        Copy-Item $backupPath $FilePath -Force
        Remove-Item $backupPath
        Write-Host "Backup restaurado: $FilePath" -ForegroundColor Green
    }
}

# Función para actualizar referencias en archivos
function Update-References {
    param([string]$OldName, [string]$NewName)
    
    Write-Host "Actualizando referencias de $OldName a $NewName" -ForegroundColor Yellow
    
    # Directorios específicos para buscar referencias
    $searchDirectories = @(
        "calculadora-electrica-backend/src",
        "calculadora-electrica-backend/test",
        "calculadora-electrica-backend/scripts"
    )
    
    foreach ($dir in $searchDirectories) {
        if (-not (Test-Path $dir)) {
            continue
        }
        
        try {
            $files = Get-ChildItem -Path $dir -Recurse -Include "*.ts", "*.js", "*.json" | Where-Object { $_.FullName -notmatch 'node_modules' -and $_.FullName -notmatch '\.backup$' }
            
            foreach ($file in $files) {
                try {
                    $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction Stop
                    $originalContent = $content
                    
                    # Reemplazar referencias al archivo
                    $content = $content -replace [regex]::Escape($OldName), $NewName
                    
                    # Si el contenido cambió, escribir el archivo
                    if ($content -ne $originalContent) {
                        Set-Content $file.FullName $content -Encoding UTF8 -ErrorAction Stop
                        Write-Host "Referencias actualizadas en: $($file.FullName)" -ForegroundColor Green
                    }
                }
                catch {
                    Write-Host "Error procesando $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        catch {
            Write-Host "Error accediendo al directorio $dir - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Función para renombrar archivos
function Rename-Files {
    Write-Host "Iniciando renombrado de archivos..." -ForegroundColor Green
    
    $renamedCount = 0
    $errorCount = 0
    
    # Directorio específico para buscar archivos
    $searchDir = "calculadora-electrica-backend/src/database/seeds"
    
    if (-not (Test-Path $searchDir)) {
        Write-Host "Directorio no encontrado: $searchDir" -ForegroundColor Red
        return
    }
    
    foreach ($oldName in $fileRenames.Keys) {
        $newName = $fileRenames[$oldName]
        
        try {
            # Buscar archivos con el nombre antiguo
            $files = Get-ChildItem -Path $searchDir -Filter $oldName -ErrorAction Stop
            
            foreach ($file in $files) {
                try {
                    Write-Host "Renombrando: $($file.Name) -> $newName" -ForegroundColor Yellow
                    
                    # Crear backup
                    Backup-File $file.FullName
                    
                    # Construir nueva ruta
                    $newPath = Join-Path $file.Directory.FullName $newName
                    
                    # Verificar si el archivo destino ya existe
                    if (Test-Path $newPath) {
                        Write-Host "El archivo destino ya existe: $newPath" -ForegroundColor Red
                        $errorCount++
                        continue
                    }
                    
                    # Renombrar archivo
                    Move-Item $file.FullName $newPath -ErrorAction Stop
                    
                    # Actualizar referencias
                    Update-References $file.Name $newName
                    
                    $renamedCount++
                    Write-Host "Archivo renombrado exitosamente: $($file.FullName) -> $newPath" -ForegroundColor Green
                }
                catch {
                    Write-Host "Error renombrando $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
                    $errorCount++
                    
                    # Restaurar backup en caso de error
                    Restore-Backup $file.FullName
                }
            }
        }
        catch {
            Write-Host "Error accediendo al directorio $searchDir: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Resumen final
    Write-Host "`nResumen de renombrado:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "Archivos renombrados: $renamedCount" -ForegroundColor Green
    Write-Host "Errores: $errorCount" -ForegroundColor Red
    
    if ($renamedCount -gt 0) {
        Write-Host "`nRenombrado completado exitosamente!" -ForegroundColor Green
        Write-Host "Recuerda revisar los cambios antes de hacer commit" -ForegroundColor Yellow
    } else {
        Write-Host "`nNo se encontraron archivos para renombrar" -ForegroundColor Blue
    }
}

# Función para revertir cambios
function Revert-Renames {
    Write-Host "Revirtiendo renombrados..." -ForegroundColor Yellow
    
    $revertedCount = 0
    $searchDir = "calculadora-electrica-backend/src/database/seeds"
    
    foreach ($oldName in $fileRenames.Keys) {
        $newName = $fileRenames[$oldName]
        
        try {
            # Buscar archivos con el nombre nuevo
            $files = Get-ChildItem -Path $searchDir -Filter $newName -ErrorAction Stop
            
            foreach ($file in $files) {
                try {
                    # Construir ruta original
                    $originalPath = Join-Path $file.Directory.FullName $oldName
                    
                    # Verificar si el archivo original ya existe
                    if (Test-Path $originalPath) {
                        Write-Host "El archivo original ya existe: $originalPath" -ForegroundColor Red
                        continue
                    }
                    
                    # Renombrar de vuelta
                    Move-Item $file.FullName $originalPath -ErrorAction Stop
                    
                    # Actualizar referencias de vuelta
                    Update-References $newName $oldName
                    
                    $revertedCount++
                    Write-Host "Archivo revertido: $($file.FullName) -> $originalPath" -ForegroundColor Green
                }
                catch {
                    Write-Host "Error revirtiendo $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        catch {
            Write-Host "Error accediendo al directorio $searchDir: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "Revertidos $revertedCount archivos" -ForegroundColor Green
}

# Procesar argumentos
if ($args.Count -eq 0) {
    Rename-Files
} elseif ($args[0] -eq "-Revert") {
    Revert-Renames
} else {
    Write-Host "Argumento no valido. Use -Revert para revertir cambios." -ForegroundColor Red
}
