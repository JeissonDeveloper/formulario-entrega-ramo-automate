// URLS POWER AUTOMATE
const URL_BUSQUEDA = "https://prod-29.westus.logic.azure.com:443/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HdukGAnPtKgdUMkC1kbIqxd6pRyp_oZ_Q35IAtZGr-M";
const URL_ENVIO = "https://prod-47.westus.logic.azure.com:443/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eYvcvi9mTH8wpW3_QaYhkhae6jiMGh4C38LaL1eEAZI";

// Variables globales para las firmas
let sigColab, sigAna;

// --- 1. INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    // Poner fecha hoy
    document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
    
    // Serial por URL
    const params = new URLSearchParams(window.location.search);
    if(params.get("serial")) document.getElementById("serial").value = params.get("serial");

    // Inicializar Canvas
    sigColab = setupCanvas("canvas_colaborador");
    sigAna = setupCanvas("canvas_analista");

    // Recuperar datos guardados (Persistencia)
    cargarDatosLocales();

    // Inicializar estado de bloqueos (por si se recuperó un "No")
    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
});

// --- 2. PERSISTENCIA DE DATOS (Autoguardado) ---
// Escuchar cambios en todo el formulario
document.getElementById("formulario").addEventListener("input", (e) => {
    guardarDatosLocales();
});

function guardarDatosLocales() {
    const inputs = document.querySelectorAll("input, select, textarea");
    const datos = {};
    
    inputs.forEach(el => {
        // Modificación: Excluir 'serial' para no guardar datos antiguos
        if (el.name && el.name !== 'serial') {
            if (el.type === 'radio') {
                if (el.checked) datos[el.name] = el.value;
            } else {
                datos[el.name] = el.value;
            }
        }
    });
    localStorage.setItem("acta_ramo_borrador", JSON.stringify(datos));
}

function cargarDatosLocales() {
    const guardado = localStorage.getItem("acta_ramo_borrador");
    if (!guardado) return;

    const datos = JSON.parse(guardado);
    const inputs = document.querySelectorAll("input, select, textarea");

    inputs.forEach(el => {
        // Modificación: Excluir 'serial' para no sobrescribir el que viene por URL
        if (el.name && el.name !== 'serial' && datos[el.name] !== undefined) {
            if (el.type === 'radio') {
                if (el.value === datos[el.name]) el.checked = true;
            } else {
                el.value = datos[el.name];
            }
        }
    });
}

function borrarDatosLocales() {
    localStorage.removeItem("acta_ramo_borrador");
}

