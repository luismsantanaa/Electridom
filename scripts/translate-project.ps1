# Script principal para traducir todo el proyecto del español al inglés
# Este script ejecuta tanto la traducción de contenido como el renombrado de archivos

Write-Host "🌐 Traducción Completa del Proyecto - Español a Inglés" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Función para mostrar el menú principal
function Show-MainMenu {
    Write-Host "`n📋 Opciones disponibles:" -ForegroundColor Yellow
    Write-Host "1. Traducir contenido (nombres, variables, constantes)" -ForegroundColor White
    Write-Host "2. Renombrar archivos (entidades, servicios, controladores)" -ForegroundColor White
    Write-Host "3. Traducción completa (contenido + archivos)" -ForegroundColor White
    Write-Host "4. Revertir todos los cambios" -ForegroundColor White
    Write-Host "5. Verificar estado actual" -ForegroundColor White
    Write-Host "6. Ayuda" -ForegroundColor White
    Write-Host "0. Salir" -ForegroundColor White
}

# Función para traducir contenido
function Start-ContentTranslation {
    Write-Host "`n🔍 Iniciando traducción de contenido..." -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    # Ejecutar script de traducción de contenido
    $scriptPath = Join-Path $PSScriptRoot "translate-to-english.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath
    } else {
        Write-Host "❌ No se encontró el script translate-to-english.ps1" -ForegroundColor Red
    }
}

# Función para renombrar archivos
function Start-FileRenaming {
    Write-Host "`n🔄 Iniciando renombrado de archivos..." -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    
    # Ejecutar script de renombrado
    $scriptPath = Join-Path $PSScriptRoot "rename-files.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath
    } else {
        Write-Host "❌ No se encontró el script rename-files.ps1" -ForegroundColor Red
    }
}

# Función para traducción completa
function Start-CompleteTranslation {
    Write-Host "`n🚀 Iniciando traducción completa del proyecto..." -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    
    Write-Host "`n⚠️  ADVERTENCIA: Esta operación modificará archivos del proyecto." -ForegroundColor Red
    Write-Host "Se crearán backups automáticamente, pero se recomienda hacer commit antes." -ForegroundColor Yellow
    Write-Host "`n¿Deseas continuar? (y/N)" -ForegroundColor Red
    $response = Read-Host
    
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        return
    }
    
    # Paso 1: Traducir contenido
    Write-Host "`n📝 Paso 1: Traduciendo contenido..." -ForegroundColor Cyan
    Start-ContentTranslation
    
    # Paso 2: Renombrar archivos
    Write-Host "`n📁 Paso 2: Renombrando archivos..." -ForegroundColor Cyan
    Start-FileRenaming
    
    Write-Host "`n✅ Traducción completa finalizada!" -ForegroundColor Green
    Write-Host "📝 Recuerda revisar los cambios y hacer commit" -ForegroundColor Yellow
}

# Función para revertir cambios
function Revert-AllChanges {
    Write-Host "`n🔄 Revirtiendo todos los cambios..." -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    Write-Host "⚠️  ¿Estás seguro de que quieres revertir todos los cambios? (y/N)" -ForegroundColor Red
    $response = Read-Host
    
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        return
    }
    
    # Revertir traducción de contenido
    Write-Host "`n📝 Revirtiendo traducción de contenido..." -ForegroundColor Cyan
    $scriptPath = Join-Path $PSScriptRoot "translate-to-english.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Revert
    }
    
    # Revertir renombrado de archivos
    Write-Host "`n📁 Revirtiendo renombrado de archivos..." -ForegroundColor Cyan
    $scriptPath = Join-Path $PSScriptRoot "rename-files.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath -Revert
    }
    
    Write-Host "`n✅ Todos los cambios han sido revertidos!" -ForegroundColor Green
}

