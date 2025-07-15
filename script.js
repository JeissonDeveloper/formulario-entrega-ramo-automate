const formulario = document.getElementById("formulario");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let dibujando = false;

function ajustarCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 150;
}
ajustarCanvas();

canvas.addEventListener("mousedown", () => dibujando = true);
canvas.addEventListener("mouseup", () => {
  dibujando = false;
  ctx.beginPath();
});
canvas.addEventListener("mouseout", () => dibujando = false);
canvas.addEventListener("mousemove", dibujar);

canvas.addEventListener("touchstart", (e) => {
  dibujando = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});
canvas.addEventListener("touchend", () => {
  dibujando = false;
  ctx.beginPath();
});
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
    if (campos[i].name) {
      localStorage.setItem("form_" + campos[i].name, campos[i].value);
    }
  }
}

function cargarDesdeLocalStorage() {
  const campos = formulario.elements;
  for (let i = 0; i < campos.length; i++) {
    if (campos[i].name) {
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

// Validaciones de solo letras o números
formulario.nombre.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
});

formulario.apellido.addEventListener("input", (e) => {
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

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const estado = document.getElementById("estado");
  estado.innerText = "Enviando datos...";

  const firmaDataURL = canvas.toDataURL("image/png");
  const firmaBase64 = firmaDataURL.split(",")[1]; // Separa solo la parte base64

  const data = {
    nombre: formulario.nombre.value,
    apellido: formulario.apellido.value,
    cedula: formulario.cedula.value,
    codigo_sap: formulario.codigo_sap.value,
    telefono: formulario.telefono.value,
    estado_equipo: formulario.estado_equipo.value,
    accesorios: formulario.accesorios.value,
    estado_bateria: formulario.estado_bateria.value,
    observaciones: formulario.observaciones.value,
    serial: formulario.serial.value,
    firma: firmaBase64
  };

  try {
    const response = await fetch("https://default03db959ef51543569100cc4a9dcf25.8b.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/94482b3719cd4885bc375babcd4bce2c/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-03db959e-f515-4356-9100-cc4a9dcf258b&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fkBC4BmU3ht00DDw4xuImox05onAW0vptGdssjqvD6o", {
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
