# Script simplificado para traducir el proyecto del español al inglés

Write-Host "Traduccion del proyecto - Espanol a Ingles" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Diccionario de traducciones (español -> inglés)
$translations = @{
    # Entidades y tablas
    'ambiente' = 'environment'
    'ambientes' = 'environments'
    'carga' = 'load'
    'cargas' = 'loads'
    'consumo' = 'consumption'
    'consumos' = 'consumptions'
    'superficie' = 'surface'
    'superficies' = 'surfaces'
    'factor_demanda' = 'demand_factor'
    'factores_demanda' = 'demand_factors'
    'circuito' = 'circuit'
    'circuitos' = 'circuits'
    'alimentador' = 'feeder'
    'alimentadores' = 'feeders'
    'puesta_tierra' = 'grounding'
    'conductores' = 'conductors'
    'conductor' = 'conductor'
    'resistividad' = 'resistivity'
    'ampacidad' = 'ampacity'
    'breaker' = 'breaker'
    'breakers' = 'breakers'
    'norma' = 'norm'
    'normas' = 'norms'
    'regla' = 'rule'
    'reglas' = 'rules'
    'proyecto' = 'project'
    'proyectos' = 'projects'
    'usuario' = 'user'
    'usuarios' = 'users'
    'sesion' = 'session'
    'sesiones' = 'sessions'
    'auditoria' = 'audit'
    'auditorias' = 'audits'
    
    # Campos de entidades
    'nombre' = 'name'
    'descripcion' = 'description'
    'tipo' = 'type'
    'area_m2' = 'area_m2'
    'potencia_w' = 'power_w'
    'tension_v' = 'voltage_v'
    'corriente_a' = 'current_a'
    'longitud_m' = 'length_m'
    'seccion_mm2' = 'section_mm2'
    'material' = 'material'
    'categoria' = 'category'
    'capacidad' = 'capacity'
    'utilizacion' = 'utilization'
    'limite' = 'limit'
    'limites' = 'limits'
    'valor' = 'value'
    'valores' = 'values'
    'parametro' = 'parameter'
    'parametros' = 'parameters'
    'sistema' = 'system'
    'sistemas' = 'systems'
    'instalacion' = 'installation'
    'instalaciones' = 'installations'
    
    # Nombres de métodos y funciones
    'calcular_cargas' = 'calculate_loads'
    'calcular_demanda' = 'calculate_demand'
    'calcular_circuitos' = 'calculate_circuits'
    'calcular_alimentador' = 'calculate_feeder'
    'calcular_puesta_tierra' = 'calculate_grounding'
    'generar_reporte' = 'generate_report'
    'validar_datos' = 'validate_data'
    'procesar_ambientes' = 'process_environments'
    'procesar_consumos' = 'process_consumptions'
    'agrupar_cargas' = 'group_loads'
    'seleccionar_conductor' = 'select_conductor'
    'seleccionar_breaker' = 'select_breaker'
    'analizar_caida_tension' = 'analyze_voltage_drop'
    'dimensionar_puesta_tierra' = 'size_grounding'
    
    # Nombres de DTOs y clases
    'AmbienteDto' = 'EnvironmentDto'
    'CargaDto' = 'LoadDto'
    'ConsumoDto' = 'ConsumptionDto'
    'SuperficieDto' = 'SurfaceDto'
    'CircuitoDto' = 'CircuitDto'
    'AlimentadorDto' = 'FeederDto'
    'PuestaTierraDto' = 'GroundingDto'
    'ReporteDto' = 'ReportDto'
    'SistemaDto' = 'SystemDto'
    'ParametrosDto' = 'ParametersDto'
    
    # Nombres de servicios
    'AmbienteService' = 'EnvironmentService'
    'CargaService' = 'LoadService'
    'ConsumoService' = 'ConsumptionService'
    'CircuitoService' = 'CircuitService'
    'AlimentadorService' = 'FeederService'
    'PuestaTierraService' = 'GroundingService'
    'ReporteService' = 'ReportService'
    'CalculoService' = 'CalculationService'
    
    # Nombres de controladores
    'AmbienteController' = 'EnvironmentController'
    'CargaController' = 'LoadController'
    'ConsumoController' = 'ConsumptionController'
    'CircuitoController' = 'CircuitController'
    'AlimentadorController' = 'FeederController'
    'PuestaTierraController' = 'GroundingController'
    'ReporteController' = 'ReportController'
    
    # Nombres de módulos
    'AmbienteModule' = 'EnvironmentModule'
    'CargaModule' = 'LoadModule'
    'ConsumoModule' = 'ConsumptionModule'
    'CircuitoModule' = 'CircuitModule'
    'AlimentadorModule' = 'FeederModule'
    'PuestaTierraModule' = 'GroundingModule'
    'ReporteModule' = 'ReportModule'
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

# Función para procesar un archivo
function Process-File {
    param([string]$FilePath)
    
    if (-not (Should-ProcessFile $FilePath)) {
        return $false
    }
    
    Write-Host "Procesando: $FilePath" -ForegroundColor Yellow
    
    try {
        # Crear backup
        Backup-File $FilePath
        
        # Leer contenido
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Aplicar traducciones
        foreach ($spanish in $translations.Keys) {
            $english = $translations[$spanish]
            
            # Reemplazar solo nombres completos (con límites de palabra)
            $pattern = "\b$spanish\b"
            $content = $content -replace $pattern, $english
        }
        
        # Si el contenido cambió, escribir el archivo
        if ($content -ne $originalContent) {
            Set-Content $FilePath $content -Encoding UTF8
            Write-Host "Traducido: $FilePath" -ForegroundColor Green
            return $true
        } else {
            # Restaurar backup si no hubo cambios
            Restore-Backup $FilePath
            Write-Host "Sin cambios: $FilePath" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "Error procesando $FilePath : $($_.Exception.Message)" -ForegroundColor Red
        # Restaurar backup en caso de error
        Restore-Backup $FilePath
        return $false
    }
}

# Función para procesar directorio recursivamente
function Process-Directory {
    param([string]$DirectoryPath)
    
    $processedFiles = 0
    $translatedFiles = 0
    
    Write-Host "`nProcesando directorio: $DirectoryPath" -ForegroundColor Cyan
    
    # Obtener todos los archivos recursivamente
    $files = Get-ChildItem -Path $DirectoryPath -Recurse -File
    
    foreach ($file in $files) {
        if (Should-ProcessFile $file.FullName) {
            $processedFiles++
            if (Process-File $file.FullName) {
                $translatedFiles++
            }
        }
    }
    
    return @{
        Processed = $processedFiles
        Translated = $translatedFiles
    }
}

# Función principal
function Start-Translation {
    Write-Host "Iniciando proceso de traduccion..." -ForegroundColor Green
    
    $totalProcessed = 0
    $totalTranslated = 0
    
    # Procesar directorios principales
    $directories = @(
        "calculadora-electrica-backend/src",
        "calculadora-electrica-backend/test",
        "calculadora-electrica-backend/scripts",
        "calculadora-electrica-frontend/src"
    )
    
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            $result = Process-Directory $dir
            $totalProcessed += $result.Processed
            $totalTranslated += $result.Translated
        }
    }
    
    # Procesar archivos en la raíz del proyecto
    $rootFiles = Get-ChildItem -Path "." -File
    foreach ($file in $rootFiles) {
        if (Should-ProcessFile $file.FullName) {
            $totalProcessed++
            if (Process-File $file.FullName) {
                $totalTranslated++
            }
        }
    }
    
    # Resumen final
    Write-Host "`nResumen de traduccion:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "Archivos procesados: $totalProcessed" -ForegroundColor Yellow
    Write-Host "Archivos traducidos: $totalTranslated" -ForegroundColor Green
    Write-Host "Archivos sin cambios: $($totalProcessed - $totalTranslated)" -ForegroundColor Gray
    
    if ($totalTranslated -gt 0) {
        Write-Host "`nTraduccion completada exitosamente!" -ForegroundColor Green
        Write-Host "Recuerda revisar los cambios antes de hacer commit" -ForegroundColor Yellow
    } else {
        Write-Host "`nNo se encontraron archivos que requieran traduccion" -ForegroundColor Blue
    }
}

# Función para revertir cambios
function Revert-Translation {
    Write-Host "Revirtiendo traducciones..." -ForegroundColor Yellow
    
    $backupFiles = Get-ChildItem -Path "." -Recurse -Filter "*.backup"
    $revertedCount = 0
    
    foreach ($backupFile in $backupFiles) {
        $originalFile = $backupFile.FullName -replace '\.backup$', ''
        if (Test-Path $originalFile) {
            Restore-Backup $originalFile
            $revertedCount++
        }
    }
    
    Write-Host "Revertidos $revertedCount archivos" -ForegroundColor Green
}

# Procesar argumentos
if ($args.Count -eq 0) {
    Start-Translation
} elseif ($args[0] -eq "-Revert") {
    Revert-Translation
} else {
    Write-Host "Argumento no valido. Use -Revert para revertir cambios." -ForegroundColor Red
}
