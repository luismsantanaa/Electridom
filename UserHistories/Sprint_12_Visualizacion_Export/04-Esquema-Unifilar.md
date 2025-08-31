# Esquema de datos para Unifilar (ejemplo)

{
  "proyectoId": 1,
  "circuitos": [
    {
      "id": 10,
      "ambienteId": 3,
      "tipo": "TUG",
      "potenciaVA": 1800,
      "corrienteA": 8.2,
      "proteccion": { "tipo": "MCB", "capacidadA": 15, "curva": "C" },
      "conductor": { "calibreAWG": "14", "material": "Cu", "capacidadA": 15 }
    }
  ]
}
