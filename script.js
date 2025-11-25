// script.js - Versión 2.0 (Doble Búsqueda y Doble Firma)

const formulario = document.getElementById("formulario");
const estado = document.getElementById("estado");

// --- 1. CONFIGURACIÓN DE FIRMAS (DOBLE CANVAS) ---
function iniciarPadFirma(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    let dibujando = false;

    // Ajustar tamaño al contenedor
    function ajustar() {
        // Guardamos la imagen actual para no perderla al redimensionar (básico)
        // En producción idealmente se redibuja, pero esto evita que se borre al girar el celular
        const imagenData = ctx.getImageData(0,0, canvas.width, canvas.height);
        canvas.width = canvas.offsetWidth;
        canvas.height = 150;
        ctx.putImageData(imagenData, 0, 0);
    }
    // Ajustar al inicio
    ajustar(); 
    // Ajustar si la ventana cambia de tamaño (opcional, cuidado que borra si no se maneja bien)
    // window.addEventListener('resize', ajustar);

    // Eventos Mouse y Touch unificados en lógica
    const empezarDibujo = (x, y) => {
        dibujando = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const moverDibujo = (x, y) => {
        if (!dibujando) return;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const terminarDibujo = () => {
        dibujando = false;
        ctx.beginPath();
    };

    // Listeners Mouse
    canvas.addEventListener("mousedown", (e) => empezarDibujo(e.offsetX, e.offsetY));
    canvas.addEventListener("mousemove", (e) => moverDibujo(e.offsetX, e.offsetY));
    canvas.addEventListener("mouseup", terminarDibujo);
    canvas.addEventListener("mouseout", terminarDibujo);

    // Listeners Touch (Móvil)
    canvas.addEventListener("touchstart", (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        empezarDibujo(touch.clientX - rect.left, touch.clientY - rect.top);
        e.preventDefault(); 
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        moverDibujo(touch.clientX - rect.left, touch.clientY - rect.top);
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", terminarDibujo);

    return { canvas, ctx };
}

// Inicializamos los DOS pads
const firmaColaborador = iniciarPadFirma("canvas_colaborador");
const firmaAnalista = iniciarPadFirma("canvas_analista");

// Funciones de Limpieza
window.limpiarFirmaColaborador = () => {
    firmaColaborador.ctx.clearRect(0, 0, firmaColaborador.canvas.width, firmaColaborador.canvas.height);
};
window.limpiarFirmaAnalista = () => {
    firmaAnalista.ctx.clearRect(0, 0, firmaAnalista.canvas.width, firmaAnalista.canvas.height);
};


// --- 2. LÓGICA GENERAL ---
document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("fecha").value = hoy;
    obtenerSerialDesdeURL();
});

function obtenerSerialDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const serial = params.get("serial");
    if (serial) {
        document.getElementById("serial").value = serial;
    }
}

// Validaciones de Texto (Solo números o Solo letras)
const soloNumeros = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "");
const soloLetras = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");

// Aplicar validaciones si existen los elementos
if(document.getElementById("cedula")) document.getElementById("cedula").addEventListener("input", soloNumeros);
if(document.getElementById("cedula_analista")) document.getElementById("cedula_analista").addEventListener("input", soloNumeros);
if(document.getElementById("codigo_sap_analista")) document.getElementById("codigo_sap_analista").addEventListener("input", soloNumeros);


// --- 3. BÚSQUEDA API (REUTILIZABLE) ---

// URL DEL FLUJO DE BÚSQUEDA (La que tú proporcionaste)
const URL_BUSQUEDA = "https://prod-29.westus.logic.azure.com:443/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HdukGAnPtKgdUMkC1kbIqxd6pRyp_oZ_Q35IAtZGr-M";

// Búsqueda Colaborador
async function buscarColaborador() {
    const inputCedula = document.getElementById("cedula");
    const iconoEstado = document.getElementById("estado-busqueda-colaborador");
    
    if (!inputCedula.value) { alert("Ingrese una cédula"); return; }
    
    iconoEstado.innerHTML = '<span class="spinner-busqueda"></span>';

    try {
        const response = await fetch(URL_BUSQUEDA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cedula: inputCedula.value })
        });
        const data = await response.json();

        if (data && data.nombre_colaborador) {
            document.getElementById("nombre_colaborador").value = data.nombre_colaborador;
            document.getElementById("agencia").value = data.agencia || ""; 
            // Si el API trae teléfono, lo ponemos, si no, lo dejamos vacío
            if(document.getElementById("telefono") && data.telefono) {
                document.getElementById("telefono").value = data.telefono; 
            }
            iconoEstado.innerHTML = "✅";
        } else {
            alert("Colaborador no encontrado");
            iconoEstado.innerHTML = "❌";
        }
    } catch (error) {
        console.error(error);
        iconoEstado.innerHTML = "❌";
        alert("Error de conexión al buscar");
    }
}

