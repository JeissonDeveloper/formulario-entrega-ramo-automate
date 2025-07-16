const formulario = document.getElementById("formulario");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let dibujando = false;

function ajustarCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 150;
}
ajustarCanvas();

// Firma
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

// Validaciones
formulario.nombre_colaborador.addEventListener("input", (e) => {
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

// Fecha automática
window.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = hoy;
});

// 🔍 Buscar datos por cédula desde Power Automate
async function buscarColaborador() {
  const cedula = formulario.cedula.value.trim();
  if (cedula === "") {
    alert("Por favor ingrese una cédula válida.");
    return;
  }

  try {
    const response = await fetch(
      "https://default03db959ef51543569100cc4a9dcf25.8b.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/739b9a8a845f4960a244ce6b8e9228cb/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fHmjLuTbH7WPbACBvZthXYQZYM2jEK6sARJbFdbmugg",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cedula })
      }
    );

    const data = await response.json();

    if (data && data.nombre_colaborador) {
      formulario.nombre_colaborador.value = data.nombre_colaborador || "";
      formulario.telefono.value = data.telefono || "";
      formulario.agencia.value = data.agencia || "";
    } else {
      alert("⚠️ No se encontró información para esta cédula.");
    }
  } catch (error) {
    console.error("Error al consultar datos:", error);
    alert("❌ Error al consultar datos.");
  }
}

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const estado = document.getElementById("estado");
  estado.innerText = "Enviando datos...";

  if (!document.getElementById("aceptaCondiciones").checked) {
    estado.innerText = "❌ Debes aceptar las condiciones antes de enviar.";
    return;
  }

  const accesoriosSeleccionados = Array.from(
    formulario.querySelectorAll("input[name='accesorios']:checked")
  ).map(cb => cb.value).join(", ");

  const firmaDataURL = canvas.toDataURL("image/jpeg", 0.95);
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
    firma: firmaBase64
  };

  try {
    const response = await fetch("https://default03db959ef51543569100cc4a9dcf25.8b.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/94482b3719cd4885bc375babcd4bce2c/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fkBC4BmU3ht00DDw4xuImox05onAW0vptGdssjqvD6o", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      estado.innerText = "✅ Datos enviados correctamente.";
      formulario.reset();
      limpiarFirma();
      limpiarLocalStorage();
    } else {
      estado.innerText = "❌ Error al enviar: " + response.status;
    }
  } catch (error) {
    estado.innerText = "❌ Error al enviar: " + error.message;
  }
});

obtenerSerialDesdeURL();
