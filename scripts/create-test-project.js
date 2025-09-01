const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function createTestProject() {
  try {
    console.log('🚀 Creando proyecto de prueba...');

    const projectData = {
      projectName: 'Proyecto de Prueba - Sprint 12',
      description: 'Proyecto para probar la funcionalidad de visualización y exportación',
      surfaces: [
        { environment: 'Sala', areaM2: 18.5 },
        { environment: 'Dormitorio 1', areaM2: 12.0 },
        { environment: 'Cocina', areaM2: 15.0 },
        { environment: 'Baño', areaM2: 8.0 }
      ],
      consumptions: [
        { name: 'Televisor', environment: 'Sala', watts: 120 },
        { name: 'Lámpara', environment: 'Sala', watts: 60 },
        { name: 'Lámpara', environment: 'Dormitorio 1', watts: 60 },
        { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
        { name: 'Microondas', environment: 'Cocina', watts: 1200 },
        { name: 'Secador', environment: 'Baño', watts: 1800 }
      ],
      opciones: { 
        tensionV: 120, 
        monofasico: true 
      },
      computeNow: true
    };

    // Crear proyecto
    const createResponse = await axios.post(`${API_BASE_URL}/v1/projects`, projectData);
    const project = createResponse.data;

    console.log('✅ Proyecto creado exitosamente:');
    console.log(`   ID: ${project.id}`);
    console.log(`   Nombre: ${project.projectName}`);
    console.log(`   Estado: ${project.status}`);

    if (project.versions && project.versions.length > 0) {
      console.log(`   Versión: ${project.versions[0].versionNumber}`);
    }

    console.log('\n📋 URLs para probar:');
    console.log(`   Frontend: http://localhost:8082/proyectos/${project.id}/resultados`);
    console.log(`   API: http://localhost:3000/api/modelado/proyectos/${project.id}/resultados`);

    return project;

  } catch (error) {
    console.error('❌ Error al crear proyecto de prueba:', error.response?.data || error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestProject()
    .then(() => {
      console.log('\n🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el script:', error.message);
      process.exit(1);
    });
}

module.exports = { createTestProject };
