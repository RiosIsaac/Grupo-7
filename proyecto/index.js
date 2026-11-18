"use strict";

/*
 * index.js
 * Capa de presentación (clase «boundary» :PantallaInscripcion del DS01-a).
 * Solo maneja la interfaz: toda la lógica de negocio vive en
 * modelo.js y controlador.js.
 */
(function () {
  const repo = new Repositorio(DATOS);
  const controlador = new InscripcionController(repo);

  /* ================= Escenarios de prueba ================= */

  const ESCENARIOS = [
    { n: 1, titulo: "Inscripción exitosa", est: 1, mat: 3, com: 301, demo: false,
      desc: "Lucía Fernández se inscribe a Diseño de Aplicaciones, comisión A1. Cumple todas las reglas.",
      esperado: "Aprobada" },
    { n: 2, titulo: "Comisión sin cupo", est: 1, mat: 3, com: 302, demo: true,
      desc: "Lucía intenta inscribirse a la comisión B2 de Diseño de Aplicaciones, que tiene 0 de 40 cupos.",
      esperado: "Rechazada · E3 (RN04)" },
    { n: 3, titulo: "Estudiante ya inscripto", est: 3, mat: 3, com: 303, demo: false,
      desc: "Valentina Rossi ya está inscripta en la comisión A1 de Diseño de Aplicaciones y prueba con la C1.",
      esperado: "Rechazada · E4 (RN05)" },
    { n: 4, titulo: "Correlativas incumplidas", est: 2, mat: 3, com: 301, demo: false,
      desc: "Mateo Gómez no aprobó Programación Web II, correlativa de Diseño de Aplicaciones.",
      esperado: "Rechazada · E5 (RN06)" },
    { n: 5, titulo: "Materia fuera de la carrera", est: 3, mat: 5, com: 501, demo: true,
      desc: "Valentina (Tecnicatura en Desarrollo Web) intenta cursar Arquitectura de Computadoras, de la Licenciatura.",
      esperado: "Rechazada · E2 (RN02)" },
    { n: 6, titulo: "Estudiante no habilitado", est: 4, mat: 3, com: 301, demo: false,
      desc: "Tomás Benítez fue dado de baja: su usuario está inactivo.",
      esperado: "Rechazada · E1 (RN01)" },
    { n: 7, titulo: "Inscripción cerrada", est: 1, mat: 3, com: 304, demo: true,
      desc: "Lucía intenta inscribirse a la comisión D3, cuyo período de inscripción terminó.",
      esperado: "Rechazada · E6 (RN03)" },
    { n: 8, titulo: "Horario superpuesto", est: 1, mat: 3, com: 303, demo: false,
      desc: "La comisión C1 (sábado 09:00 a 13:00) se superpone con Arquitectura (sábado 10:00 a 12:00), donde Lucía ya cursa.",
      esperado: "Rechazada · E7 (RN07)" }
  ];

  /* ================= Estado de la pantalla ================= */

  const estado = {
    estudianteId: DATOS.estudiantes[0].id,
    materiaId: null,
    comisionId: null,
    modoDemo: false,
    procesando: false,
    ultimaInscripcion: null,
    ultimoResultado: null
  };

  /* ================= Utilidades ================= */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function esc(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function esperar(ms) {
    return new Promise((resolver) => setTimeout(resolver, ms));
  }

  function insignia(texto, clase) {
    return `<span class="insignia insignia--${esc(clase)}">${esc(texto)}</span>`;
  }

  function insigniaInscripcion(inscripcion) {
    return insignia(ETIQUETA_ESTADO_INSCRIPCION[inscripcion.estado], inscripcion.estado.toLowerCase());
  }

  function insigniaComision(comision) {
    return insignia(ETIQUETA_ESTADO_COMISION[comision.estado], comision.estado.toLowerCase());
  }

  function formatearFecha(iso) {
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  }

  let temporizadorToast = null;
  function mostrarToast(mensaje, tipo) {
    const toast = $("#toast");
    toast.textContent = mensaje;
    toast.className = "toast" + (tipo ? ` toast--${tipo}` : "");
    toast.hidden = false;
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function estudianteActual() {
    return controlador.obtenerContexto(estado.estudianteId).estudiante;
  }

  function comisionElegida() {
    return estado.comisionId ? repo.buscarComision(estado.comisionId) : null;
  }

  function reiniciarSeleccion() {
    estado.materiaId = null;
    estado.comisionId = null;
    estado.ultimaInscripcion = null;
    estado.ultimoResultado = null;
  }

  /* ================= Render: encabezado y estudiante ================= */

  function renderSelectorEstudiantes() {
    $("#selEstudiante").innerHTML = repo.estudiantes
      .map((e) => {
        const sufijo = e.puedeInscribirse() ? "" : " (no habilitado)";
        const elegido = e.idUsuario === estado.estudianteId ? "selected" : "";
        return `<option value="${e.idUsuario}" ${elegido}>${esc(e.getNombreCompleto())} · Leg. ${esc(e.legajo)}${sufijo}</option>`;
      })
      .join("");
  }

  function renderEstudiante() {
    const { estudiante: e, carrera } = controlador.obtenerContexto(estado.estudianteId);
    const vigentes = e.consultarInscripciones().filter((i) => i.estaVigente()).length;

    $("#datosEstudiante").innerHTML = `
      <dl class="datos">
        <div><dt>Estudiante</dt><dd>${esc(e.getNombreCompleto())}</dd></div>
        <div><dt>Legajo</dt><dd>${esc(e.legajo)}</dd></div>
        <div><dt>Carrera</dt><dd>${esc(carrera.nombre)}</dd></div>
        <div><dt>Acceso al sistema</dt><dd>${insignia(e.estado === EstadoGeneral.ACTIVO ? "Activo" : "Inactivo", e.estado.toLowerCase())}</dd></div>
        <div><dt>Situación académica</dt><dd>${insignia(e.estadoAcademico.charAt(0) + e.estadoAcademico.slice(1).toLowerCase(), e.estadoAcademico.toLowerCase())}</dd></div>
        <div><dt>Inscripciones vigentes</dt><dd>${vigentes}</dd></div>
      </dl>`;
  }

  /* ================= Render: paso 1 (materias) ================= */

  function renderMaterias() {
    const select = $("#selMateria");
    const mensaje = $("#mensajeMaterias");
    const lista = controlador.materiasDisponibles(estado.estudianteId, estado.modoDemo);

    if (lista.length === 0) {
      /* A1: no hay materias disponibles */
      select.innerHTML = "";
      select.disabled = true;
      mensaje.textContent = "No hay materias disponibles para su carrera.";
      mensaje.hidden = false;
      return;
    }

    mensaje.hidden = true;
    select.disabled = estado.procesando;
    select.innerHTML =
      `<option value="">Seleccioná una materia…</option>` +
      lista
        .map(({ materia, deLaCarrera }) => {
          const elegido = materia.idMateria === estado.materiaId ? "selected" : "";
          const sufijo = deLaCarrera ? "" : " (otra carrera)";
          return `<option value="${materia.idMateria}" ${elegido}>${esc(materia.nombre)}${sufijo}</option>`;
        })
        .join("");
  }

  /* ================= Render: paso 2 (comisiones) ================= */

  function renderComisiones() {
    const contenedor = $("#contenedorComisiones");

    if (!estado.materiaId) {
      contenedor.innerHTML = `<p class="vacio">Elegí una materia para ver sus comisiones.</p>`;
      return;
    }

    const comisiones = controlador.obtenerComisiones(estado.materiaId, estado.modoDemo);

    if (comisiones.length === 0) {
      /* A2: la materia no tiene comisiones con inscripción abierta */
      contenedor.innerHTML = `<p class="mensaje mensaje--aviso">La materia seleccionada no tiene comisiones con inscripción abierta. Elegí otra materia.</p>`;
      return;
    }

    const filas = comisiones
      .map((c) => {
        const elegida = c.idComision === estado.comisionId;
        const sinCupo = !c.verificarCupo();
        const bloqueada = (sinCupo && !estado.modoDemo) || estado.procesando;
        let textoBoton = elegida ? "Elegida" : "Elegir";
        if (sinCupo && !estado.modoDemo) textoBoton = "Sin cupo";

        const subestado = c.consultarDisponibilidad()
          ? insignia(c.getSubestadoCupo(), c.getSubestadoCupo() === "Con cupo" ? "con-cupo" : "sin-cupo")
          : insigniaComision(c);

        return `
          <tr class="${elegida ? "fila--elegida" : ""}">
            <td><strong>${esc(c.codigo)}</strong></td>
            <td>${esc(c.getHorario())}</td>
            <td>${esc(c.getDocente().getNombreCorto())}</td>
            <td>${c.cuposDisponibles()} de ${c.cupo} ${subestado}</td>
            <td><button type="button" class="boton boton--chico" data-comision="${c.idComision}" ${bloqueada ? "disabled" : ""}>${textoBoton}</button></td>
          </tr>`;
      })
      .join("");

    contenedor.innerHTML = `
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead><tr><th>Comisión</th><th>Día y horario</th><th>Docente</th><th>Cupos</th><th>Elegir</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  /* ================= Render: paso 3 (resumen) ================= */

  function renderResumen() {
    const contenedor = $("#resumen");
    const comision = comisionElegida();
    const btnConfirmar = $("#btnConfirmar");
    const btnCancelar = $("#btnCancelar");

    if (!comision) {
      contenedor.innerHTML = `<p class="vacio">Todavía no elegiste una comisión.</p>`;
      btnConfirmar.disabled = true;
      btnCancelar.disabled = estado.procesando;
      return;
    }

    const inscripcion = estado.ultimaInscripcion;
    let filaEstado;
    let aviso = "";

    if (!inscripcion) {
      filaEstado = `<dd>—</dd>`;
      aviso = `<p class="mensaje mensaje--info">Todavía no existe la inscripción. Al confirmar se registra como Pendiente y se verifican las condiciones.</p>`;
    } else if (inscripcion.estado === EstadoInscripcion.PENDIENTE) {
      filaEstado = `<dd>${insigniaInscripcion(inscripcion)}</dd>`;
      aviso = `<p class="mensaje mensaje--aviso"><span class="girando" aria-hidden="true"></span>Verificando condiciones…</p>`;
    } else if (inscripcion.estado === EstadoInscripcion.APROBADA) {
      filaEstado = `<dd>${insigniaInscripcion(inscripcion)}</dd>`;
      aviso = `<p class="mensaje mensaje--ok">La inscripción se realizó correctamente.</p>`;
    } else {
      filaEstado = `<dd>${insigniaInscripcion(inscripcion)}</dd>`;
      aviso = `<p class="mensaje mensaje--error">${esc(inscripcion.observaciones)}</p>`;
    }

    contenedor.innerHTML = `
      <dl class="resumen">
        <div><dt>Materia</dt><dd>${esc(comision.materia.nombre)}</dd></div>
        <div><dt>Comisión</dt><dd>${esc(comision.codigo)} · ${esc(comision.getHorario())}</dd></div>
        <div><dt>Docente</dt><dd>${esc(comision.getDocente().getNombreCorto())}</dd></div>
        <div><dt>Estado</dt>${filaEstado}</div>
      </dl>
      ${aviso}`;

    const yaAprobada = inscripcion && inscripcion.estado === EstadoInscripcion.APROBADA && inscripcion.comision === comision;
    btnConfirmar.disabled = estado.procesando || yaAprobada;
    btnCancelar.disabled = estado.procesando;
  }

  /* ================= Render: detalle de verificación ================= */

  function renderVerificacion() {
    const contenedor = $("#verificacion");
    const inscripcion = estado.ultimaInscripcion;
    const resultado = estado.ultimoResultado;

    if (inscripcion && inscripcion.estado === EstadoInscripcion.PENDIENTE) {
      contenedor.innerHTML = `<p class="vacio">Verificando…</p>`;
      return;
    }

    if (!resultado) {
      contenedor.innerHTML = `<p class="vacio">Al confirmar la inscripción se muestra acá el resultado de cada regla.</p>`;
      return;
    }

    const iconos = { ok: "✓", error: "✕", omitida: "–" };
    const items = resultado.pasos
      .map((p) => {
        const detalle = p.resultado === "error"
          ? `${esc(p.mensaje)} <strong>(excepción ${esc(p.regla.excepcion)})</strong>`
          : esc(p.mensaje);
        return `
          <li class="paso--${p.resultado}">
            <span class="pasos__icono" aria-hidden="true">${iconos[p.resultado]}</span>
            <div>
              <div><span class="pasos__regla">${esc(p.regla.codigo)}</span> · ${esc(p.regla.descripcion)}</div>
              <div class="pasos__detalle">${detalle}</div>
            </div>
          </li>`;
      })
      .join("");

    contenedor.innerHTML = `<ol class="pasos">${items}</ol>`;
  }

  /* ================= Render: mis inscripciones ================= */

  function renderMisInscripciones() {
    const contenedor = $("#contenedorInscripciones");
    const lista = estudianteActual()
      .consultarInscripciones()
      .sort((a, b) => b.idInscripcion - a.idInscripcion);

    if (lista.length === 0) {
      contenedor.innerHTML = `<p class="vacio">Todavía no tiene inscripciones.</p>`;
      return;
    }

    const filas = lista
      .map((i) => {
        const c = i.comision;
        const accion = i.estado === EstadoInscripcion.APROBADA
          ? `<button type="button" class="boton boton--peligro boton--chico" data-cancelar="${i.idInscripcion}">Cancelar inscripción</button>`
          : "—";
        return `
          <tr>
            <td>${i.idInscripcion}</td>
            <td><strong>${esc(c.materia.nombre)}</strong></td>
            <td>${esc(c.codigo)} · ${esc(c.getHorario())}</td>
            <td>${esc(c.getDocente().getNombreCorto())}</td>
            <td>${formatearFecha(i.fecha)}</td>
            <td>${insigniaInscripcion(i)}</td>
            <td class="motivo">${i.estado === EstadoInscripcion.RECHAZADA ? esc(i.observaciones) : ""}</td>
            <td>${accion}</td>
          </tr>`;
      })
      .join("");

    contenedor.innerHTML = `
      <p class="texto-ayuda">Solo ocupan cupo las inscripciones Aprobada y En curso (vigentes). El estudiante solo puede cancelar una inscripción Aprobada (RF23).</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead><tr><th>N.º</th><th>Materia</th><th>Comisión</th><th>Docente</th><th>Fecha</th><th>Estado</th><th>Observaciones</th><th>Acción</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  /* ================= Render: oferta académica ================= */

  function renderOferta() {
    const contenedor = $("#contenedorOferta");
    const { carrera } = controlador.obtenerContexto(estado.estudianteId);

    const bloques = carrera
      .consultarMaterias()
      .map((m) => {
        const comisiones = controlador.obtenerComisiones(m.idMateria, true);
        const correlativas = m.correlativas.length ? m.correlativas.map((k) => k.nombre).join(", ") : "Sin correlativas";

        const filas = comisiones.length
          ? comisiones
              .map((c) => `
                <tr>
                  <td><strong>${esc(c.codigo)}</strong></td>
                  <td>${esc(c.getHorario())}</td>
                  <td>${esc(c.getDocente().getNombreCompleto())}</td>
                  <td>${esc(c.aula)}</td>
                  <td>${c.cuposDisponibles()} de ${c.cupo}</td>
                  <td>${insigniaComision(c)}</td>
                </tr>`)
              .join("")
          : `<tr><td colspan="6" class="vacio">Sin comisiones habilitadas.</td></tr>`;

        return `
          <section class="card oferta-materia">
            <h3 class="card__titulo">${esc(m.nombre)}</h3>
            <p class="oferta-materia__meta">${m.anio}.º año · ${m.cargaHoraria} h · Correlativas: ${esc(correlativas)}</p>
            <div class="tabla-contenedor">
              <table class="tabla">
                <thead><tr><th>Comisión</th><th>Día y horario</th><th>Docente</th><th>Aula</th><th>Cupos</th><th>Estado</th></tr></thead>
                <tbody>${filas}</tbody>
              </table>
            </div>
          </section>`;
      })
      .join("");

    contenedor.innerHTML = bloques;
  }

  /* ================= Render: escenarios ================= */

  function renderEscenarios() {
    $("#contenedorEscenarios").innerHTML = ESCENARIOS.map((s) => `
      <article class="escenario">
        <div class="escenario__titulo">Escenario ${s.n} · ${esc(s.titulo)}</div>
        <p class="escenario__desc">${esc(s.desc)}</p>
        <p class="escenario__esperado"><strong>Resultado esperado:</strong> ${esc(s.esperado)}</p>
        <button type="button" class="boton boton--chico" data-escenario="${s.n}">Cargar escenario</button>
      </article>`).join("");
  }

  function renderTodo() {
    renderSelectorEstudiantes();
    renderEstudiante();
    renderMaterias();
    renderComisiones();
    renderResumen();
    renderVerificacion();
    renderMisInscripciones();
    renderOferta();
  }

  /* ================= Acciones ================= */

  function cambiarPestana(nombre) {
    $$(".tab").forEach((t) => {
      const activa = t.dataset.tab === nombre;
      t.classList.toggle("tab--activa", activa);
      t.setAttribute("aria-selected", String(activa));
    });
    $$(".vista").forEach((v) => v.classList.toggle("vista--activa", v.dataset.vista === nombre));
  }

  /* Pasos 5 a 10 del CU01 */
  async function confirmarInscripcion() {
    const comision = comisionElegida();
    if (!comision || estado.procesando) return;

    estado.procesando = true;
    estado.ultimoResultado = null;
    /* Paso 7: se registra la solicitud como inscripción Pendiente */
    estado.ultimaInscripcion = controlador.solicitarInscripcion(estado.estudianteId, comision.idComision);
    renderTodo();

    /* Pausa breve para que se vea el estado Pendiente */
    await esperar(1000);

    /* Pasos 8 y 9: verificar condiciones y aprobar o rechazar */
    estado.ultimoResultado = controlador.procesarInscripcion(estado.ultimaInscripcion);
    estado.procesando = false;
    renderTodo();

    if (estado.ultimoResultado.ok) {
      mostrarToast("Inscripción aprobada", "ok");
    } else {
      mostrarToast(`Inscripción rechazada (${estado.ultimoResultado.excepcion})`, "error");
    }
  }

  function cancelarProceso() {
    /* A4: el estudiante cancela antes de confirmar y no se registra nada */
    reiniciarSeleccion();
    renderTodo();
  }

  function cancelarInscripcionAprobada(idInscripcion) {
    if (!window.confirm("¿Querés cancelar esta inscripción? Se libera el cupo de la comisión.")) return;
    try {
      controlador.cancelarInscripcion(idInscripcion);
      mostrarToast("Inscripción cancelada", "ok");
    } catch (error) {
      mostrarToast(error.message, "error");
    }
    estado.ultimaInscripcion = null;
    estado.ultimoResultado = null;
    renderTodo();
  }

  function cargarEscenario(numero) {
    const s = ESCENARIOS.find((x) => x.n === numero);
    if (!s) return;
    estado.estudianteId = s.est;
    estado.modoDemo = s.demo;
    estado.materiaId = s.mat;
    estado.comisionId = s.com;
    estado.ultimaInscripcion = null;
    estado.ultimoResultado = null;
    $("#chkDemo").checked = s.demo;
    cambiarPestana("inscribirse");
    renderTodo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reiniciarDemo() {
    repo.reiniciar();
    reiniciarSeleccion();
    renderTodo();
    mostrarToast("Datos de demostración reiniciados", "ok");
  }

  /* ================= Eventos ================= */

  function enlazarEventos() {
    $("#selEstudiante").addEventListener("change", (ev) => {
      estado.estudianteId = Number(ev.target.value);
      reiniciarSeleccion();
      renderTodo();
    });

    $("#selMateria").addEventListener("change", (ev) => {
      estado.materiaId = ev.target.value ? Number(ev.target.value) : null;
      estado.comisionId = null;
      estado.ultimaInscripcion = null;
      estado.ultimoResultado = null;
      renderTodo();
    });

    $("#chkDemo").addEventListener("change", (ev) => {
      estado.modoDemo = ev.target.checked;
      reiniciarSeleccion();
      renderTodo();
    });

    $("#contenedorComisiones").addEventListener("click", (ev) => {
      const boton = ev.target.closest("[data-comision]");
      if (!boton || boton.disabled) return;
      estado.comisionId = Number(boton.dataset.comision);
      estado.ultimaInscripcion = null;
      estado.ultimoResultado = null;
      renderTodo();
    });

    $("#btnConfirmar").addEventListener("click", confirmarInscripcion);
    $("#btnCancelar").addEventListener("click", cancelarProceso);

    $("#contenedorInscripciones").addEventListener("click", (ev) => {
      const boton = ev.target.closest("[data-cancelar]");
      if (boton) cancelarInscripcionAprobada(Number(boton.dataset.cancelar));
    });

    $("#contenedorEscenarios").addEventListener("click", (ev) => {
      const boton = ev.target.closest("[data-escenario]");
      if (boton) cargarEscenario(Number(boton.dataset.escenario));
    });

    $("#btnReiniciar").addEventListener("click", reiniciarDemo);

    $$(".tab").forEach((tab) => tab.addEventListener("click", () => cambiarPestana(tab.dataset.tab)));
  }

  /* ================= Inicio ================= */

  renderEscenarios();
  enlazarEventos();
  renderTodo();
})();
