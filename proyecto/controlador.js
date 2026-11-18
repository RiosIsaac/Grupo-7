"use strict";

/*
 * controlador.js
 * - Repositorio: arma el modelo desde DATOS y guarda las inscripciones
 *   en localStorage (simula la persistencia).
 * - REGLAS_INSCRIPCION: RN01 a RN07, en el mismo orden que DS01-b.
 * - InscripcionController: clase «control» del diagrama de secuencia DS01-a.
 */

const CLAVE_ALMACENAMIENTO = "mvp-inscripcion-materia-v1";

/* ================= Repositorio ================= */

class Repositorio {
  constructor(datos) {
    this.datos = datos;
    this.construir(this.leerGuardado() || datos.inscripciones);
  }

  construir(inscripcionesPlanas) {
    const d = this.datos;

    this.docentes = d.docentes.map((x) => new Docente(x));
    this.materias = d.materias.map((x) => new Materia(x));
    this.carreras = d.carreras.map((x) => new Carrera(x));
    this.estudiantes = d.estudiantes.map((x) => new Estudiante(x));
    this.comisiones = d.comisiones.map((x) => new Comision(x));

    /* Correlativas */
    d.materias.forEach((plano) => {
      const materia = this.buscarMateria(plano.id);
      materia.correlativas = plano.correlativas.map((id) => this.buscarMateria(id));
    });

    /* Carrera - materias */
    d.carreras.forEach((plano) => {
      const carrera = this.buscarCarrera(plano.id);
      plano.materias.forEach((id) => carrera.agregarMateria(this.buscarMateria(id)));
    });

    /* Estudiante - carrera */
    d.estudiantes.forEach((plano) => {
      this.buscarEstudiante(plano.id).carrera = this.buscarCarrera(plano.carreraId);
    });

    /* Comisión - materia y docente */
    d.comisiones.forEach((plano) => {
      const comision = this.buscarComision(plano.id);
      comision.materia = this.buscarMateria(plano.materiaId);
      comision.docente = this.buscarDocente(plano.docenteId);
      comision.materia.comisiones.push(comision);
    });

    /* Inscripciones */
    this.inscripciones = [];
    let maxId = 0;
    inscripcionesPlanas.forEach((plano) => {
      const estudiante = this.buscarEstudiante(plano.estudianteId);
      const comision = this.buscarComision(plano.comisionId);
      if (!estudiante || !comision) return;

      const inscripcion = new Inscripcion({
        id: plano.id,
        estudiante: estudiante,
        comision: comision,
        fecha: plano.fecha,
        estado: plano.estado,
        observaciones: plano.observaciones
      });
      (plano.calificaciones || []).forEach((c) => inscripcion.agregarCalificacion(new Calificacion(c)));

      estudiante.inscripciones.push(inscripcion);
      if (inscripcion.estaVigente()) comision.agregarEstudiante(inscripcion);
      this.inscripciones.push(inscripcion);
      maxId = Math.max(maxId, plano.id);
    });
    Inscripcion.contador = maxId;
  }

  reiniciar() {
    try {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    } catch (e) {
      /* sin almacenamiento disponible: se reinicia igual en memoria */
    }
    this.construir(this.datos.inscripciones);
  }

  leerGuardado() {
    try {
      const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (!texto) return null;
      const lista = JSON.parse(texto);
      return Array.isArray(lista) ? lista : null;
    } catch (e) {
      return null;
    }
  }

  guardar() {
    try {
      const planas = this.estudiantes.flatMap((e) => e.inscripciones.map((i) => i.aPlano()));
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(planas));
    } catch (e) {
      /* el MVP sigue funcionando sin persistencia */
    }
  }

  buscarEstudiante(id) { return this.estudiantes.find((x) => x.idUsuario === id); }
  buscarDocente(id) { return this.docentes.find((x) => x.idUsuario === id); }
  buscarCarrera(id) { return this.carreras.find((x) => x.idCarrera === id); }
  buscarMateria(id) { return this.materias.find((x) => x.idMateria === id); }
  buscarComision(id) { return this.comisiones.find((x) => x.idComision === id); }
}

/* ================= Reglas de negocio (DS01-b) ================= */

