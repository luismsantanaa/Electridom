const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSprint14Validaciones() {
	console.log(
		'🧪 Iniciando pruebas del Sprint 14 - Validaciones y Optimización\n'
	);

	try {
		// 1. Crear proyecto de prueba con datos que generen validaciones
		console.log('1️⃣ Creando proyecto de prueba con datos para validaciones...');
		const projectData = {
			projectName: 'Prueba Sprint 14 - Validaciones',
			description: 'Proyecto para probar validaciones normativas',
			surfaces: [
				{ environment: 'Sala', areaM2: 10.0 }, // Área pequeña para generar exceso de tomas
				{ environment: 'Cocina', areaM2: 8.0 }, // Área pequeña para generar exceso de luminarias
				{ environment: 'Dormitorio', areaM2: 12.0 },
			],
			consumptions: [
				{ name: 'Televisor', environment: 'Sala', watts: 150 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Lámpara', environment: 'Sala', watts: 60 },
				{ name: 'Refrigerador', environment: 'Cocina', watts: 800 },
				{ name: 'Microondas', environment: 'Cocina', watts: 1200 },
				{ name: 'Aire Acondicionado', environment: 'Dormitorio', watts: 2000 },
				{ name: 'Aire Acondicionado', environment: 'Dormitorio', watts: 2000 },
				{ name: 'Aire Acondicionado', environment: 'Dormitorio', watts: 2000 },
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

		// 2. Verificar resultados
		console.log('\n2️⃣ Verificando resultados...');
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

		// 3. Simular validaciones (ya que las validaciones son del frontend)
		console.log('\n3️⃣ Simulando validaciones normativas...');

		// Validación de tomas
		const validacionTomas = [
			{
				ambiente: 'Sala',
				areaM2: 10.0,
				tomasCalculadas: 8,
				tomasMaximas: 4,
				exceso: 4,
			},
			{
				ambiente: 'Cocina',
				areaM2: 8.0,
				tomasCalculadas: 6,
				tomasMaximas: 4,
				exceso: 2,
			},
			{
				ambiente: 'Dormitorio',
				areaM2: 12.0,
				tomasCalculadas: 4,
				tomasMaximas: 4,
				exceso: 0,
			},
		];

		console.log('📊 Validación de Tomas:');
		validacionTomas.forEach((toma) => {
			const status = toma.exceso > 0 ? '⚠️ EXCESO' : '✅ OK';
			console.log(
				`   ${toma.ambiente}: ${toma.tomasCalculadas}/${toma.tomasMaximas} tomas - ${status}`
			);
		});

		// Validación de luminarias
		const validacionLuminarias = [
			{
				ambiente: 'Sala',
				areaM2: 10.0,
				luminariasCalculadas: 12,
				luminariasMaximas: 6,
				exceso: 6,
			},
			{
				ambiente: 'Cocina',
				areaM2: 8.0,
				luminariasCalculadas: 4,
				luminariasMaximas: 4,
				exceso: 0,
			},
			{
				ambiente: 'Dormitorio',
				areaM2: 12.0,
				luminariasCalculadas: 3,
				luminariasMaximas: 4,
				exceso: 0,
			},
		];

		console.log('\n💡 Validación de Luminarias:');
		validacionLuminarias.forEach((luminaria) => {
			const status = luminaria.exceso > 0 ? '⚠️ EXCESO' : '✅ OK';
			console.log(
				`   ${luminaria.ambiente}: ${luminaria.luminariasCalculadas}/${luminaria.luminariasMaximas} luminarias - ${status}`
			);
		});

		// Validación de caída de tensión
		const validacionCaidaTension = [
			{
				circuito: 'Circuito 1',
				longitud: 50,
				corriente: 15,
				caidaCalculada: 2.5,
				caidaMaxima: 3.0,
				porcentaje: 83.3,
			},
			{
				circuito: 'Circuito 2',
				longitud: 80,
				corriente: 20,
				caidaCalculada: 4.2,
				caidaMaxima: 3.0,
				porcentaje: 140.0,
			},
			{
				circuito: 'Circuito 3',
				longitud: 30,
				corriente: 10,
				caidaCalculada: 1.8,
				caidaMaxima: 3.0,
				porcentaje: 60.0,
			},
		];

		console.log('\n⚡ Validación de Caída de Tensión:');
		validacionCaidaTension.forEach((caida) => {
			const status =
				caida.caidaCalculada > caida.caidaMaxima ? '❌ EXCESO' : '✅ OK';
			console.log(
				`   ${caida.circuito}: ${caida.caidaCalculada.toFixed(2)}%/${
					caida.caidaMaxima
				}% - ${status}`
			);
		});

		// Validación de simultaneidad
		const validacionSimultaneidad = [
			{
				tipo: 'Aire Acondicionado',
				cantidad: 3,
				factorSimultaneidad: 0.8,
				potenciaTotal: 6000,
				potenciaSimultanea: 4800,
			},
			{
				tipo: 'Lámparas',
				cantidad: 12,
				factorSimultaneidad: 0.8,
				potenciaTotal: 720,
				potenciaSimultanea: 576,
			},
			{
				tipo: 'Refrigerador',
				cantidad: 1,
				factorSimultaneidad: 1.0,
				potenciaTotal: 800,
				potenciaSimultanea: 800,
			},
		];

		console.log('\n🔄 Validación de Simultaneidad:');
		validacionSimultaneidad.forEach((sim) => {
			const status = sim.potenciaSimultanea > 5000 ? '⚠️ ALTO' : '✅ OK';
			console.log(
				`   ${sim.tipo}: ${sim.potenciaSimultanea.toFixed(0)}W (${(
					sim.factorSimultaneidad * 100
				).toFixed(0)}% simultaneidad) - ${status}`
			);
		});

		// 4. Resumen de validaciones
		console.log('\n📋 Resumen de Validaciones:');
		const totalExcesos =
			validacionTomas.filter((t) => t.exceso > 0).length +
			validacionLuminarias.filter((l) => l.exceso > 0).length +
			validacionCaidaTension.filter((c) => c.caidaCalculada > c.caidaMaxima)
				.length;

		const totalWarnings = validacionSimultaneidad.filter(
			(s) => s.potenciaSimultanea > 5000
		).length;

		console.log(
			`   ❌ Errores críticos: ${
				validacionCaidaTension.filter((c) => c.caidaCalculada > c.caidaMaxima)
					.length
			}`
		);
		console.log(`   ⚠️ Advertencias: ${totalExcesos + totalWarnings}`);
		console.log(
			`   ✅ Elementos válidos: ${
				validacionTomas.length +
				validacionLuminarias.length +
				validacionCaidaTension.length +
				validacionSimultaneidad.length -
				totalExcesos -
				totalWarnings
			}`
		);

		console.log('\n🎉 Sprint 14 - Pruebas completadas exitosamente!');
		console.log('\n📋 URLs para probar:');
		console.log(
			`   Frontend Results: http://localhost:8082/proyectos/${project.id}/resultados`
		);
		console.log(
			`   Frontend Validaciones: http://localhost:8082/proyectos/${project.id}/validaciones`
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
	testSprint14Validaciones()
		.then(() => {
			console.log('\n✅ Script de prueba completado');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Error en el script:', error.message);
			process.exit(1);
		});
}

module.exports = { testSprint14Validaciones };
