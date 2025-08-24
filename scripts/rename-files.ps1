# Script para renombrar archivos que contengan nombres en español

Write-Host "Renombrado de archivos - Espanol a Ingles" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Diccionario de nombres de archivos (español -> inglés)
$fileRenames = @{
    # Entidades
    'ambiente.entity.ts' = 'environment.entity.ts'
    'carga.entity.ts' = 'load.entity.ts'
    'consumo.entity.ts' = 'consumption.entity.ts'
    'superficie.entity.ts' = 'surface.entity.ts'
    'circuito.entity.ts' = 'circuit.entity.ts'
    'alimentador.entity.ts' = 'feeder.entity.ts'
    'puesta-tierra.entity.ts' = 'grounding.entity.ts'
    'tipo-ambiente.entity.ts' = 'environment-type.entity.ts'
    'tipo-artefacto.entity.ts' = 'artifact-type.entity.ts'
    'tipo-instalacion.entity.ts' = 'installation-type.entity.ts'
    
    # Servicios
    'ambiente.service.ts' = 'environment.service.ts'
    'carga.service.ts' = 'load.service.ts'
    'consumo.service.ts' = 'consumption.service.ts'
    'circuito.service.ts' = 'circuit.service.ts'
    'alimentador.service.ts' = 'feeder.service.ts'
    'puesta-tierra.service.ts' = 'grounding.service.ts'
    'tipo-ambiente.service.ts' = 'environment-type.service.ts'
    'tipo-artefacto.service.ts' = 'artifact-type.service.ts'
    'tipo-instalacion.service.ts' = 'installation-type.service.ts'
    
    # Controladores
    'ambiente.controller.ts' = 'environment.controller.ts'
    'carga.controller.ts' = 'load.controller.ts'
    'consumo.controller.ts' = 'consumption.controller.ts'
    'circuito.controller.ts' = 'circuit.controller.ts'
    'alimentador.controller.ts' = 'feeder.controller.ts'
    'puesta-tierra.controller.ts' = 'grounding.controller.ts'
    'tipo-ambiente.controller.ts' = 'environment-type.controller.ts'
    'tipo-artefacto.controller.ts' = 'artifact-type.controller.ts'
    'tipo-instalacion.controller.ts' = 'installation-type.controller.ts'
    
    # Módulos
    'ambiente.module.ts' = 'environment.module.ts'
    'carga.module.ts' = 'load.module.ts'
    'consumo.module.ts' = 'consumption.module.ts'
    'circuito.module.ts' = 'circuit.module.ts'
    'alimentador.module.ts' = 'feeder.module.ts'
    'puesta-tierra.module.ts' = 'grounding.module.ts'
    'tipo-ambiente.module.ts' = 'environment-type.module.ts'
    'tipo-artefacto.module.ts' = 'artifact-type.module.ts'
    'tipo-instalacion.module.ts' = 'installation-type.module.ts'
    
    # DTOs
    'ambiente.dto.ts' = 'environment.dto.ts'
    'carga.dto.ts' = 'load.dto.ts'
    'consumo.dto.ts' = 'consumption.dto.ts'
    'superficie.dto.ts' = 'surface.dto.ts'
    'circuito.dto.ts' = 'circuit.dto.ts'
    'alimentador.dto.ts' = 'feeder.dto.ts'
    'puesta-tierra.dto.ts' = 'grounding.dto.ts'
    'create-tipo-ambiente.dto.ts' = 'create-environment-type.dto.ts'
    'update-tipo-ambiente.dto.ts' = 'update-environment-type.dto.ts'
    'create-tipo-artefacto.dto.ts' = 'create-artifact-type.dto.ts'
    'update-tipo-artefacto.dto.ts' = 'update-artifact-type.dto.ts'
    'create-tipo-instalacion.dto.ts' = 'create-installation-type.dto.ts'
    'update-tipo-instalacion.dto.ts' = 'update-installation-type.dto.ts'
    
    # Tests
    'ambiente.controller.spec.ts' = 'environment.controller.spec.ts'
    'carga.controller.spec.ts' = 'load.controller.spec.ts'
    'consumo.controller.spec.ts' = 'consumption.controller.spec.ts'
    'circuito.controller.spec.ts' = 'circuit.controller.spec.ts'
    'alimentador.controller.spec.ts' = 'feeder.controller.spec.ts'
    'puesta-tierra.controller.spec.ts' = 'grounding.controller.spec.ts'
    'tipo-ambiente.controller.spec.ts' = 'environment-type.controller.spec.ts'
    'tipo-artefacto.controller.spec.ts' = 'artifact-type.controller.spec.ts'
    'tipo-instalacion.controller.spec.ts' = 'installation-type.controller.spec.ts'
    
    'ambiente.service.spec.ts' = 'environment.service.spec.ts'
    'carga.service.spec.ts' = 'load.service.spec.ts'
    'consumo.service.spec.ts' = 'consumption.service.spec.ts'
    'circuito.service.spec.ts' = 'circuit.service.spec.ts'
    'alimentador.service.spec.ts' = 'feeder.service.spec.ts'
    'puesta-tierra.service.spec.ts' = 'grounding.service.spec.ts'
    'tipo-ambiente.service.spec.ts' = 'environment-type.service.spec.ts'
    'tipo-artefacto.service.spec.ts' = 'artifact-type.service.spec.ts'
    'tipo-instalacion.service.spec.ts' = 'installation-type.service.spec.ts'
    
    # E2E Tests
    'calc-ambientes.e2e-spec.ts' = 'calc-environments.e2e-spec.ts'
    'calc-cargas.e2e-spec.ts' = 'calc-loads.e2e-spec.ts'
    'calc-consumos.e2e-spec.ts' = 'calc-consumptions.e2e-spec.ts'
    'calc-superficies.e2e-spec.ts' = 'calc-surfaces.e2e-spec.ts'
    'calc-circuitos.e2e-spec.ts' = 'calc-circuits.e2e-spec.ts'
    'calc-alimentadores.e2e-spec.ts' = 'calc-feeders.e2e-spec.ts'
    'calc-puesta-tierra.e2e-spec.ts' = 'calc-grounding.e2e-spec.ts'
    
    # Seeds
    'TiposAmbientes.json' = 'EnvironmentTypes.json'
    'TiposArtefactos.json' = 'ArtifactTypes.json'
    'TiposInstalaciones.json' = 'InstallationTypes.json'
    'FactoresDemanda.json' = 'DemandFactors.json'
    'ReglasPuestaTierra.json' = 'GroundingRules.json'
    'NormasConstantes.json' = 'NormConstants.json'
    
    # Migraciones
    'CreateAmbientes.ts' = 'CreateEnvironments.ts'
    'CreateCargas.ts' = 'CreateLoads.ts'
    'CreateConsumos.ts' = 'CreateConsumptions.ts'
    'CreateSuperficies.ts' = 'CreateSurfaces.ts'
    'CreateCircuitos.ts' = 'CreateCircuits.ts'
    'CreateAlimentadores.ts' = 'CreateFeeders.ts'
    'CreatePuestaTierra.ts' = 'CreateGrounding.ts'
    'CreateTiposAmbientes.ts' = 'CreateEnvironmentTypes.ts'
    'CreateTiposArtefactos.ts' = 'CreateArtifactTypes.ts'
    'CreateTiposInstalaciones.ts' = 'CreateInstallationTypes.ts'
    'CreateFactoresDemanda.ts' = 'CreateDemandFactors.ts'
    'CreateReglasPuestaTierra.ts' = 'CreateGroundingRules.ts'
    'CreateNormasConstantes.ts' = 'CreateNormConstants.ts'
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
    
    # Buscar archivos que contengan referencias al nombre antiguo
    $files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.js", "*.json", "*.yml", "*.yaml" | Where-Object { $_.FullName -notmatch '\.backup$' }
    
    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $originalContent = $content
            
            # Reemplazar referencias al archivo
            $content = $content -replace [regex]::Escape($OldName), $NewName
            
            # Si el contenido cambió, escribir el archivo
            if ($content -ne $originalContent) {
                Set-Content $file.FullName $content -Encoding UTF8
                Write-Host "Referencias actualizadas en: $($file.FullName)" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "Error actualizando referencias en $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Función para renombrar archivos
function Rename-Files {
    Write-Host "Iniciando renombrado de archivos..." -ForegroundColor Green
    
    $renamedCount = 0
    $errorCount = 0
    
    foreach ($oldName in $fileRenames.Keys) {
        $newName = $fileRenames[$oldName]
        
        # Buscar archivos con el nombre antiguo
        $files = Get-ChildItem -Path "." -Recurse -Filter $oldName | Where-Object { $_.FullName -notmatch '\.backup$' }
        
        foreach ($file in $files) {
            try {
                Write-Host "Renombrando: $($file.Name) -> $newName" -ForegroundColor Yellow
                
                # Crear backup
                Backup-File $file.FullName
                
                # Construir nueva ruta
                $newPath = Join-Path $file.Directory.FullName $newName
                
                # Renombrar archivo
                Move-Item $file.FullName $newPath
                
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
    
    foreach ($oldName in $fileRenames.Keys) {
        $newName = $fileRenames[$oldName]
        
        # Buscar archivos con el nombre nuevo
        $files = Get-ChildItem -Path "." -Recurse -Filter $newName | Where-Object { $_.FullName -notmatch '\.backup$' }
        
        foreach ($file in $files) {
            try {
                # Construir ruta original
                $originalPath = Join-Path $file.Directory.FullName $oldName
                
                # Renombrar de vuelta
                Move-Item $file.FullName $originalPath
                
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