// --- 3. LÓGICA DE BLOQUEO DE ACCESORIOS ---
window.toggleAccesorio = (item) => {
    // item puede ser: terminal, pantalla, estuche, bateria, cargador, cable, sim
    // Buscamos el radio seleccionado
    const radios = document.getElementsByName(`entrega_${item}`);
    let valor = "No"; // Default
    for (const r of radios) {
        if (r.checked) {
            valor = r.value;
            break;
        }
    }

    // Identificar Select y Input de Observación
    // Nota: Batería tiene nombre especial 'estado_bateria_item'
    let nombreSelect = `estado_${item}`;
    if (item === 'bateria') nombreSelect = `estado_bateria_item`;

    const selectEstado = document.querySelector(`select[name="${nombreSelect}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        // Bloquear
        if (selectEstado) {
            selectEstado.disabled = true;
            selectEstado.value = "N/A"; // Opcional: resetear valor
            selectEstado.classList.add("bloqueado");
        }
        if (inputObs) {
            inputObs.disabled = true;
            inputObs.value = ""; // Limpiar obs
            inputObs.classList.add("bloqueado");
        }
    } else {
        // Desbloquear
        if (selectEstado) {
            selectEstado.disabled = false;
            selectEstado.classList.remove("bloqueado");
        }
        if (inputObs) {
            inputObs.disabled = false;
            inputObs.classList.remove("bloqueado");
        }
    }
};


// --- 4. BÚSQUEDA ---
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula) { alert("Escribe una cédula primero"); return; }
    
    const sufijo = tipo === 'colab' ? 'colaborador' : 'analista';
    const icono = document.getElementById("icono-busqueda-" + sufijo);
    const msg = document.getElementById("msg-" + sufijo);
    
    icono.innerHTML = '<span class="spinner"></span>'; 
    msg.innerText = "Conectando..."; msg.style.color = "#666";

    try {
        const resp = await fetch(URL_BUSQUEDA, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cedula })
        });
        const data = await resp.json();
        icono.innerHTML = "🔍";

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Datos cargados"; msg.style.color = "green";
            if(tipo === 'colab') {
                document.getElementById("nombre_colaborador").value = data.nombre_colaborador;
                document.getElementById("agencia").value = data.agencia || "";
                document.getElementById("telefono").value = data.telefono || "";
            } else {
                document.getElementById("nombre_analista").value = data.nombre_colaborador;
                document.getElementById("agencia_analista").value = data.agencia || "";
                document.getElementById("telefono_analista").value = data.telefono || "";
            }
            guardarDatosLocales(); // Guardar lo que trajo la búsqueda
        } else {
            msg.innerText = "❌ Cédula no encontrada"; msg.style.color = "red";
        }
    } catch (err) {
        console.error(err); icono.innerHTML = "🔍"; msg.innerText = "❌ Error de conexión"; msg.style.color = "red";
    }
}

// --- 5. FIRMAS ---
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d");
    let drawing = false;
    let wasUsed = false; // Bandera para saber si se ha firmado
    
    const resize = () => { c.width = c.offsetWidth; c.height = 140; };
    resize();
    window.addEventListener('resize', resize);

    const start = (e) => {
        drawing = true; wasUsed = true; // Marcamos como usado
        ctx.beginPath();
        const {left, top} = c.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - left;
        const y = (e.clientY || e.touches[0].clientY) - top;
        ctx.moveTo(x, y); e.preventDefault();
    };
    const move = (e) => {
        if(!drawing) return;
        const {left, top} = c.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - left;
        const y = (e.clientY || e.touches[0].clientY) - top;
        ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
        ctx.lineTo(x, y); ctx.stroke(); e.preventDefault();
    };
    const end = () => { drawing = false; };

    c.addEventListener("mousedown", start); c.addEventListener("touchstart", start, {passive:false});
    c.addEventListener("mousemove", move); c.addEventListener("touchmove", move, {passive:false});
    c.addEventListener("mouseup", end); c.addEventListener("touchend", end);
    c.addEventListener("mouseout", end);
    
    // Devolvemos el canvas, el contexto y una función para verificar si se usó
    return {c, ctx, isSigned: () => wasUsed, reset: () => { wasUsed = false; } };
}

window.limpiarFirma = (quien) => {
    const target = quien === 'colab' ? sigColab : sigAna;
    target.ctx.clearRect(0,0, target.c.width, target.c.height);
    target.reset(); // Reseteamos la bandera de "firmado"
};

// --- 6. ENVÍO ---
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    // -- VALIDACIÓN DE FIRMAS (BLOQUEO TOTAL) --
    if (!sigColab.isSigned()) {
        alert("⚠️ FALTA FIRMA DEL COLABORADOR. Por favor firme antes de generar el acta.");
        return;
    }
    if (!sigAna.isSigned()) {
        alert("⚠️ FALTA FIRMA DEL ANALISTA. Por favor firme antes de generar el acta.");
        return;
    }
    // -------------------------------------------

    const estadoDiv = document.getElementById("estado-envio");
    estadoDiv.innerHTML = '<span class="spinner" style="border-color: #666; border-top-color: #000;"></span> Generando...';

    // Helpers
    const valRadio = (name) => { 
        const el = document.querySelector(`input[name="${name}"]:checked`); 
        return el ? el.value : "No"; 
    };
    // Helper especial para Selects (porque pueden estar disabled y no enviar value)
    const valSelect = (name) => {
        const el = document.querySelector(`select[name="${name}"]`);
        if (el.disabled) return "N/A"; // Si está bloqueado, enviamos N/A
        return el.value;
    };
    const valInput = (id) => {
        const el = document.getElementById(id);
        if (el.disabled) return ""; // Si está bloqueado, enviamos vacío
        return el.value;
    };

    const data = {
        cedula: valInput("cedula"),
        nombre_colaborador: valInput("nombre_colaborador"),
        agencia: valInput("agencia"),
        telefono: valInput("telefono"),
        correo_colaborador: valInput("correo_colaborador"),
        codigo_sap: valInput("codigo_sap"),
        zona_colaborador: valInput("zona_colaborador"),
        operacion: valInput("operacion"), // este es un select por ID en HTML pero value se saca igual
        ciudad: valInput("ciudad"),
        fecha: valInput("fecha"),

        tipo_equipo: "Handheld",
        marca: valInput("marca"),
        modelo: valInput("modelo"),
        serial: valInput("serial"),

        entrega_terminal: valRadio("entrega_terminal"), estado_terminal: valSelect("estado_terminal"), obs_terminal: valInput("obs_terminal"),
        entrega_pantalla: valRadio("entrega_pantalla"), estado_pantalla: valSelect("estado_pantalla"), obs_pantalla: valInput("obs_pantalla"),
        entrega_estuche: valRadio("entrega_estuche"),   estado_estuche: valSelect("estado_estuche"),   obs_estuche: valInput("obs_estuche"),
        entrega_bateria: valRadio("entrega_bateria"),   estado_bateria: valSelect("estado_bateria_item"), obs_bateria: valInput("obs_bateria"),
        entrega_cargador: valRadio("entrega_cargador"), estado_cargador: valSelect("estado_cargador"), obs_cargador: valInput("obs_cargador"),
        entrega_cable: valRadio("entrega_cable"),       estado_cable: valSelect("estado_cable"),       obs_cable: valInput("obs_cable"),
        entrega_sim: valRadio("entrega_sim"),           estado_sim: valSelect("estado_sim"),           obs_sim: valInput("obs_sim"),

        accesorios_adicionales: valInput("accesorios_adicionales"),
        observaciones: valInput("observaciones"),

        cedula_analista: valInput("cedula_analista"),
        nombre_analista: valInput("nombre_analista"),
        agencia_analista: valInput("agencia_analista"),
        telefono_analista: valInput("telefono_analista"),
        codigo_sap_analista: valInput("codigo_sap_analista"),
        cargo_analista: valInput("cargo_analista"),
        zona_analista: valInput("zona_analista"),

        firma_colaborador: sigColab.c.toDataURL().split(",")[1],
        firma_analista: sigAna.c.toDataURL().split(",")[1]
    };
    
    try {
        const resp = await fetch(URL_ENVIO, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        });
        if(resp.ok) {
            estadoDiv.innerText = "✅ ¡Enviado Exitosamente!";
            estadoDiv.style.color = "green";
            // Limpiar datos guardados al enviar exitosamente
            borrarDatosLocales();
            document.getElementById("formulario").reset();
            limpiarFirma('colab'); limpiarFirma('ana');
            document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
            // Resetear bloqueos visuales
            ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
        } else {
            throw new Error("Error API");
        }
    } catch(err) {
        estadoDiv.innerText = "❌ Error al enviar (Verificar Flujo)";
        estadoDiv.style.color = "red";
    }
});

// Validaciones
const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");
document.getElementById("cedula").addEventListener("input", soloNumeros);
document.getElementById("cedula_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap").addEventListener("input", soloNumeros);
