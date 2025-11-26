// script.js - Versión 2.1 (Ajuste Ramo Final)

const formulario = document.getElementById("formulario");
const divEstadoEnvio = document.getElementById("estado-envio");

// URLS DE POWER AUTOMATE (Verifica que sean las correctas)
// URL para BUSCAR usuario (GET/POST datos)
const URL_BUSQUEDA = "https://prod-29.westus.logic.azure.com:443/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HdukGAnPtKgdUMkC1kbIqxd6pRyp_oZ_Q35IAtZGr-M";
// URL para ENVIAR el acta final
const URL_ENVIO = "https://prod-47.westus.logic.azure.com:443/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eYvcvi9mTH8wpW3_QaYhkhae6jiMGh4C38LaL1eEAZI";

// --- 1. CONFIGURACIÓN INICIAL AL CARGAR ---
document.addEventListener("DOMContentLoaded", () => {
    // Fecha automática
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("fecha").value = hoy;
    
    // Serial desde URL (si aplica)
    const params = new URLSearchParams(window.location.search);
    const serial = params.get("serial");
    if (serial) document.getElementById("serial").value = serial;
});

// --- 2. GESTIÓN DE FIRMAS (DOBLE CANVAS) ---
function initSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    let isDrawing = false;

    // Ajuste de tamaño inicial
    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = 120;
    }
    resize(); 

    const start = (x, y) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (x, y) => {
        if (!isDrawing) return;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    const end = () => { isDrawing = false; ctx.beginPath(); };

    // Eventos Mouse
    canvas.addEventListener("mousedown", e => start(e.offsetX, e.offsetY));
    canvas.addEventListener("mousemove", e => move(e.offsetX, e.offsetY));
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseout", end);

    // Eventos Touch (Celulares/Tablets)
    canvas.addEventListener("touchstart", e => {
        const rect = canvas.getBoundingClientRect();
        start(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener("touchmove", e => {
        const rect = canvas.getBoundingClientRect();
        move(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener("touchend", end);

    return { canvas, ctx };
}

// Inicializamos las dos firmas
const firmaColab = initSignature("canvas_colaborador");
const firmaAna = initSignature("canvas_analista");

// Botones para limpiar firma
window.limpiarFirmaColaborador = () => firmaColab.ctx.clearRect(0,0,firmaColab.canvas.width, firmaColab.canvas.height);
window.limpiarFirmaAnalista = () => firmaAna.ctx.clearRect(0,0,firmaAna.canvas.width, firmaAna.canvas.height);


// --- 3. BÚSQUEDA AUTOMÁTICA (REUTILIZABLE) ---
async function realizarBusqueda(cedula, tipoPersona) {
    const icono = document.getElementById(tipoPersona === 'colaborador' ? 'icono-busqueda-colaborador' : 'icono-busqueda-analista');
    const divMsg = document.getElementById(tipoPersona === 'colaborador' ? 'msg-colaborador' : 'msg-analista');
    
    if(!cedula) { alert("Ingrese cédula para buscar"); return; }
    
    icono.innerHTML = '<span class="spinner"></span>';
    divMsg.innerHTML = "Buscando...";
    divMsg.style.color = "#666";

    try {
        const response = await fetch(URL_BUSQUEDA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cedula: cedula })
        });
        const data = await response.json();

        // Verificamos si la respuesta trajo datos válidos
        if (data && data.nombre_colaborador) {
            // ÉXITO
            divMsg.innerHTML = "✅ Datos encontrados";
            divMsg.style.color = "green";
            icono.innerHTML = "🔍";

            if (tipoPersona === 'colaborador') {
                // Llenar campos del Colaborador
                document.getElementById("nombre_colaborador").value = data.nombre_colaborador;
                document.getElementById("agencia").value = data.agencia || "";
                document.getElementById("telefono").value = data.telefono || "";
            } else {
                // Llenar campos del Analista
                document.getElementById("nombre_analista").value = data.nombre_colaborador;
                document.getElementById("agencia_analista").value = data.agencia || "";
                document.getElementById("telefono_analista").value = data.telefono || ""; 
            }
        } else {
            // NO ENCONTRADO
            divMsg.innerHTML = "❌ No encontrado en base de datos";
            divMsg.style.color = "red";
            icono.innerHTML = "🔍";
        }
    } catch (e) {
        console.error(e);
        divMsg.innerHTML = "❌ Error de conexión";
        divMsg.style.color = "red";
        icono.innerHTML = "🔍";
    }
}

// Asignamos las funciones a los botones globales
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colaborador');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');


// --- 4. ENVÍO DEL FORMULARIO (SUBMIT) ---
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    divEstadoEnvio.innerHTML = '<div style="text-align:center; margin-top:10px;"><span class="spinner"></span> Generando Acta...</div>';

    // Helpers para leer valores de Radios y Selects
    const valRadio = (name) => {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : "No";
    };
    const valSelect = (name) => document.querySelector(`[name="${name}"]`).value;

    // CONSTRUCCIÓN DEL OBJETO JSON (DATOS)
    const data = {
        // 1. Datos Colaborador
        cedula: document.getElementById("cedula").value,
        nombre_colaborador: document.getElementById("nombre_colaborador").value,
        agencia: document.getElementById("agencia").value,
        telefono: document.getElementById("telefono").value,
        correo_colaborador: document.getElementById("correo_colaborador").value,
        zona_colaborador: document.getElementById("zona_colaborador").value,
        operacion: document.getElementById("operacion").value,
        ciudad_fecha: document.getElementById("ciudad").value + " - " + document.getElementById("fecha").value,

        // 2. Datos Equipo
        tipo_equipo: "Handheld", // Campo fijo
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        serial: document.getElementById("serial").value,

        // 3. Matriz Inventario (Lo nuevo)
        entrega_terminal: valRadio("entrega_terminal"), estado_terminal: valSelect("estado_terminal"),
        entrega_pantalla: valRadio("entrega_pantalla"), estado_pantalla: valSelect("estado_pantalla"),
        entrega_estuche: valRadio("entrega_estuche"),   estado_estuche: valSelect("estado_estuche"),
        entrega_bateria: valRadio("entrega_bateria"),   estado_bateria: valSelect("estado_bateria_item"),
        entrega_cargador: valRadio("entrega_cargador"), estado_cargador: valSelect("estado_cargador"),
        entrega_cable: valRadio("entrega_cable"),       estado_cable: valSelect("estado_cable"),
        // Sim Card eliminada a petición

        observaciones: document.querySelector('[name="observaciones"]').value,

        // 4. Datos Analista
        cedula_analista: document.getElementById("cedula_analista").value,
        nombre_analista: document.getElementById("nombre_analista").value,
        agencia_analista: document.getElementById("agencia_analista").value,
        telefono_analista: document.getElementById("telefono_analista").value,
        codigo_sap_analista: document.getElementById("codigo_sap_analista").value,
        cargo_analista: document.getElementById("cargo_analista").value,
        zona_analista: document.getElementById("zona_analista").value,

        // 5. Firmas (Base64)
        firma_colaborador: firmaColab.canvas.toDataURL("image/png").split(",")[1],
        firma_analista: firmaAna.canvas.toDataURL("image/png").split(",")[1]
    };

    // ENVÍO A POWER AUTOMATE
    try {
        const resp = await fetch(URL_ENVIO, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (resp.ok) {
            divEstadoEnvio.innerHTML = '<div style="color:green; text-align:center; font-weight:bold; margin-top:10px;">✅ ¡Acta enviada con éxito!</div>';
            // Opcional: Limpiar formulario tras éxito
            formulario.reset();
            limpiarFirmaColaborador();
            limpiarFirmaAnalista();
            // Restaurar fecha
            document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
            
            setTimeout(() => { divEstadoEnvio.innerHTML = ""; }, 5000);
        } else {
            divEstadoEnvio.innerHTML = '<div style="color:red; text-align:center;">❌ Error al enviar datos</div>';
        }
    } catch (err) {
        console.error(err);
        divEstadoEnvio.innerHTML = '<div style="color:red; text-align:center;">❌ Error de conexión</div>';
    }
});

// VALIDACIONES DE ENTRADA (Solo números)
const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");
document.getElementById("cedula").addEventListener("input", soloNumeros);
document.getElementById("cedula_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap_analista").addEventListener("input", soloNumeros);
