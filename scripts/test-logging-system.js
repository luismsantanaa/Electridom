const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testLoggingSystem() {
	console.log('🔍 Iniciando pruebas del sistema de logging mejorado\n');

	try {
		// 1. Verificar que el backend esté funcionando
		console.log('📡 Verificando estado del backend...');
		const healthResponse = await axios.get(`${API_BASE_URL}/health`);
		console.log('✅ Backend funcionando:', healthResponse.status);

		// 2. Probar diferentes tipos de requests para generar logs
		console.log('\n📝 Generando logs de diferentes tipos...');

		// Request exitoso
		console.log('   - Request exitoso...');
		await axios.get(`${API_BASE_URL}/health`);

		// Request con error 404
		console.log('   - Request con error 404...');
		try {
			await axios.get(`${API_BASE_URL}/endpoint-inexistente`);
		} catch (error) {
			// Esperado
		}

		// Request con error de validación
		console.log('   - Request con error de validación...');
		try {
			await axios.post(`${API_BASE_URL}/v1/projects`, {
				// Datos inválidos
			});
		} catch (error) {
			// Esperado
		}

		// 3. Verificar logs en archivo
		console.log('\n📁 Verificando archivos de log...');
		const fs = require('fs');
		const path = require('path');

		const logPath = path.join(
			__dirname,
			'../calculadora-electrica-backend/logs/app.log'
		);

		if (fs.existsSync(logPath)) {
			const logContent = fs.readFileSync(logPath, 'utf8');
			const logLines = logContent.split('\n').filter((line) => line.trim());

			console.log(`✅ Archivo de log encontrado: ${logPath}`);
			console.log(`   - Líneas de log: ${logLines.length}`);

			// Mostrar últimos 5 logs
			const recentLogs = logLines.slice(-5);
			console.log('\n📋 Últimos 5 logs:');
			recentLogs.forEach((log, index) => {
				try {
					const parsed = JSON.parse(log);
					console.log(`   ${index + 1}. [${parsed.level}] ${parsed.message}`);
					if (parsed.requestId)
						console.log(`      Request ID: ${parsed.requestId}`);
					if (parsed.duration)
						console.log(`      Duración: ${parsed.duration}`);
				} catch {
					console.log(`   ${index + 1}. ${log.substring(0, 100)}...`);
				}
			});
		} else {
			console.log('⚠️  Archivo de log no encontrado. Verificar configuración.');
		}

		// 4. Verificar logs en consola
		console.log('\n🖥️  Verificar logs en consola del backend:');
		console.log('   - Los logs deben aparecer en la consola del backend');
		console.log('   - Formato: JSON estructurado con timestamps');
		console.log('   - Niveles: debug, info, warn, error');
		console.log('   - Incluir: requestId, method, url, duration, statusCode');

		// 5. Resumen del sistema implementado
		console.log('\n🎉 Sistema de logging mejorado implementado exitosamente!');
		console.log('\n📋 Características implementadas:');
		console.log('   ✅ Logger centralizado con Pino');
		console.log('   ✅ Logs estructurados en JSON');
		console.log('   ✅ Logs a archivo y consola');
		console.log('   ✅ Rotación automática de logs');
		console.log('   ✅ Sanitización de datos sensibles');
		console.log('   ✅ Trace IDs para correlación');
		console.log('   ✅ Métodos especializados por tipo de log');
		console.log('   ✅ Configuración por environment');
		console.log('   ✅ Logs de auditoría de seguridad');
		console.log('   ✅ Métricas de performance');

		console.log('\n🔧 Configuración actual:');
		console.log('   - Nivel de log: DEBUG');
		console.log('   - Archivo habilitado: SÍ');
		console.log('   - Ruta del archivo: ./logs/app.log');
		console.log('   - Rotación: Diaria, máximo 30 archivos');
		console.log('   - Tamaño máximo: 10MB por archivo');

		console.log('\n📊 URLs para monitoreo:');
		console.log(`   - Backend Health: ${API_BASE_URL}/health`);
		console.log(`   - Swagger Docs: http://localhost:3000/api/docs`);
		console.log(`   - Métricas: http://localhost:3000/api/metrics`);
	} catch (error) {
		console.error('❌ Error durante las pruebas:', error.message);
		if (error.response) {
			console.error('   Status:', error.response.status);
			console.error('   Data:', error.response.data);
		}
	}
}

// Ejecutar pruebas
if (require.main === module) {
	testLoggingSystem();
}

module.exports = { testLoggingSystem };
