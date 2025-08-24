# Script para verificar qué archivos necesitan traducción del español al inglés

Write-Host "🔍 Verificando archivos que necesitan traducción..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Patrones de búsqueda para contenido en español
$spanishPatterns = @(
    # Entidades principales
    '\bambiente\b',
    '\bcarga\b',
    '\bconsumo\b',
    '\bcircuito\b',
    '\balimentador\b',
    '\bpuesta_tierra\b',
    '\breporte\b',
    
    # Campos y propiedades
    '\bnombre\b',
    '\bdescripcion\b',
    '\btipo\b',
    '\barea_m2\b',
    '\bpotencia_w\b',
    '\btension_v\b',
    '\bcorriente_a\b',
    '\blongitud_m\b',
    '\bseccion_mm2\b',
    '\bmaterial\b',
    '\bcategoria\b',
    '\bcapacidad\b',
    '\butilizacion\b',
    '\blimite\b',
    '\bvalor\b',
    '\bparametro\b',
    '\bsistema\b',
    '\binstalacion\b',
    
    # Métodos y funciones
    '\bcalcular_cargas\b',
    '\bcalcular_demanda\b',
    '\bcalcular_circuitos\b',
    '\bcalcular_alimentador\b',
    '\bcalcular_puesta_tierra\b',
    '\bgenerar_reporte\b',
    '\bvalidar_datos\b',
    '\bprocesar_ambientes\b',
    '\bprocesar_consumos\b',
    '\bagrupar_cargas\b',
    '\bseleccionar_conductor\b',
    '\bseleccionar_breaker\b',
    '\banalizar_caida_tension\b',
    '\bdimensionar_puesta_tierra\b',
    
    # Clases y servicios
    '\bAmbienteService\b',
    '\bCargaService\b',
    '\bConsumoService\b',
    '\bCircuitoService\b',
    '\bAlimentadorService\b',
    '\bPuestaTierraService\b',
    '\bReporteService\b',
    '\bCalculoService\b',
    
    # Controladores
    '\bAmbienteController\b',
    '\bCargaController\b',
    '\bConsumoController\b',
    '\bCircuitoController\b',
    '\bAlimentadorController\b',
    '\bPuestaTierraController\b',
    '\bReporteController\b',
    
    # Módulos
    '\bAmbienteModule\b',
    '\bCargaModule\b',
    '\bConsumoModule\b',
    '\bCircuitoModule\b',
    '\bAlimentadorModule\b',
    '\bPuestaTierraModule\b',
    '\bReporteModule\b',
    
    # DTOs
    '\bAmbienteDto\b',
    '\bCargaDto\b',
    '\bConsumoDto\b',
    '\bCircuitoDto\b',
    '\bAlimentadorDto\b',
    '\bPuestaTierraDto\b',
    '\bReporteDto\b',
    
    # Rutas y endpoints
    '/api/ambientes',
    '/api/cargas',
    '/api/consumos',
    '/api/circuitos',
    '/api/alimentadores',
    '/api/puesta-tierra',
    '/api/reportes'
)

# Patrones de nombres de archivos en español
$spanishFilePatterns = @(
    'ambiente\.',
    'carga\.',
    'consumo\.',
    'circuito\.',
    'alimentador\.',
    'puesta-tierra\.',
    'reporte\.'
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
                $matchInfo = [regex]::Matches($content, $pattern)
                foreach ($match in $matchInfo) {
                    $matches += @{
                        Pattern = $pattern
                        Value = $match.Value
                        Line = ($content.Substring(0, $match.Index) -split "`n").Count
                    }
                }
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
        foreach ($pattern in $spanishFilePatterns) {
            if ($file.Name -match $pattern) {
                $spanishFiles += @{
                    Path = $file.FullName
                    Name = $file.Name
                    Pattern = $pattern
                }
                break
            }
        }
    }
    
    return $spanishFiles
}

# Función principal
function Start-TranslationCheck {
    Write-Host "`n📁 Verificando archivos con nombres en español..." -ForegroundColor Yellow
    
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
        Write-Host "`n🇪🇸 Archivos con nombres en español encontrados: $($spanishFileNames.Count)" -ForegroundColor Yellow
        foreach ($file in $spanishFileNames) {
            Write-Host "  📄 $($file.Path)" -ForegroundColor Red
        }
    } else {
        Write-Host "`n✅ No se encontraron archivos con nombres en español" -ForegroundColor Green
    }
    
    Write-Host "`n📝 Verificando contenido en español..." -ForegroundColor Yellow
    
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
        Write-Host "`n📝 Archivos con contenido en español encontrados: $($filesWithSpanishContent.Count)" -ForegroundColor Yellow
        Write-Host "Total de coincidencias: $totalMatches" -ForegroundColor Yellow
        
        foreach ($file in $filesWithSpanishContent) {
            Write-Host "`n  📄 $($file.Path) ($($file.Count) coincidencias)" -ForegroundColor Cyan
            
            # Agrupar coincidencias por tipo
            $groupedMatches = $file.Matches | Group-Object -Property Value | Sort-Object Count -Descending
            
            foreach ($group in $groupedMatches) {
                Write-Host "    • $($group.Name) (líneas: $($group.Group.Line -join ', '))" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "`n✅ No se encontraron archivos con contenido en español" -ForegroundColor Green
    }
    
    # Resumen final
    Write-Host "`n📊 Resumen de verificación:" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host "Archivos con nombres en español: $($spanishFileNames.Count)" -ForegroundColor Yellow
    Write-Host "Archivos con contenido en español: $($filesWithSpanishContent.Count)" -ForegroundColor Yellow
    Write-Host "Total de coincidencias encontradas: $totalMatches" -ForegroundColor Yellow
    
    if ($spanishFileNames.Count -gt 0 -or $filesWithSpanishContent.Count -gt 0) {
        Write-Host "`n⚠️  Se encontraron elementos que requieren traducción" -ForegroundColor Red
        Write-Host "💡 Ejecuta el script de traducción para corregir estos elementos" -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ El proyecto ya está completamente en inglés" -ForegroundColor Green
    }
}

# Función para mostrar ayuda
function Show-CheckHelp {
    Write-Host "Uso del script de verificación:" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Este script verifica qué archivos necesitan traducción:" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Verificaciones realizadas:" -ForegroundColor Yellow
    Write-Host "  - Nombres de archivos en español" -ForegroundColor Gray
    Write-Host "  - Contenido en español en archivos de código" -ForegroundColor Gray
    Write-Host "  - Variables, constantes y nombres de clases" -ForegroundColor Gray
    Write-Host "  - Rutas y endpoints" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Resultados:" -ForegroundColor Yellow
    Write-Host "  - Lista de archivos que necesitan traducción" -ForegroundColor Gray
    Write-Host "  - Conteo de coincidencias por archivo" -ForegroundColor Gray
    Write-Host "  - Resumen general del estado" -ForegroundColor Gray
}

# Procesar argumentos
if ($args.Count -eq 0) {
    Start-TranslationCheck
} elseif ($args[0] -eq "-Help") {
    Show-CheckHelp
} else {
    Write-Host "❌ Argumento no válido. Use -Help para ver las opciones." -ForegroundColor Red
}
