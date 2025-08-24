# Script simplificado para verificar archivos que necesitan traducción

Write-Host "Verificando archivos que necesitan traduccion..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Patrones de búsqueda para contenido en español
$spanishPatterns = @(
    'ambiente',
    'carga', 
    'consumo',
    'circuito',
    'alimentador',
    'puesta_tierra',
    'reporte',
    'nombre',
    'descripcion',
    'tipo',
    'area_m2',
    'potencia_w',
    'tension_v',
    'corriente_a',
    'longitud_m',
    'seccion_mm2',
    'material',
    'categoria',
    'capacidad',
    'utilizacion',
    'limite',
    'valor',
    'parametro',
    'sistema',
    'instalacion'
)

# Función para verificar si un archivo debe ser procesado
function Should-ProcessFile {
    param([string]$FilePath)
    
    # Excluir archivos .md
    if ($FilePath -match '\.md$') {
        return $false
    }
    
    # Excluir archivos de backup
    if ($FilePath -match '\.backup$') {
        return $false
    }
    
    # Incluir solo archivos de código
    $codeExtensions = @('.ts', '.js', '.json', '.yml', '.yaml', '.sql', '.env', '.example')
    foreach ($ext in $codeExtensions) {
        if ($FilePath -match "\$ext$") {
            return $true
        }
    }
    
    return $false
}

# Función para verificar contenido en español
function Check-SpanishContent {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if (-not $content) {
            return @()
        }
        
        $matches = @()
        foreach ($pattern in $spanishPatterns) {
            if ($content -match $pattern) {
                $matches += $pattern
            }
        }
        
        return $matches
    }
    catch {
        return @()
    }
}

# Función para verificar nombres de archivos en español
function Check-SpanishFileNames {
    param([string]$DirectoryPath)
    
    $spanishFiles = @()
    $files = Get-ChildItem -Path $DirectoryPath -Recurse -File
    
    foreach ($file in $files) {
        if ($file.Name -match 'ambiente|carga|consumo|circuito|alimentador|puesta-tierra|reporte') {
            $spanishFiles += $file.FullName
        }
    }
    
    return $spanishFiles
}

# Función principal
function Start-TranslationCheck {
    Write-Host "`nVerificando archivos con nombres en espanol..." -ForegroundColor Yellow
    
    $spanishFileNames = @()
    $directories = @(
        "calculadora-electrica-backend/src",
        "calculadora-electrica-backend/test",
        "calculadora-electrica-backend/scripts",
        "calculadora-electrica-backend/database/migrations",
        "calculadora-electrica-backend/database/seeds",
        "calculadora-electrica-frontend/src"
    )
    
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            $spanishFileNames += Check-SpanishFileNames $dir
        }
    }
    
    if ($spanishFileNames.Count -gt 0) {
        Write-Host "`nArchivos con nombres en espanol encontrados: $($spanishFileNames.Count)" -ForegroundColor Yellow
        foreach ($file in $spanishFileNames) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    } else {
        Write-Host "`nNo se encontraron archivos con nombres en espanol" -ForegroundColor Green
    }
    
    Write-Host "`nVerificando contenido en espanol..." -ForegroundColor Yellow
    
    $filesWithSpanishContent = @()
    $totalMatches = 0
    
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            $files = Get-ChildItem -Path $dir -Recurse -File
            foreach ($file in $files) {
                if (Should-ProcessFile $file.FullName) {
                    $matches = Check-SpanishContent $file.FullName
                    if ($matches.Count -gt 0) {
                        $filesWithSpanishContent += @{
                            Path = $file.FullName
                            Matches = $matches
                            Count = $matches.Count
                        }
                        $totalMatches += $matches.Count
                    }
                }
            }
        }
    }
    
    if ($filesWithSpanishContent.Count -gt 0) {
        Write-Host "`nArchivos con contenido en espanol encontrados: $($filesWithSpanishContent.Count)" -ForegroundColor Yellow
        Write-Host "Total de coincidencias: $totalMatches" -ForegroundColor Yellow
        
        foreach ($file in $filesWithSpanishContent) {
            Write-Host "`n  - $($file.Path) ($($file.Count) coincidencias)" -ForegroundColor Cyan
            foreach ($match in $file.Matches) {
                Write-Host "    * $match" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "`nNo se encontraron archivos con contenido en espanol" -ForegroundColor Green
    }
    
    # Resumen final
    Write-Host "`nResumen de verificacion:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host "Archivos con nombres en espanol: $($spanishFileNames.Count)" -ForegroundColor Yellow
    Write-Host "Archivos con contenido en espanol: $($filesWithSpanishContent.Count)" -ForegroundColor Yellow
    Write-Host "Total de coincidencias encontradas: $totalMatches" -ForegroundColor Yellow
    
    if ($spanishFileNames.Count -gt 0 -or $filesWithSpanishContent.Count -gt 0) {
        Write-Host "`nSe encontraron elementos que requieren traduccion" -ForegroundColor Red
        Write-Host "Ejecuta el script de traduccion para corregir estos elementos" -ForegroundColor Yellow
    } else {
        Write-Host "`nEl proyecto ya esta completamente en ingles" -ForegroundColor Green
    }
}

# Ejecutar verificación
Start-TranslationCheck
