"use strict";

/*
 * modelo.js
 * Clases del dominio, según el diagrama de clases corregido (versión 2)
 * de la segunda entrega: Usuario, Estudiante, Docente, Carrera, Materia,
 * Comision, Inscripcion y Calificacion, con sus enumeraciones.
 */

/* ================= Enumeraciones ================= */

const EstadoGeneral = Object.freeze({ ACTIVO: "ACTIVO", INACTIVO: "INACTIVO" });

const EstadoEstudiante = Object.freeze({ ACTIVO: "ACTIVO", INACTIVO: "INACTIVO", EGRESADO: "EGRESADO" });

const EstadoInscripcion = Object.freeze({
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
  EN_CURSO: "EN_CURSO",
  FINALIZADA: "FINALIZADA",
  CANCELADA: "CANCELADA"
});

const EstadoComision = Object.freeze({
  PLANIFICADA: "PLANIFICADA",
  INSCRIPCION_ABIERTA: "INSCRIPCION_ABIERTA",
  INSCRIPCION_CERRADA: "INSCRIPCION_CERRADA",
  EN_CURSO: "EN_CURSO",
  FINALIZADA: "FINALIZADA",
  CANCELADA: "CANCELADA"
});

const EstadoCalificacion = Object.freeze({ REGISTRADA: "REGISTRADA", MODIFICADA: "MODIFICADA", CERRADA: "CERRADA" });

const TipoCalificacion = Object.freeze({
  PARCIAL: "PARCIAL",
  RECUPERATORIO: "RECUPERATORIO",
  TRABAJO_PRACTICO: "TRABAJO_PRACTICO",
  FINAL: "FINAL"
});

const NOTA_APROBATORIA = 4; // RC05

const ETIQUETA_ESTADO_INSCRIPCION = Object.freeze({
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada"
});

const ETIQUETA_ESTADO_COMISION = Object.freeze({
  PLANIFICADA: "Planificada",
  INSCRIPCION_ABIERTA: "Inscripción abierta",
  INSCRIPCION_CERRADA: "Inscripción cerrada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada"
});

/* Transiciones permitidas del diagrama DE01 (estado de la inscripción) */
const TRANSICIONES_INSCRIPCION = Object.freeze({
  PENDIENTE: ["APROBADA", "RECHAZADA"],
  APROBADA: ["EN_CURSO", "CANCELADA"],
  EN_CURSO: ["FINALIZADA", "CANCELADA"],
  RECHAZADA: [],
  FINALIZADA: [],
  CANCELADA: []
});

/* ================= Utilidades ================= */

function aMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hoy() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ================= Usuarios ================= */

class Usuario {
  constructor({ id, nombre, apellido, email, estado }) {
    this.idUsuario = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.estado = estado || EstadoGeneral.ACTIVO;
  }

  getNombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }

  estaHabilitado() {
    return this.estado === EstadoGeneral.ACTIVO;
  }
}

class Docente extends Usuario {
  constructor(datos) {
    super(datos);
    this.legajo = datos.legajo;
    this.especialidad = datos.especialidad;
  }

  getNombreCorto() {
    return `Prof. ${this.apellido}`;
  }
}

class Estudiante extends Usuario {
  constructor(datos) {
    super(datos);
    this.legajo = datos.legajo;
    this.documento = datos.documento;
    this.estadoAcademico = datos.estadoAcademico || EstadoEstudiante.ACTIVO;
    this.carrera = null; // se asigna al armar el modelo
    this.inscripciones = []; // "realiza" 1..n
  }

  /* RN01 */
  puedeInscribirse() {
    return this.estaHabilitado() && this.estadoAcademico === EstadoEstudiante.ACTIVO;
  }

  solicitarInscripcion(comision) {
    const inscripcion = new Inscripcion({
      id: Inscripcion.siguienteId(),
      estudiante: this,
      comision: comision
    });
    this.inscripciones.push(inscripcion);
    return inscripcion;
  }

  cancelarInscripcion(inscripcion) {
    inscripcion.cancelar();
  }

