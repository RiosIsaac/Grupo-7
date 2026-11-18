"use strict";

/*
 * datos.js
 * Datos de demostración del MVP "Inscribirse a materia" (CU01).
 * Simula lo que en un sistema real vendría de la base de datos.
 *
 * Nota sobre "ocupacionInicial": cantidad de cupos ya ocupados por otros
 * estudiantes que no se modelan en este MVP. El cupo disponible real es:
 *   cupo - ocupacionInicial - inscripciones vigentes registradas.
 */

const DATOS = {
  carreras: [
    { id: 1, codigo: "LS", nombre: "Licenciatura en Sistemas", estado: "ACTIVO", materias: [1, 2, 3, 4, 5, 6] },
    { id: 2, codigo: "TUDW", nombre: "Tecnicatura Universitaria en Desarrollo Web", estado: "ACTIVO", materias: [1, 2, 3, 4, 7] }
  ],

  materias: [
    { id: 1, codigo: "PW1", nombre: "Programación Web I", anio: 1, cargaHoraria: 96, correlativas: [] },
    { id: 2, codigo: "PW2", nombre: "Programación Web II", anio: 2, cargaHoraria: 96, correlativas: [1] },
    { id: 3, codigo: "DAW", nombre: "Diseño de Aplicaciones", anio: 2, cargaHoraria: 96, correlativas: [2] },
    { id: 4, codigo: "BD1", nombre: "Bases de Datos", anio: 2, cargaHoraria: 96, correlativas: [1] },
    { id: 5, codigo: "ARQ", nombre: "Arquitectura de Computadoras", anio: 1, cargaHoraria: 64, correlativas: [] },
    { id: 6, codigo: "SO1", nombre: "Sistemas Operativos", anio: 2, cargaHoraria: 64, correlativas: [5] },
    { id: 7, codigo: "DIN", nombre: "Diseño de Interfaces", anio: 2, cargaHoraria: 64, correlativas: [] }
  ],

  docentes: [
    { id: 1, legajo: "D-101", nombre: "Marcos", apellido: "Pérez", email: "perez@unlam.edu.ar", estado: "ACTIVO", especialidad: "Ingeniería de Software" },
    { id: 2, legajo: "D-102", nombre: "Laura", apellido: "Gómez", email: "gomez@unlam.edu.ar", estado: "ACTIVO", especialidad: "Desarrollo Web" },
    { id: 3, legajo: "D-103", nombre: "Pablo", apellido: "Díaz", email: "diaz@unlam.edu.ar", estado: "ACTIVO", especialidad: "Arquitectura de Software" },
    { id: 4, legajo: "D-104", nombre: "Silvia", apellido: "Ruiz", email: "ruiz@unlam.edu.ar", estado: "ACTIVO", especialidad: "Programación" },
    { id: 5, legajo: "D-105", nombre: "Hernán", apellido: "Sosa", email: "sosa@unlam.edu.ar", estado: "ACTIVO", especialidad: "Bases de Datos" },
    { id: 6, legajo: "D-106", nombre: "Carla", apellido: "Molina", email: "molina@unlam.edu.ar", estado: "ACTIVO", especialidad: "Sistemas Operativos" }
  ],

  estudiantes: [
    { id: 1, legajo: "45213", nombre: "Lucía", apellido: "Fernández", email: "lucia.fernandez@alumnos.unlam.edu.ar", documento: "40111222", estado: "ACTIVO", estadoAcademico: "ACTIVO", carreraId: 1 },
    { id: 2, legajo: "45870", nombre: "Mateo", apellido: "Gómez", email: "mateo.gomez@alumnos.unlam.edu.ar", documento: "41222333", estado: "ACTIVO", estadoAcademico: "ACTIVO", carreraId: 1 },
    { id: 3, legajo: "46002", nombre: "Valentina", apellido: "Rossi", email: "valentina.rossi@alumnos.unlam.edu.ar", documento: "42333444", estado: "ACTIVO", estadoAcademico: "ACTIVO", carreraId: 2 },
    { id: 4, legajo: "44100", nombre: "Tomás", apellido: "Benítez", email: "tomas.benitez@alumnos.unlam.edu.ar", documento: "39444555", estado: "INACTIVO", estadoAcademico: "INACTIVO", carreraId: 1 }
  ],

  comisiones: [
    /* Comisiones históricas (cursadas ya finalizadas, no se ofrecen para inscripción) */
    { id: 101, codigo: "H1", materiaId: 1, docenteId: 4, dia: "Lunes", horaInicio: "18:00", horaFin: "22:00", aula: "101", cupo: 40, ocupacionInicial: 0, estado: "FINALIZADA", periodo: "2025 - 2.º cuatrimestre" },
    { id: 102, codigo: "H1", materiaId: 2, docenteId: 2, dia: "Lunes", horaInicio: "18:00", horaFin: "22:00", aula: "102", cupo: 40, ocupacionInicial: 0, estado: "FINALIZADA", periodo: "2025 - 2.º cuatrimestre" },

    /* Programación Web I */
    { id: 201, codigo: "A1", materiaId: 1, docenteId: 4, dia: "Martes", horaInicio: "18:00", horaFin: "22:00", aula: "201", cupo: 35, ocupacionInicial: 10, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },
    { id: 202, codigo: "B1", materiaId: 1, docenteId: 2, dia: "Jueves", horaInicio: "14:00", horaFin: "18:00", aula: "202", cupo: 35, ocupacionInicial: 18, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },

    /* Programación Web II */
    { id: 211, codigo: "A1", materiaId: 2, docenteId: 1, dia: "Jueves", horaInicio: "18:00", horaFin: "22:00", aula: "211", cupo: 35, ocupacionInicial: 20, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },

    /* Diseño de Aplicaciones */
    { id: 301, codigo: "A1", materiaId: 3, docenteId: 1, dia: "Lunes", horaInicio: "18:00", horaFin: "22:00", aula: "301", cupo: 40, ocupacionInicial: 28, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },
    { id: 302, codigo: "B2", materiaId: 3, docenteId: 2, dia: "Miércoles", horaInicio: "18:00", horaFin: "22:00", aula: "302", cupo: 40, ocupacionInicial: 40, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },
    { id: 303, codigo: "C1", materiaId: 3, docenteId: 3, dia: "Sábado", horaInicio: "09:00", horaFin: "13:00", aula: "303", cupo: 30, ocupacionInicial: 25, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },
    { id: 304, codigo: "D3", materiaId: 3, docenteId: 3, dia: "Viernes", horaInicio: "18:00", horaFin: "22:00", aula: "304", cupo: 30, ocupacionInicial: 12, estado: "INSCRIPCION_CERRADA", periodo: "2026 - 2.º cuatrimestre" },

    /* Bases de Datos */
    { id: 401, codigo: "A1", materiaId: 4, docenteId: 5, dia: "Miércoles", horaInicio: "14:00", horaFin: "18:00", aula: "401", cupo: 35, ocupacionInicial: 15, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },

    /* Arquitectura de Computadoras */
    { id: 501, codigo: "A1", materiaId: 5, docenteId: 6, dia: "Sábado", horaInicio: "10:00", horaFin: "12:00", aula: "501", cupo: 30, ocupacionInicial: 12, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },
    { id: 502, codigo: "B1", materiaId: 5, docenteId: 6, dia: "Martes", horaInicio: "18:00", horaFin: "20:00", aula: "502", cupo: 30, ocupacionInicial: 9, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },

    /* Sistemas Operativos */
    { id: 601, codigo: "A1", materiaId: 6, docenteId: 6, dia: "Jueves", horaInicio: "18:00", horaFin: "22:00", aula: "601", cupo: 30, ocupacionInicial: 5, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" },

    /* Diseño de Interfaces */
    { id: 701, codigo: "A1", materiaId: 7, docenteId: 3, dia: "Viernes", horaInicio: "18:00", horaFin: "22:00", aula: "701", cupo: 30, ocupacionInicial: 8, estado: "INSCRIPCION_ABIERTA", periodo: "2026 - 2.º cuatrimestre" }
  ],

  /* Inscripciones existentes al iniciar la demo */
  inscripciones: [
    /* Lucía: aprobó Programación Web I y II; cursa Arquitectura (sábado 10 a 12) */
    { id: 1, estudianteId: 1, comisionId: 101, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 8, fecha: "2025-12-10", estado: "CERRADA" }] },
    { id: 2, estudianteId: 1, comisionId: 102, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 7, fecha: "2025-12-12", estado: "CERRADA" }] },
    { id: 3, estudianteId: 1, comisionId: 501, fecha: "2026-08-03", estado: "APROBADA", observaciones: "", calificaciones: [] },

    /* Mateo: solo aprobó Programación Web I (le falta Programación Web II) */
    { id: 4, estudianteId: 2, comisionId: 101, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 6, fecha: "2025-12-10", estado: "CERRADA" }] },

    /* Valentina: aprobó PW I y II y ya está inscripta en Diseño de Aplicaciones A1 */
    { id: 5, estudianteId: 3, comisionId: 101, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 9, fecha: "2025-12-10", estado: "CERRADA" }] },
    { id: 6, estudianteId: 3, comisionId: 102, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 8, fecha: "2025-12-12", estado: "CERRADA" }] },
    { id: 7, estudianteId: 3, comisionId: 301, fecha: "2026-08-03", estado: "APROBADA", observaciones: "", calificaciones: [] },

    /* Tomás: dado de baja (usuario inactivo) */
    { id: 8, estudianteId: 4, comisionId: 101, fecha: "2025-08-04", estado: "FINALIZADA", observaciones: "", calificaciones: [{ tipo: "FINAL", nota: 5, fecha: "2025-12-10", estado: "CERRADA" }] }
  ]
};
