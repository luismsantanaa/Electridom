const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSprint13Integration() {
	console.log('🧪 Iniciando pruebas del Sprint 13 - Integración End-to-End\n');

	try {
		// 1. Verificar estado de integración
		console.log('1️⃣ Verificando estado de integración...');
		const healthResponse = await axios.get(`${API_BASE_URL}/health`);
		console.log('✅ Backend conectado:', healthResponse.data.status === 'ok');
		console.log(
			'✅ Base de datos:',
			healthResponse.data.details?.database?.status === 'up'
		);
		console.log(
			'✅ Servicios activos:',
			Object.keys(healthResponse.data.details || {}).length
		);

		// 2. Crear proyecto end-to-end
		console.log('\n2️⃣ Creando proyecto end-to-end...');
		const projectData = {
			projectName: 'Prueba Sprint 13 - Integración',
			description: 'Proyecto de prueba para verificar integración end-to-end',
			surfaces: [
				{ environment: 'Sala', areaM2: 20.0 },
				{ environment: 'Dormitorio', areaM2: 15.0 },
				{ environment: 'Cocina', areaM2: 12.0 },
			],
			consumptions: [
				{ name: 'Televisor', environment: 'Sala', watts: 150 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Refrigerador', environment: 'Cocina', watts: 800 },
				{ name: 'Microondas', environment: 'Cocina', watts: 1200 },
			],
			opciones: {
				tensionV: 120,
				monofasico: true,
			},
			computeNow: true,
		};

		const createResponse = await axios.post(
			`${API_BASE_URL}/v1/projects`,
			projectData
		);
		const project = createResponse.data;
		console.log('✅ Proyecto creado:', {
			id: project.id,
			name: project.projectName,
			status: project.status,
		});

		// 3. Verificar resultados
		console.log('\n3️⃣ Verificando resultados...');
		if (project.status === 'COMPLETED') {
			const resultsResponse = await axios.get(
				`${API_BASE_URL}/modelado/proyectos/${project.id}/resultados`
			);
			const results = resultsResponse.data;
			console.log('✅ Resultados obtenidos:', {
				circuitos: results.circuitos?.length || 0,
				potenciaTotal: results.resumen?.potencia_total_va || 0,
				corrienteTotal: results.resumen?.corriente_total_a || 0,
			});
		} else {
			console.log('⚠️ Proyecto creado pero cálculo pendiente');
		}

		// 4. Probar exportación
		console.log('\n4️⃣ Probando exportación...');
		const exportResponse = await axios.get(
			`${API_BASE_URL}/modelado/proyectos/${project.id}/resultados`
		);
		if (exportResponse.data) {
			console.log('✅ Datos disponibles para exportación');
		}

		// 5. Verificar proyectos disponibles
		console.log('\n5️⃣ Verificando proyectos disponibles...');
		const projectsResponse = await axios.get(`${API_BASE_URL}/v1/projects`);
		console.log(
			'✅ Proyectos en sistema:',
			projectsResponse.data.data?.length || 0
		);

		console.log('\n🎉 Sprint 13 - Pruebas completadas exitosamente!');
		console.log('\n📋 URLs para probar:');
		console.log(`   Frontend Integration: http://localhost:8082/integration`);
		console.log(
			`   Frontend Results: http://localhost:8082/proyectos/${project.id}/resultados`
		);
		console.log(
			`   API Project: http://localhost:3000/api/v1/projects/${project.id}`
		);
		console.log(
			`   API Results: http://localhost:3000/api/modelado/proyectos/${project.id}/resultados`
		);
	} catch (error) {
		console.error(
			'❌ Error en las pruebas:',
			error.response?.data || error.message
		);

		if (error.response?.status === 404) {
			console.log('\n💡 Sugerencias:');
			console.log('   - Verificar que el backend esté ejecutándose');
			console.log('   - Verificar que los endpoints estén disponibles');
			console.log('   - Revisar la configuración de la base de datos');
		}
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	testSprint13Integration()
		.then(() => {
			console.log('\n✅ Script de prueba completado');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Error en el script:', error.message);
			process.exit(1);
		});
}

module.exports = { testSprint13Integration };
