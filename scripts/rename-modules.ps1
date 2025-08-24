# Script para renombrar módulos y archivos específicos

Write-Host "Renombrado de modulos - Espanol a Ingles" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Diccionario de directorios y archivos a renombrar
$renames = @{
    # Directorios de módulos
    'ambientes' = 'environments'
    'cargas' = 'loads'
    'tipos-ambientes' = 'tipos-environments'
    'tipos-artefactos' = 'tipos-artifacts'
    'tipos-instalaciones' = 'tipos-installations'
    
    # Archivos específicos
    'ambiente.controller.ts' = 'environment.controller.ts'
    'ambiente.service.ts' = 'environment.service.ts'
    'ambiente.module.ts' = 'environment.module.ts'
    'ambiente.entity.ts' = 'environment.entity.ts'
    'create-ambiente.dto.ts' = 'create-environment.dto.ts'
    'update-ambiente.dto.ts' = 'update-environment.dto.ts'
    
    'cargas.controller.ts' = 'loads.controller.ts'
    'cargas.service.ts' = 'loads.service.ts'
    'cargas.module.ts' = 'loads.module.ts'
    'cargas.entity.ts' = 'loads.entity.ts'
    'create-carga.dto.ts' = 'create-load.dto.ts'
    'update-carga.dto.ts' = 'update-load.dto.ts'
    
    'tipos-ambientes.controller.ts' = 'tipos-environments.controller.ts'
    'tipos-ambientes.service.ts' = 'tipos-environments.service.ts'
    'tipos-ambientes.module.ts' = 'tipos-environments.module.ts'
    'tipo-ambiente.entity.ts' = 'type-environment.entity.ts'
    'create-tipo-ambiente.dto.ts' = 'create-type-environment.dto.ts'
    'update-tipo-ambiente.dto.ts' = 'update-type-environment.dto.ts'
    
    'tipos-artefactos.controller.ts' = 'tipos-artifacts.controller.ts'
    'tipos-artefactos.service.ts' = 'tipos-artifacts.service.ts'
    'tipos-artefactos.module.ts' = 'tipos-artifacts.module.ts'
    'tipo-artefacto.entity.ts' = 'type-artifact.entity.ts'
    'create-tipo-artefacto.dto.ts' = 'create-type-artifact.dto.ts'
    'update-tipo-artefacto.dto.ts' = 'update-type-artifact.dto.ts'
    
    'tipos-instalaciones.controller.ts' = 'tipos-installations.controller.ts'
    'tipos-instalaciones.service.ts' = 'tipos-installations.service.ts'
    'tipos-instalaciones.module.ts' = 'tipos-installations.module.ts'
    'tipo-instalacion.entity.ts' = 'type-installation.entity.ts'
    'create-tipo-instalacion.dto.ts' = 'create-type-installation.dto.ts'
    'update-tipo-instalacion.dto.ts' = 'update-type-installation.dto.ts'
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

# Función para actualizar referencias en archivos
function Update-References {
    param([string]$OldName, [string]$NewName)
    
    Write-Host "Actualizando referencias de $OldName a $NewName" -ForegroundColor Yellow
    
    $searchDirectories = @(
        "calculadora-electrica-backend/src",
        "calculadora-electrica-backend/test"
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
                    Write-Host "Error procesando $($file.FullName)" -ForegroundColor Red
                }
            }
        }
        catch {
            Write-Host "Error accediendo al directorio $dir" -ForegroundColor Red
        }
    }
}

# Función para renombrar archivos
function Rename-Files {
    Write-Host "Iniciando renombrado de archivos..." -ForegroundColor Green
    
    $renamedCount = 0
    $errorCount = 0
    
    $modulesDir = "calculadora-electrica-backend/src/modules"
    
    if (-not (Test-Path $modulesDir)) {
        Write-Host "Directorio de modulos no encontrado: $modulesDir" -ForegroundColor Red
        return
    }
    
    foreach ($oldName in $renames.Keys) {
        $newName = $renames[$oldName]
        
        # Buscar archivos con el nombre antiguo
        $files = Get-ChildItem -Path $modulesDir -Recurse -Filter $oldName -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\.backup$' }
        
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
            }
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

# Ejecutar renombrado
Rename-Files