  consultarInscripciones() {
    return [...this.inscripciones];
  }

  /* RN05: existe otra inscripción vigente en la misma materia */
  estaInscripto(materia) {
    return this.inscripciones.some((i) => i.estaVigente() && i.comision.materia === materia);
  }

  /* RC05: materia aprobada = inscripción Finalizada con FINAL aprobatoria */
  aproboMateria(materia) {
    return this.inscripciones.some(
      (i) => i.comision.materia === materia && i.estado === EstadoInscripcion.FINALIZADA && i.tieneFinalAprobatorio()
    );
  }

  /* RN07: devuelve la inscripción vigente que se superpone (o null) */
  inscripcionSuperpuesta(comision) {
    return this.inscripciones.find((i) => i.estaVigente() && i.comision.seSuperponeCon(comision)) || null;
  }

  tieneSuperposicion(comision) {
    return this.inscripcionSuperpuesta(comision) !== null;
  }
}

/* ================= Estructura académica ================= */

class Carrera {
  constructor({ id, codigo, nombre, estado }) {
    this.idCarrera = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.estado = estado || EstadoGeneral.ACTIVO;
    this.materias = [];
  }

  agregarMateria(materia) {
    if (!this.materias.includes(materia)) this.materias.push(materia);
  }

  consultarMaterias() {
    return [...this.materias];
  }

  contieneMateria(materia) {
    return this.materias.includes(materia);
  }
}

class Materia {
  constructor({ id, codigo, nombre, anio, cargaHoraria }) {
    this.idMateria = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.anio = anio;
    this.cargaHoraria = cargaHoraria;
    this.correlativas = [];
    this.comisiones = [];
  }

  consultarComisiones() {
    return [...this.comisiones];
  }

  comisionesDisponibles() {
    return this.comisiones.filter((c) => c.consultarDisponibilidad());
  }

  /* RN02 */
  perteneceACarrera(carrera) {
    return carrera.contieneMateria(this);
  }

  /* RN06 */
  cumpleCorrelativas(estudiante) {
    return this.correlativas.every((k) => estudiante.aproboMateria(k));
  }

  correlativasFaltantes(estudiante) {
    return this.correlativas.filter((k) => !estudiante.aproboMateria(k));
  }
}

class Comision {
  constructor({ id, codigo, dia, horaInicio, horaFin, aula, cupo, ocupacionInicial, estado, periodo }) {
    this.idComision = id;
    this.codigo = codigo;
    this.dia = dia;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.aula = aula;
    this.cupo = cupo;
    this.ocupacionInicial = ocupacionInicial || 0;
    this.estado = estado || EstadoComision.PLANIFICADA;
    this.periodo = periodo || "";
    this.materia = null;
    this.docente = null;
    this.inscripciones = []; // inscripciones aprobadas/vigentes que ocupan cupo
  }

  /* RN04 */
  verificarCupo() {
    return this.cuposDisponibles() > 0;
  }

  /* cupo - inscripciones vigentes */
  cuposDisponibles() {
    const vigentes = this.inscripciones.filter((i) => i.estaVigente()).length;
    return Math.max(0, this.cupo - this.ocupacionInicial - vigentes);
  }

  agregarEstudiante(inscripcion) {
    if (!this.inscripciones.includes(inscripcion)) this.inscripciones.push(inscripcion);
  }

  quitarEstudiante(inscripcion) {
    this.inscripciones = this.inscripciones.filter((i) => i !== inscripcion);
  }

  /* RN03 */
  consultarDisponibilidad() {
    return this.estado === EstadoComision.INSCRIPCION_ABIERTA;
  }

  /* RN07 */
  seSuperponeCon(otra) {
    if (this === otra || this.dia !== otra.dia) return false;
    return aMinutos(this.horaInicio) < aMinutos(otra.horaFin) && aMinutos(otra.horaInicio) < aMinutos(this.horaFin);
  }

  getDocente() {
    return this.docente;
  }

