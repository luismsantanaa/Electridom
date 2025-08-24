# Script para corregir referencias restantes

Write-Host "Corrigiendo referencias restantes..." -ForegroundColor Cyan

# Función para hacer backup de un archivo
function Backup-File {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $backupPath = "$FilePath.backup"
        Copy-Item $FilePath $backupPath
    }
}

# Función para corregir referencias
function Fix-References {
    Write-Host "Iniciando corrección de referencias..." -ForegroundColor Green
    
    $fixedCount = 0
    
    # Archivos específicos que necesitan corrección
    $filesToFix = @(
        "src/app.module.ts",
        "src/database/seeds/seeds.module.ts",
        "src/database/seeds/seeds.service.ts",
        "src/modules/ambientes/entities/environment.entity.ts",
        "src/modules/cargas/entities/loads.entity.ts",
        "src/modules/tipos-artefactos/tipos-artifacts.controller.ts",
        "src/modules/tipos-artefactos/tipos-artifacts.module.ts",
        "src/modules/tipos-artefactos/tipos-artifacts.service.ts",
        "src/modules/tipos-artefactos/dtos/update-type-artifact.dto.ts"
    )
    
    foreach ($filePath in $filesToFix) {
        if (Test-Path $filePath) {
            try {
                $content = Get-Content $filePath -Raw -Encoding UTF8 -ErrorAction Stop
                $originalContent = $content
                $fileModified = $false
                
                # Correcciones específicas
                $content = $content -replace './modules/tipos-installations/tipos-installations.module', './modules/tipos-instalaciones/tipos-installations.module'
                $content = $content -replace './modules/tipos-environments/tipos-environments.module', './modules/tipos-ambientes/tipos-environments.module'
                $content = $content -replace './modules/tipos-artefactos/tipos-artefactos.module', './modules/tipos-artefactos/tipos-artifacts.module'
                $content = $content -replace './modules/environments/environment.module', './modules/ambientes/environment.module'
                $content = $content -replace './modules/loads/loads.module', './modules/cargas/loads.module'
                
                $content = $content -replace '../../modules/tipos-installations/entities/type-installation.entity', '../../modules/tipos-instalaciones/entities/type-installation.entity'
                $content = $content -replace '../../modules/tipos-environments/entities/type-environment.entity', '../../modules/tipos-ambientes/entities/type-environment.entity'
                $content = $content -replace '../../modules/tipos-artefactos/entities/type-artefacto.entity', '../../modules/tipos-artefactos/entities/type-artifact.entity'
                
                $content = $content -replace './tipos-artefactos.service', './tipos-artifacts.service'
                $content = $content -replace './tipos-artefactos.controller', './tipos-artifacts.controller'
                
                $content = $content -replace './create-type-artefacto.dto', './create-type-artifact.dto'
                $content = $content -replace './update-type-artefacto.dto', './update-type-artifact.dto'
                $content = $content -replace './dtos/create-type-artefacto.dto', './dtos/create-type-artifact.dto'
                $content = $content -replace './dtos/update-type-artefacto.dto', './dtos/update-type-artifact.dto'
                
                $content = $content -replace '../../tipos-environments/entities/type-environment.entity', '../../tipos-ambientes/entities/type-environment.entity'
                $content = $content -replace '../../tipos-artefactos/entities/type-artefacto.entity', '../../tipos-artefactos/entities/type-artifact.entity'
                
                # Si el contenido cambió, escribir el archivo
                if ($content -ne $originalContent) {
                    Backup-File $filePath
                    Set-Content $filePath $content -Encoding UTF8 -ErrorAction Stop
                    $fixedCount++
                    Write-Host "Archivo corregido: $filePath" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "Error procesando $filePath: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`nArchivos corregidos: $fixedCount" -ForegroundColor Green
}

# Ejecutar corrección
Fix-References
