// script.js actualizado con campo líder y validación de solo letras

const formulario = document.getElementById("formulario");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let dibujando = false;
const estado = document.getElementById("estado");
const estadoBusqueda = document.getElementById("estado-busqueda");

function ajustarCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 150;
}
ajustarCanvas();

// Fecha automática
document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = hoy;
});

canvas.addEventListener("mousedown", () => dibujando = true);
canvas.addEventListener("mouseup", () => { dibujando = false; ctx.beginPath(); });
canvas.addEventListener("mouseout", () => dibujando = false);
canvas.addEventListener("mousemove", dibujar);
canvas.addEventListener("touchstart", (e) => {
  dibujando = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener("touchend", () => { dibujando = false; ctx.beginPath(); });
canvas.addEventListener("touchmove", (e) => {
  if (!dibujando) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
  e.preventDefault();
}, { passive: false });

function dibujar(e) {
  if (!dibujando) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function obtenerSerialDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const serial = params.get("serial");
  if (serial) {
    document.getElementById("serial").value = serial;
  }
}

// LocalStorage
function guardarEnLocalStorage() {
  const campos = formulario.elements;
  for (let i = 0; i < campos.length; i++) {
    if (campos[i].name && campos[i].type !== "checkbox") {
      localStorage.setItem("form_" + campos[i].name, campos[i].value);
    }
  }
}

function cargarDesdeLocalStorage() {
  const campos = formulario.elements;
  for (let i = 0; i < campos.length; i++) {
    if (campos[i].name && campos[i].type !== "checkbox") {
      const valor = localStorage.getItem("form_" + campos[i].name);
      if (valor) campos[i].value = valor;
    }
  }
}

function limpiarLocalStorage() {
  const campos = formulario.elements;
  for (let i = 0; i < campos.length; i++) {
    if (campos[i].name) {
      localStorage.removeItem("form_" + campos[i].name);
    }
  }
}

// Validaciones básicas
formulario.nombre_colaborador.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
});
formulario.lider.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
});
formulario.cedula.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
});
formulario.codigo_sap.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
});
formulario.telefono.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
});

formulario.addEventListener("input", guardarEnLocalStorage);
cargarDesdeLocalStorage();

// Buscar colaborador por cédula
async function buscarColaborador() {
  const cedula = formulario.cedula.value.trim();
  if (cedula === "") {
    alert("Por favor ingrese una cédula válida.");
    return;
  }

  estadoBusqueda.innerHTML = '<span class="spinner-busqueda"></span>';
  estado.innerText = "";

  try {
    const response = await fetch("https://prod-29.westus.logic.azure.com:443/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HdukGAnPtKgdUMkC1kbIqxd6pRyp_oZ_Q35IAtZGr-M", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula })
    });

    const data = await response.json();

    if (data && data.nombre_colaborador) {
      formulario.nombre_colaborador.value = data.nombre_colaborador || "";
      formulario.telefono.value = data.telefono || "";
      formulario.agencia.value = data.agencia || "";
      estadoBusqueda.innerHTML = "✅";
      estado.innerText = "✅ Datos encontrados correctamente.";
    } else {
      formulario.nombre_colaborador.value = "";
      formulario.telefono.value = "";
      formulario.agencia.value = "";
      estadoBusqueda.innerHTML = "❌";
      estado.innerText = "⚠️ No se encontró información para esta cédula.";
    }

  } catch (error) {
    estadoBusqueda.innerHTML = "❌";
    estado.innerText = "❌ Error al consultar datos.";
    console.error(error);
  }
}

// Envío del formulario
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  estado.innerHTML = '<span class="spinner"></span> Enviando datos...';
  estado.classList.add("mostrar");

  if (!document.getElementById("aceptaCondiciones").checked) {
    estado.innerText = "❌ Debes aceptar las condiciones antes de enviar.";
    return;
  }

  const accesoriosSeleccionados = Array.from(
    formulario.querySelectorAll("input[name='accesorios']:checked")
  ).map(cb => cb.value).join(", ");

  const firmaDataURL = canvas.toDataURL("image/png");
  const firmaBase64 = firmaDataURL.split(",")[1];

  const data = {
    nombre: formulario.nombre_colaborador.value,
    cedula: formulario.cedula.value,
    fecha: formulario.fecha.value,
    codigo_sap: formulario.codigo_sap.value,
    telefono: formulario.telefono.value,
    estado_equipo: formulario.estado_equipo.value,
    accesorios: accesoriosSeleccionados,
    estado_bateria: formulario.estado_bateria.value,
    operacion: formulario.operacion.value,
    agencia: formulario.agencia.value,
    observaciones: formulario.observaciones.value,
    serial: formulario.serial.value,
    lider: formulario.lider.value,
    firma: firmaBase64
  };

  try {
    const response = await fetch("https://prod-47.westus.logic.azure.com:443/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eYvcvi9mTH8wpW3_QaYhkhae6jiMGh4C38LaL1eEAZI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      estado.innerText = "✅ Datos enviados correctamente.";
      formulario.reset();
      limpiarFirma();
      limpiarLocalStorage();
      estadoBusqueda.innerHTML = "";
    } else {
      estado.innerText = "❌ Error al enviar: " + response.status;
    }
  } catch (error) {
    estado.innerText = "❌ Error al enviar: " + error.message;
  }
});

obtenerSerialDesdeURL();