  getHorario() {
    return `${this.dia} ${this.horaInicio} a ${this.horaFin}`;
  }

  /* Subestados derivados de DE02: "Con cupo" / "Sin cupo" */
  getSubestadoCupo() {
    return this.cuposDisponibles() > 0 ? "Con cupo" : "Sin cupo";
  }
}

/* ================= Inscripción y calificación ================= */

class Calificacion {
  constructor({ tipo, nota, fecha, estado }) {
    this.tipo = tipo;
    this.nota = nota;
    this.fecha = fecha || hoy();
    this.estado = estado || EstadoCalificacion.REGISTRADA;
  }

  /* RC03 */
  validarNota() {
    return Number.isInteger(this.nota) && this.nota >= 0 && this.nota <= 10;
  }

  /* RC05 */
  esAprobatoria() {
    return this.nota >= NOTA_APROBATORIA;
  }

  cerrar() {
    this.estado = EstadoCalificacion.CERRADA;
  }
}

class Inscripcion {
  constructor({ id, estudiante, comision, fecha, estado, observaciones }) {
    this.idInscripcion = id;
    this.estudiante = estudiante;
    this.comision = comision;
    this.fecha = fecha || hoy();
    this.estado = estado || EstadoInscripcion.PENDIENTE;
    this.observaciones = observaciones || "";
    this.calificaciones = [];
  }

  static siguienteId() {
    Inscripcion.contador += 1;
    return Inscripcion.contador;
  }

  /* DE01: valida que la transición exista en el diagrama de estados */
  cambiarEstado(nuevoEstado) {
    const permitidas = TRANSICIONES_INSCRIPCION[this.estado] || [];
    if (!permitidas.includes(nuevoEstado)) {
      throw new Error(`Transición no permitida: ${this.estado} → ${nuevoEstado}`);
    }
    this.estado = nuevoEstado;
  }

  /* Pendiente → Aprobada: ocupa un cupo */
  aprobar() {
    this.cambiarEstado(EstadoInscripcion.APROBADA);
    this.comision.agregarEstudiante(this);
  }

  /* Pendiente → Rechazada: guarda el motivo, no ocupa cupo */
  rechazar(motivo) {
    this.cambiarEstado(EstadoInscripcion.RECHAZADA);
    this.observaciones = motivo;
  }

  /* RF23: el estudiante cancela solo en estado Aprobada; libera el cupo */
  cancelar() {
    if (this.estado !== EstadoInscripcion.APROBADA) {
      throw new Error("Solo se puede cancelar una inscripción en estado Aprobada (RF23).");
    }
    this.cambiarEstado(EstadoInscripcion.CANCELADA);
    this.comision.quitarEstudiante(this);
  }

  iniciarCursada() {
    this.cambiarEstado(EstadoInscripcion.EN_CURSO);
  }

  finalizar() {
    this.cambiarEstado(EstadoInscripcion.FINALIZADA);
    this.calificaciones.forEach((c) => c.cerrar());
  }

  /* RN08: solo Aprobada y En curso son vigentes */
  estaVigente() {
    return this.estado === EstadoInscripcion.APROBADA || this.estado === EstadoInscripcion.EN_CURSO;
  }

  getEstado() {
    return this.estado;
  }

  agregarCalificacion(calificacion) {
    this.calificaciones.push(calificacion);
  }

  tieneCalificacion(tipo) {
    return this.calificaciones.some((c) => c.tipo === tipo);
  }

  tieneFinalAprobatorio() {
    return this.calificaciones.some((c) => c.tipo === TipoCalificacion.FINAL && c.esAprobatoria());
  }

  aPlano() {
    return {
      id: this.idInscripcion,
      estudianteId: this.estudiante.idUsuario,
      comisionId: this.comision.idComision,
      fecha: this.fecha,
      estado: this.estado,
      observaciones: this.observaciones,
      calificaciones: this.calificaciones.map((c) => ({ tipo: c.tipo, nota: c.nota, fecha: c.fecha, estado: c.estado }))
    };
  }
}
Inscripcion.contador = 0;