const REGLAS_INSCRIPCION = [
  {
    codigo: "RN01",
    excepcion: "E1",
    descripcion: "El estudiante está habilitado (usuario y situación académica activos)",
    cumple: (e) => e.puedeInscribirse(),
    motivo: () => "El estudiante no está habilitado para inscribirse (RN01)."
  },
  {
    codigo: "RN02",
    excepcion: "E2",
    descripcion: "La materia pertenece a la carrera del estudiante",
    cumple: (e, c) => c.materia.perteneceACarrera(e.carrera),
    motivo: (e, c) => `La materia ${c.materia.nombre} no pertenece a la carrera del estudiante (RN02).`
  },
  {
    codigo: "RN03",
    excepcion: "E6",
    descripcion: "La comisión tiene la inscripción abierta",
    cumple: (e, c) => c.consultarDisponibilidad(),
    motivo: (e, c) => `La comisión ${c.codigo} no tiene la inscripción abierta (RN03).`
  },
  {
    codigo: "RN04",
    excepcion: "E3",
    descripcion: "La comisión tiene cupo disponible",
    cumple: (e, c) => c.verificarCupo(),
    motivo: (e, c) => `La comisión ${c.codigo} no tiene cupo disponible (RN04).`
  },
  {
    codigo: "RN05",
    excepcion: "E4",
    descripcion: "No tiene otra inscripción vigente en la misma materia",
    cumple: (e, c) => !e.estaInscripto(c.materia),
    motivo: (e, c) => `Ya tiene una inscripción vigente en ${c.materia.nombre} (RN05).`
  },
  {
    codigo: "RN06",
    excepcion: "E5",
    descripcion: "Tiene aprobadas las correlativas de la materia",
    cumple: (e, c) => c.materia.cumpleCorrelativas(e),
    motivo: (e, c) => {
      const faltantes = c.materia.correlativasFaltantes(e).map((m) => m.nombre).join(", ");
      return `No tiene aprobada la correlativa ${faltantes} (RN06).`;
    }
  },
  {
    codigo: "RN07",
    excepcion: "E7",
    descripcion: "El horario no se superpone con otra inscripción vigente",
    cumple: (e, c) => !e.tieneSuperposicion(c),
    motivo: (e, c) => {
      const otra = e.inscripcionSuperpuesta(c);
      return `El horario se superpone con su inscripción vigente en ${otra.comision.materia.nombre} (comisión ${otra.comision.codigo}, ${otra.comision.getHorario()}) (RN07).`;
    }
  }
];

/* ================= Controlador ================= */

class InscripcionController {
  constructor(repositorio) {
    this.repo = repositorio;
  }

  /* obtenerContexto(idEst): datos del estudiante y su carrera */
  obtenerContexto(idEstudiante) {
    const estudiante = this.repo.buscarEstudiante(idEstudiante);
    return { estudiante: estudiante, carrera: estudiante.carrera };
  }

  /*
   * Materias que se muestran en el combo.
   * Modo normal: solo las de la carrera (Carrera.consultarMaterias).
   * Modo demostración: todas, para poder probar la excepción E2 (RN02).
   */
  materiasDisponibles(idEstudiante, todas) {
    const { carrera } = this.obtenerContexto(idEstudiante);
    const universo = todas ? this.repo.materias : carrera.consultarMaterias();
    return universo.map((m) => ({ materia: m, deLaCarrera: carrera.contieneMateria(m) }));
  }

  /*
   * Comisiones de una materia.
   * Modo normal: solo con inscripción abierta (paso 4 del CU01).
   * Modo demostración: también las de inscripción cerrada (excepción E6).
   */
  obtenerComisiones(idMateria, modoDemo) {
    const materia = this.repo.buscarMateria(idMateria);
    if (!materia) return [];
    return materia.consultarComisiones().filter((c) =>
      modoDemo
        ? c.estado === EstadoComision.INSCRIPCION_ABIERTA || c.estado === EstadoComision.INSCRIPCION_CERRADA
        : c.consultarDisponibilidad()
    );
  }

  /* Paso 7 del CU01: «create» Inscripcion en estado Pendiente */
  solicitarInscripcion(idEstudiante, idComision) {
    const estudiante = this.repo.buscarEstudiante(idEstudiante);
    const comision = this.repo.buscarComision(idComision);
    const inscripcion = estudiante.solicitarInscripcion(comision);
    this.repo.inscripciones.push(inscripcion);
    this.repo.guardar();
    return inscripcion;
  }

  /* DS01-b: verifica RN01 a RN07 en orden; se detiene en la primera que falla */
  verificarCondiciones(estudiante, comision) {
    const pasos = [];
    let falla = null;

    for (const regla of REGLAS_INSCRIPCION) {
      if (falla) {
        pasos.push({ regla: regla, resultado: "omitida", mensaje: "No evaluada" });
        continue;
      }
      if (regla.cumple(estudiante, comision)) {
        pasos.push({ regla: regla, resultado: "ok", mensaje: "Cumple" });
      } else {
        falla = { regla: regla, motivo: regla.motivo(estudiante, comision) };
        pasos.push({ regla: regla, resultado: "error", mensaje: falla.motivo });
      }
    }

    return {
      ok: falla === null,
      motivo: falla ? falla.motivo : "",
      excepcion: falla ? falla.regla.excepcion : "",
      regla: falla ? falla.regla.codigo : "",
      pasos: pasos
    };
  }

  /* Pasos 8 y 9 del CU01: verificar y pasar a Aprobada o Rechazada */
  procesarInscripcion(inscripcion) {
    const resultado = this.verificarCondiciones(inscripcion.estudiante, inscripcion.comision);
    if (resultado.ok) {
      inscripcion.aprobar();
    } else {
      inscripcion.rechazar(resultado.motivo);
    }
    this.repo.guardar();
    return resultado;
  }

  /* RF23: cancelar una inscripción Aprobada */
  cancelarInscripcion(idInscripcion) {
    const inscripcion = this.repo.inscripciones.find((i) => i.idInscripcion === idInscripcion);
    if (!inscripcion) throw new Error("No se encontró la inscripción.");
    inscripcion.estudiante.cancelarInscripcion(inscripcion);
    this.repo.guardar();
    return inscripcion;
  }
}
