# Script para traducir nombres, variables y constantes del español al inglés
# Este script solo afecta nombres, NO la funcionalidad del código

Write-Host "🔍 Iniciando traducción de nombres del español al inglés..." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Función para hacer backup de un archivo
function Backup-File {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $backupPath = "$FilePath.backup"
        Copy-Item $FilePath $backupPath
        Write-Host "✅ Backup creado: $backupPath" -ForegroundColor Green
    }
}

# Función para restaurar backup
function Restore-Backup {
    param([string]$FilePath)
    $backupPath = "$FilePath.backup"
    if (Test-Path $backupPath) {
        Copy-Item $backupPath $FilePath -Force
        Remove-Item $backupPath
        Write-Host "✅ Backup restaurado: $FilePath" -ForegroundColor Green
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
    'ambiente_nombre' = 'environment_name'
    'carga_bruta_va' = 'gross_load_va'
    'carga_diversificada_va' = 'diversified_load_va'
    'factor_uso' = 'usage_factor'
    'ahorro_va' = 'savings_va'
    'total_bruto_va' = 'total_gross_va'
    'total_diversificado_va' = 'total_diversified_va'
    'id_circuito' = 'circuit_id'
    'nombre_circuito' = 'circuit_name'
    'corriente_circuito_a' = 'circuit_current_a'
    'conductor_seleccionado' = 'selected_conductor'
    'breaker_seleccionado' = 'selected_breaker'
    'utilizacion_circuito' = 'circuit_utilization'
    'caida_tension' = 'voltage_drop'
    'caida_tension_porcentaje' = 'voltage_drop_percentage'
    'longitud_critica' = 'critical_length'
    'fuera_limites' = 'out_of_limits'
    'main_breaker_amp' = 'main_breaker_amp'
    'tipo_instalacion' = 'installation_type'
    'conductor_egc' = 'egc_conductor'
    'conductor_gec' = 'gec_conductor'
    'resistencia_tierra' = 'ground_resistance'
    'observaciones' = 'observations'
    'observacion' = 'observation'
    
    # Variables y constantes
    'test_db_host' = 'test_db_host'
    'test_db_port' = 'test_db_port'
    'test_db_username' = 'test_db_username'
    'test_db_password' = 'test_db_password'
    'test_db_name' = 'test_db_name'
    'test_port' = 'test_port'
    'test_jwt_secret' = 'test_jwt_secret'
    'test_jwt_expires_in' = 'test_jwt_expires_in'
    'test_throttle_ttl' = 'test_throttle_ttl'
    'test_throttle_limit' = 'test_throttle_limit'
    'electridom_test' = 'electridom_test'
    'electridom' = 'electridom'
    
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
    
    # Nombres de archivos
    'ambiente.entity.ts' = 'environment.entity.ts'
    'carga.entity.ts' = 'load.entity.ts'
    'consumo.entity.ts' = 'consumption.entity.ts'
    'circuito.entity.ts' = 'circuit.entity.ts'
    'alimentador.entity.ts' = 'feeder.entity.ts'
    'puesta-tierra.entity.ts' = 'grounding.entity.ts'
    'reporte.entity.ts' = 'report.entity.ts'
    'ambiente.service.ts' = 'environment.service.ts'
    'carga.service.ts' = 'load.service.ts'
    'consumo.service.ts' = 'consumption.service.ts'
    'circuito.service.ts' = 'circuit.service.ts'
    'alimentador.service.ts' = 'feeder.service.ts'
    'puesta-tierra.service.ts' = 'grounding.service.ts'
    'reporte.service.ts' = 'report.service.ts'
    'ambiente.controller.ts' = 'environment.controller.ts'
    'carga.controller.ts' = 'load.controller.ts'
    'consumo.controller.ts' = 'consumption.controller.ts'
    'circuito.controller.ts' = 'circuit.controller.ts'
    'alimentador.controller.ts' = 'feeder.controller.ts'
    'puesta-tierra.controller.ts' = 'grounding.controller.ts'
    'reporte.controller.ts' = 'report.controller.ts'
    'ambiente.module.ts' = 'environment.module.ts'
    'carga.module.ts' = 'load.module.ts'
    'consumo.module.ts' = 'consumption.module.ts'
    'circuito.module.ts' = 'circuit.module.ts'
    'alimentador.module.ts' = 'feeder.module.ts'
    'puesta-tierra.module.ts' = 'grounding.module.ts'
    'reporte.module.ts' = 'report.module.ts'
    
    # Nombres de migraciones
    'CreateAmbientesTable' = 'CreateEnvironmentsTable'
    'CreateCargasTable' = 'CreateLoadsTable'
    'CreateConsumosTable' = 'CreateConsumptionsTable'
    'CreateCircuitosTable' = 'CreateCircuitsTable'
    'CreateAlimentadoresTable' = 'CreateFeedersTable'
    'CreatePuestaTierraTable' = 'CreateGroundingTable'
    'CreateReportesTable' = 'CreateReportsTable'
    
    # Nombres de seeds
    'ambiente.seed.ts' = 'environment.seed.ts'
    'carga.seed.ts' = 'load.seed.ts'
    'consumo.seed.ts' = 'consumption.seed.ts'
    'circuito.seed.ts' = 'circuit.seed.ts'
    'alimentador.seed.ts' = 'feeder.seed.ts'
    'puesta-tierra.seed.ts' = 'grounding.seed.ts'
    'reporte.seed.ts' = 'report.seed.ts'
    
    # Nombres de tests
    'ambiente.spec.ts' = 'environment.spec.ts'
    'carga.spec.ts' = 'load.spec.ts'
    'consumo.spec.ts' = 'consumption.spec.ts'
    'circuito.spec.ts' = 'circuit.spec.ts'
    'alimentador.spec.ts' = 'feeder.spec.ts'
    'puesta-tierra.spec.ts' = 'grounding.spec.ts'
    'reporte.spec.ts' = 'report.spec.ts'
    'ambiente.e2e-spec.ts' = 'environment.e2e-spec.ts'
    'carga.e2e-spec.ts' = 'load.e2e-spec.ts'
    'consumo.e2e-spec.ts' = 'consumption.e2e-spec.ts'
    'circuito.e2e-spec.ts' = 'circuit.e2e-spec.ts'
    'alimentador.e2e-spec.ts' = 'feeder.e2e-spec.ts'
    'puesta-tierra.e2e-spec.ts' = 'grounding.e2e-spec.ts'
    'reporte.e2e-spec.ts' = 'report.e2e-spec.ts'
    
    # Rutas y endpoints
    '/api/ambientes' = '/api/environments'
    '/api/cargas' = '/api/loads'
    '/api/consumos' = '/api/consumptions'
    '/api/circuitos' = '/api/circuits'
    '/api/alimentadores' = '/api/feeders'
    '/api/puesta-tierra' = '/api/grounding'
    '/api/reportes' = '/api/reports'
    
    # Mensajes y textos
    'Ambiente creado exitosamente' = 'Environment created successfully'
    'Carga creada exitosamente' = 'Load created successfully'
    'Consumo creado exitosamente' = 'Consumption created successfully'
    'Circuito creado exitosamente' = 'Circuit created successfully'
    'Alimentador creado exitosamente' = 'Feeder created successfully'
    'Puesta a tierra creada exitosamente' = 'Grounding created successfully'
    'Reporte generado exitosamente' = 'Report generated successfully'
    
    # Comentarios
    '# Entidad Ambiente' = '# Environment Entity'
    '# Entidad Carga' = '# Load Entity'
    '# Entidad Consumo' = '# Consumption Entity'
    '# Entidad Circuito' = '# Circuit Entity'
    '# Entidad Alimentador' = '# Feeder Entity'
    '# Entidad Puesta a Tierra' = '# Grounding Entity'
    '# Entidad Reporte' = '# Report Entity'
    
    # Configuraciones
    'ambiente_test' = 'environment_test'
    'carga_test' = 'load_test'
    'consumo_test' = 'consumption_test'
    'circuito_test' = 'circuit_test'
    'alimentador_test' = 'feeder_test'
    'puesta_tierra_test' = 'grounding_test'
    'reporte_test' = 'report_test'
}

# Función para procesar un archivo
function Process-File {
    param([string]$FilePath)
    
    if (-not (Should-ProcessFile $FilePath)) {
        return
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
            Write-Host "✅ Traducido: $FilePath" -ForegroundColor Green
            return $true
        } else {
            # Restaurar backup si no hubo cambios
            Restore-Backup $FilePath
            Write-Host "⏭️  Sin cambios: $FilePath" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "❌ Error procesando $FilePath : $($_.Exception.Message)" -ForegroundColor Red
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
    
    Write-Host "`n📁 Procesando directorio: $DirectoryPath" -ForegroundColor Cyan
    
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
    Write-Host "🚀 Iniciando proceso de traducción..." -ForegroundColor Green
    
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
    Write-Host "`n📊 Resumen de traducción:" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "Archivos procesados: $totalProcessed" -ForegroundColor Yellow
    Write-Host "Archivos traducidos: $totalTranslated" -ForegroundColor Green
    Write-Host "Archivos sin cambios: $($totalProcessed - $totalTranslated)" -ForegroundColor Gray
    
    if ($totalTranslated -gt 0) {
        Write-Host "`n✅ Traducción completada exitosamente!" -ForegroundColor Green
        Write-Host "📝 Recuerda revisar los cambios antes de hacer commit" -ForegroundColor Yellow
    } else {
        Write-Host "`nℹ️  No se encontraron archivos que requieran traducción" -ForegroundColor Blue
    }
}

# Función para revertir cambios
function Revert-Translation {
    Write-Host "🔄 Revirtiendo traducciones..." -ForegroundColor Yellow
    
    $backupFiles = Get-ChildItem -Path "." -Recurse -Filter "*.backup"
    $revertedCount = 0
    
    foreach ($backupFile in $backupFiles) {
        $originalFile = $backupFile.FullName -replace '\.backup$', ''
        if (Test-Path $originalFile) {
            Restore-Backup $originalFile
            $revertedCount++
        }
    }
    
    Write-Host "✅ Revertidos $revertedCount archivos" -ForegroundColor Green
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "Uso del script de traducción:" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para traducir: .\scripts\translate-to-english.ps1" -ForegroundColor Yellow
    Write-Host "Para revertir: .\scripts\translate-to-english.ps1 -Revert" -ForegroundColor Yellow
    Write-Host "Para ayuda: .\scripts\translate-to-english.ps1 -Help" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "El script traduce nombres, variables y constantes del español al inglés" -ForegroundColor Gray
    Write-Host "sin afectar la funcionalidad del código." -ForegroundColor Gray
}

# Procesar argumentos
if ($args.Count -eq 0) {
    Start-Translation
} elseif ($args[0] -eq "-Revert") {
    Revert-Translation
} elseif ($args[0] -eq "-Help") {
    Show-Help
} else {
    Write-Host "❌ Argumento no válido. Use -Help para ver las opciones." -ForegroundColor Red
}