# Función para verificar estado
function Check-ProjectStatus {
    Write-Host "`n🔍 Verificando estado del proyecto..." -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    
    # Verificar archivos de backup
    $backupFiles = Get-ChildItem -Path "." -Recurse -Filter "*.backup"
    if ($backupFiles.Count -gt 0) {
        Write-Host "📦 Archivos de backup encontrados: $($backupFiles.Count)" -ForegroundColor Yellow
        foreach ($backup in $backupFiles) {
            Write-Host "  - $($backup.FullName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "📦 No se encontraron archivos de backup" -ForegroundColor Green
    }
    
    # Verificar archivos con nombres en español
    $spanishFiles = Get-ChildItem -Path "." -Recurse -File | Where-Object {
        $_.Name -match 'ambiente|carga|consumo|circuito|alimentador|puesta-tierra|reporte'
    }
    
    if ($spanishFiles.Count -gt 0) {
        Write-Host "`n🇪🇸 Archivos con nombres en español encontrados: $($spanishFiles.Count)" -ForegroundColor Yellow
        foreach ($file in $spanishFiles) {
            Write-Host "  - $($file.FullName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n🇪🇸 No se encontraron archivos con nombres en español" -ForegroundColor Green
    }
    
    # Verificar contenido en español
    $spanishContent = Get-ChildItem -Path "." -Recurse -File -Include "*.ts", "*.js", "*.json" | Where-Object {
        $_.Name -notmatch '\.backup$' -and $_.Name -notmatch '\.md$'
    } | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match '\b(ambiente|carga|consumo|circuito|alimentador|puesta_tierra|reporte)\b') {
            $_
        }
    }
    
    if ($spanishContent.Count -gt 0) {
        Write-Host "`n📝 Archivos con contenido en español: $($spanishContent.Count)" -ForegroundColor Yellow
        foreach ($file in $spanishContent) {
            Write-Host "  - $($file.FullName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n📝 No se encontraron archivos con contenido en español" -ForegroundColor Green
    }
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "`n📚 Ayuda - Traducción del Proyecto" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Este script permite traducir todo el proyecto del español al inglés:" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Traducción de contenido:" -ForegroundColor Yellow
    Write-Host "  - Nombres de variables y constantes" -ForegroundColor Gray
    Write-Host "  - Nombres de clases y métodos" -ForegroundColor Gray
    Write-Host "  - Comentarios y mensajes" -ForegroundColor Gray
    Write-Host "  - Configuraciones y parámetros" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📁 Renombrado de archivos:" -ForegroundColor Yellow
    Write-Host "  - Entidades (ambiente -> environment)" -ForegroundColor Gray
    Write-Host "  - Servicios y controladores" -ForegroundColor Gray
    Write-Host "  - Tests y migraciones" -ForegroundColor Gray
    Write-Host "  - Actualización automática de referencias" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
    Write-Host "  - Se crean backups automáticamente" -ForegroundColor Gray
    Write-Host "  - Se puede revertir en cualquier momento" -ForegroundColor Gray
    Write-Host "  - Se recomienda hacer commit antes de ejecutar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Revertir cambios:" -ForegroundColor Yellow
    Write-Host "  - Restaura todos los archivos originales" -ForegroundColor Gray
    Write-Host "  - Elimina archivos de backup" -ForegroundColor Gray
}

# Función principal
function Start-TranslationProject {
    do {
        Show-MainMenu
        Write-Host "`nSelecciona una opción (0-6): " -ForegroundColor Yellow -NoNewline
        $choice = Read-Host
        
        switch ($choice) {
            "1" { Start-ContentTranslation }
            "2" { Start-FileRenaming }
            "3" { Start-CompleteTranslation }
            "4" { Revert-AllChanges }
            "5" { Check-ProjectStatus }
            "6" { Show-Help }
            "0" { 
                Write-Host "`n👋 ¡Hasta luego!" -ForegroundColor Green
                return 
            }
            default { 
                Write-Host "`n❌ Opción no válida. Intenta de nuevo." -ForegroundColor Red 
            }
        }
        
        if ($choice -ne "0") {
            Write-Host "`nPresiona Enter para continuar..." -ForegroundColor Gray
            Read-Host
        }
    } while ($choice -ne "0")
}

# Función para procesar argumentos de línea de comandos
function Process-CommandLineArgs {
    if ($args.Count -eq 0) {
        Start-TranslationProject
        return
    }
    
    switch ($args[0]) {
        "-content" { Start-ContentTranslation }
        "-files" { Start-FileRenaming }
        "-complete" { Start-CompleteTranslation }
        "-revert" { Revert-AllChanges }
        "-status" { Check-ProjectStatus }
        "-help" { Show-Help }
        default {
            Write-Host "❌ Argumento no válido: $($args[0])" -ForegroundColor Red
            Write-Host "Use -help para ver las opciones disponibles" -ForegroundColor Yellow
        }
    }
}

# Ejecutar script
Process-CommandLineArgs $args