// Búsqueda Analista (NUEVA - Usa la misma URL)
async function buscarAnalista() {
    const inputCedula = document.getElementById("cedula_analista");
    const iconoEstado = document.getElementById("estado-busqueda-analista");
    
    if (!inputCedula.value) { alert("Ingrese una cédula para el analista"); return; }
    
    iconoEstado.innerHTML = '<span class="spinner-busqueda"></span>';

    try {
        const response = await fetch(URL_BUSQUEDA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cedula: inputCedula.value })
        });
        const data = await response.json();

        if (data && data.nombre_colaborador) {
            // Asignamos la respuesta a los campos del Analista
            document.getElementById("nombre_analista").value = data.nombre_colaborador;
            document.getElementById("agencia_analista").value = data.agencia || "";
            // El cargo no suele venir en esa API básica, así que se deja para llenar manual si queda vacío
            
            iconoEstado.innerHTML = "✅";
        } else {
            alert("Analista no encontrado en base de datos");
            iconoEstado.innerHTML = "❌";
        }
    } catch (error) {
        console.error(error);
        iconoEstado.innerHTML = "❌";
        alert("Error de conexión al buscar analista");
    }
}


// --- 4. ENVÍO DEL FORMULARIO ---
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    estado.innerHTML = '<span class="spinner"></span> Generando Acta...';
    estado.classList.add("mostrar");

    // Validar checkbox
    if (!document.getElementById("aceptaCondiciones").checked) {
        estado.innerText = "❌ Debe aceptar las condiciones.";
        return;
    }

    // Convertir firmas a Base64
    const firmaColabB64 = firmaColaborador.canvas.toDataURL("image/png").split(",")[1];
    const firmaAnalistaB64 = firmaAnalista.canvas.toDataURL("image/png").split(",")[1];

    // Helper para obtener valor de los Radios de la tabla
    const getRadio = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : "No"; // Default a No si falla algo
    };

    // Construcción del JSON gigante
    const data = {
        // Datos Colaborador
        cedula: document.getElementById("cedula").value,
        nombre_colaborador: document.getElementById("nombre_colaborador").value,
        correo_colaborador: document.getElementById("correo_colaborador").value,
        ciudad_fecha: document.getElementById("ciudad").value + " - " + document.getElementById("fecha").value,
        agencia: document.getElementById("agencia").value,
        zona_colaborador: document.getElementById("zona_colaborador").value,
        operacion: document.getElementById("operacion").value,
        
        // Datos Equipo
        marca_modelo: document.getElementById("marca_modelo").value,
        serial: document.getElementById("serial").value,
        sim_card_numero: document.getElementById("telefono").value,

        // Matriz de Inventario
        entrega_terminal: getRadio("entrega_terminal"),
        estado_terminal: document.querySelector('[name="estado_terminal"]').value,
        
        entrega_pantalla: getRadio("entrega_pantalla"),
        estado_pantalla: document.querySelector('[name="estado_pantalla"]').value,
        
        entrega_estuche: getRadio("entrega_estuche"),
        estado_estuche: document.querySelector('[name="estado_estuche"]').value,
        
        entrega_bateria: getRadio("entrega_bateria"),
        estado_bateria: document.querySelector('[name="estado_bateria_item"]').value,
        
        entrega_cargador: getRadio("entrega_cargador"),
        estado_cargador: document.querySelector('[name="estado_cargador"]').value,
        
        entrega_cable: getRadio("entrega_cable"),
        estado_cable: document.querySelector('[name="estado_cable"]').value,
        
        entrega_sim: getRadio("entrega_sim"),
        estado_sim: document.querySelector('[name="estado_sim"]').value,

        observaciones: document.querySelector('[name="observaciones"]').value,

        // Datos Analista
        cedula_analista: document.getElementById("cedula_analista").value,
        nombre_analista: document.getElementById("nombre_analista").value,
        codigo_sap_analista: document.getElementById("codigo_sap_analista").value,
        cargo_analista: document.getElementById("cargo_analista").value,
        agencia_analista: document.getElementById("agencia_analista").value,
        zona_analista: document.getElementById("zona_analista").value,

        // Firmas
        firma_colaborador: firmaColabB64,
        firma_analista: firmaAnalistaB64
    };

    // URL DEL FLUJO DE ENVÍO (Tu segunda URL)
    const URL_ENVIO = "https://prod-47.westus.logic.azure.com:443/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eYvcvi9mTH8wpW3_QaYhkhae6jiMGh4C38LaL1eEAZI";

    try {
        const response = await fetch(URL_ENVIO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            estado.innerText = "✅ Acta generada y enviada correctamente.";
            // Opcional: Recargar página o limpiar
            // location.reload(); 
            formulario.reset();
            limpiarFirmaColaborador();
            limpiarFirmaAnalista();
        } else {
            estado.innerText = "❌ Error en el servidor al recibir datos.";
        }
    } catch (error) {
        estado.innerText = "❌ Error de conexión al enviar.";
        console.error(error);
    }
});
obtenerSerialDesdeURL();



