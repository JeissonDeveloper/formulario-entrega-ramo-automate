// ============================================================================
// FORMULARIO DE ENTREGA DE DISPOSITIVOS MÓVILES - RAMO
// Versión: 2.1 - Actualizada Enero 2025
// Cambios v2.1:
// - Eliminados alerts (reemplazados por notificaciones en pantalla)
// - Firma analista opcional con imagen transparente para Power Automate
// ============================================================================

// URLS POWER AUTOMATE - ACTUALIZADAS (Enero 2025)
const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

// Imagen transparente de 1x1 pixel en base64 (PNG)
// Esta se usa cuando no hay firma del analista para que Power Automate no falle
const IMAGEN_TRANSPARENTE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Variables globales
let sigColab, sigAna;
let enviandoFormulario = false;

// ============================================================================
// SISTEMA DE NOTIFICACIONES (Reemplaza alerts)
// ============================================================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Tipos: 'success', 'error', 'warning', 'info'
    
    // Crear o obtener contenedor de notificaciones
    let container = document.getElementById('notificaciones-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificaciones-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : tipo === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : tipo === 'warning' ? '#856404' : '#0c5460'};
        border: 2px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : tipo === 'warning' ? '#ffeeba' : '#bee5eb'};
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icono = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️';
    notificacion.innerHTML = `<span style="font-size: 1.2rem;">${icono}</span><span>${mensaje}</span>`;
    
    container.appendChild(notificacion);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 5000);
}

// Agregar estilos de animación
if (!document.getElementById('notificaciones-styles')) {
    const style = document.createElement('style');
    style.id = 'notificaciones-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// 1. INICIALIZACIÓN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Configurar fecha correcta (zona horaria Colombia)
    configurarFechaActual();
    
    // Serial por URL
    const params = new URLSearchParams(window.location.search);
    if(params.get("serial")) {
        document.getElementById("serial").value = params.get("serial");
    }

    // Inicializar Canvas de firmas
    sigColab = setupCanvas("canvas_colaborador");
    sigAna = setupCanvas("canvas_analista");

    // Recuperar datos guardados (Persistencia)
    cargarDatosLocales();

    // Inicializar estado de bloqueos
    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
    
    console.log("✅ Formulario RAMO v2.1 inicializado correctamente");
});

// ============================================================================
// 2. CONFIGURACIÓN DE FECHA (CORRECCIÓN ZONA HORARIA)
// ============================================================================
function configurarFechaActual() {
    const ahora = new Date();
    // Ajustar a zona horaria de Colombia (UTC-5)
    const fechaColombia = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    const año = fechaColombia.getFullYear();
    const mes = String(fechaColombia.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaColombia.getDate()).padStart(2, '0');
    
    document.getElementById("fecha").value = `${año}-${mes}-${dia}`;
}

// ============================================================================
// 3. PERSISTENCIA DE DATOS (Autoguardado)
// ============================================================================
document.getElementById("formulario").addEventListener("input", () => {
    guardarDatosLocales();
});

function guardarDatosLocales() {
    const inputs = document.querySelectorAll("input, select, textarea");
    const datos = {};
    
    inputs.forEach(el => {
        if (el.name && el.name !== 'serial') {
            if (el.type === 'radio') {
                if (el.checked) datos[el.name] = el.value;
            } else if (el.type === 'checkbox') {
                datos[el.name] = el.checked;
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
        if (el.name && el.name !== 'serial' && datos[el.name] !== undefined) {
            if (el.type === 'radio') {
                if (el.value === datos[el.name]) el.checked = true;
            } else if (el.type === 'checkbox') {
                el.checked = datos[el.name];
            } else {
                el.value = datos[el.name];
            }
        }
    });
}

function borrarDatosLocales() {
    localStorage.removeItem("acta_ramo_borrador");
}

// ============================================================================
// 4. LÓGICA DE BLOQUEO DE ACCESORIOS
// ============================================================================
window.toggleAccesorio = (item) => {
    const radios = document.getElementsByName(`entrega_${item}`);
    let valor = "No";
    
    for (const r of radios) {
        if (r.checked) {
            valor = r.value;
            break;
        }
    }

    let nombreSelect = `estado_${item}`;
    if (item === 'bateria') nombreSelect = `estado_bateria_item`;

    const selectEstado = document.querySelector(`select[name="${nombreSelect}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        if (selectEstado) {
            selectEstado.disabled = true;
            selectEstado.value = "N/A";
            selectEstado.classList.add("bloqueado");
        }
        if (inputObs) {
            inputObs.disabled = true;
            inputObs.value = "";
            inputObs.classList.add("bloqueado");
        }
    } else {
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

// ============================================================================
// 5. BÚSQUEDA DE COLABORADORES Y ANALISTAS
// ============================================================================
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula || cedula.trim() === "") { 
        mostrarNotificacion("Por favor ingrese una cédula válida", 'warning');
        return; 
    }
    
    const sufijo = tipo === 'colab' ? 'colaborador' : 'analista';
    const icono = document.getElementById("icono-busqueda-" + sufijo);
    const msg = document.getElementById("msg-" + sufijo);
    
    icono.innerHTML = '<span class="spinner"></span>'; 
    msg.innerText = "Buscando datos..."; 
    msg.style.color = "#666";

    try {
        const resp = await fetch(URL_BUSQUEDA, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cedula.trim() })
        });
        
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        
        const data = await resp.json();
        icono.innerHTML = "🔍";

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Datos encontrados"; 
            msg.style.color = "green";
            
            if(tipo === 'colab') {
                document.getElementById("nombre_colaborador").value = data.nombre_colaborador || "";
                document.getElementById("agencia").value = data.agencia || "";
                document.getElementById("telefono").value = data.telefono || "";
            } else {
                document.getElementById("nombre_analista").value = data.nombre_colaborador || "";
                document.getElementById("agencia_analista").value = data.agencia || "";
                document.getElementById("telefono_analista").value = data.telefono || "";
                
                if (data.codigo_sap) document.getElementById("codigo_sap_analista").value = data.codigo_sap;
                if (data.cargo) document.getElementById("cargo_analista").value = data.cargo;
                if (data.zona) document.getElementById("zona_analista").value = data.zona;
            }
            
            guardarDatosLocales();
        } else {
            msg.innerText = "❌ Cédula no encontrada"; 
            msg.style.color = "red";
        }
    } catch (err) {
        console.error("Error en búsqueda:", err);
        icono.innerHTML = "🔍";
        msg.innerText = "❌ Error de conexión"; 
        msg.style.color = "red";
    }
}

// ============================================================================
// 6. SISTEMA DE FIRMAS DIGITALES
// ============================================================================
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d");
    let drawing = false;
    let wasUsed = false;
    
    const resize = () => { 
        c.width = c.offsetWidth; 
        c.height = 140; 
    };
    resize();
    window.addEventListener('resize', resize);

    const start = (e) => {
        drawing = true; 
        wasUsed = true;
        ctx.beginPath();
        const {left, top} = c.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - left;
        const y = (e.clientY || e.touches[0].clientY) - top;
        ctx.moveTo(x, y); 
        e.preventDefault();
    };
    
    const move = (e) => {
        if(!drawing) return;
        const {left, top} = c.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - left;
        const y = (e.clientY || e.touches[0].clientY) - top;
        ctx.lineWidth = 2; 
        ctx.lineCap = "round"; 
        ctx.strokeStyle = "#000";
        ctx.lineTo(x, y); 
        ctx.stroke(); 
        e.preventDefault();
    };
    
    const end = () => { drawing = false; };

    c.addEventListener("mousedown", start); 
    c.addEventListener("touchstart", start, {passive:false});
    c.addEventListener("mousemove", move); 
    c.addEventListener("touchmove", move, {passive:false});
    c.addEventListener("mouseup", end); 
    c.addEventListener("touchend", end);
    c.addEventListener("mouseout", end);
    
    return {
        c, 
        ctx, 
        isSigned: () => wasUsed, 
        reset: () => { wasUsed = false; }
    };
}

window.limpiarFirma = (quien) => {
    const target = quien === 'colab' ? sigColab : sigAna;
    target.ctx.clearRect(0, 0, target.c.width, target.c.height);
    target.reset();
};

// ============================================================================
// 7. VALIDACIONES PREVIAS AL ENVÍO
// ============================================================================
function validarFormulario() {
    const errores = [];
    
    // VALIDACIÓN 1: Serial obligatorio
    const serial = document.getElementById("serial").value.trim();
    if (!serial || serial === "") {
        errores.push("El campo SERIAL es obligatorio y no puede estar vacío.");
    }
    
    // VALIDACIÓN 2: Firma del colaborador (obligatoria)
    if (!sigColab.isSigned()) {
        errores.push("La firma del COLABORADOR es obligatoria.");
    }
    
    // VALIDACIÓN 3: Campos requeridos básicos
    const camposRequeridos = [
        { id: 'cedula', nombre: 'Cédula Colaborador' },
        { id: 'nombre_colaborador', nombre: 'Nombre Colaborador' },
        { id: 'correo_colaborador', nombre: 'Correo Colaborador' },
        { id: 'operacion', nombre: 'Cargo/Operación' },
        { id: 'marca', nombre: 'Marca del Dispositivo' },
        { id: 'modelo', nombre: 'Modelo del Dispositivo' }
    ];
    
    camposRequeridos.forEach(campo => {
        const valor = document.getElementById(campo.id).value.trim();
        if (!valor || valor === "") {
            errores.push(`El campo "${campo.nombre}" es obligatorio.`);
        }
    });
    
    return errores;
}

// ============================================================================
// 8. ENVÍO DEL FORMULARIO
// ============================================================================
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    // PROTECCIÓN: Evitar envíos duplicados
    if (enviandoFormulario) {
        mostrarNotificacion("El formulario ya se está enviando. Por favor espere...", 'warning');
        return;
    }

    // Ejecutar validaciones
    const errores = validarFormulario();
    if (errores.length > 0) {
        mostrarNotificacion("ERRORES EN EL FORMULARIO:", 'error');
        errores.forEach(error => {
            setTimeout(() => mostrarNotificacion(error, 'error'), 100);
        });
        return;
    }

    // Marcar como "enviando"
    enviandoFormulario = true;
    
    const estadoDiv = document.getElementById("estado-envio");
    const btnEnviar = document.querySelector('.btn-principal');
    
    // Deshabilitar botón
    btnEnviar.disabled = true;
    btnEnviar.style.opacity = "0.6";
    btnEnviar.style.cursor = "not-allowed";
    estadoDiv.innerHTML = '<span class="spinner" style="border-color: #666; border-top-color: #000;"></span> Enviando acta...';

    // Helpers
    const valRadio = (name) => { 
        const el = document.querySelector(`input[name="${name}"]:checked`); 
        return el ? el.value : "No"; 
    };
    
    const valSelect = (name) => {
        const el = document.querySelector(`select[name="${name}"]`);
        if (el.disabled) return "N/A";
        return el.value || "N/A";
    };
    
    const valInput = (id) => {
        const el = document.getElementById(id);
        if (el.disabled) return "";
        return el.value.trim();
    };

    // Preparar datos
    const data = {
        cedula: valInput("cedula"),
        nombre_colaborador: valInput("nombre_colaborador"),
        agencia: valInput("agencia"),
        telefono: valInput("telefono"),
        correo_colaborador: valInput("correo_colaborador"),
        codigo_sap: valInput("codigo_sap"),
        zona_colaborador: valInput("zona_colaborador"),
        operacion: valInput("operacion"),
        ciudad: valInput("ciudad"),
        fecha: valInput("fecha"),

        tipo_equipo: "Handheld",
        marca: valInput("marca"),
        modelo: valInput("modelo"),
        serial: valInput("serial"),

        entrega_terminal: valRadio("entrega_terminal"), 
        estado_terminal: valSelect("estado_terminal"), 
        obs_terminal: valInput("obs_terminal"),
        
        entrega_pantalla: valRadio("entrega_pantalla"), 
        estado_pantalla: valSelect("estado_pantalla"), 
        obs_pantalla: valInput("obs_pantalla"),
        
        entrega_estuche: valRadio("entrega_estuche"), 
        estado_estuche: valSelect("estado_estuche"), 
        obs_estuche: valInput("obs_estuche"),
        
        entrega_bateria: valRadio("entrega_bateria"), 
        estado_bateria: valSelect("estado_bateria_item"), 
        obs_bateria: valInput("obs_bateria"),
        
        entrega_cargador: valRadio("entrega_cargador"), 
        estado_cargador: valSelect("estado_cargador"), 
        obs_cargador: valInput("obs_cargador"),
        
        entrega_cable: valRadio("entrega_cable"), 
        estado_cable: valSelect("estado_cable"), 
        obs_cable: valInput("obs_cable"),
        
        entrega_sim: valRadio("entrega_sim"), 
        estado_sim: valSelect("estado_sim"), 
        obs_sim: valInput("obs_sim"),

        accesorios_adicionales: valInput("accesorios_adicionales"),
        observaciones: valInput("observaciones"),

        cedula_analista: valInput("cedula_analista"),
        nombre_analista: valInput("nombre_analista"),
        agencia_analista: valInput("agencia_analista"),
        telefono_analista: valInput("telefono_analista"),
        codigo_sap_analista: valInput("codigo_sap_analista"),
        cargo_analista: valInput("cargo_analista"),
        zona_analista: valInput("zona_analista"),

        // SOLUCIÓN: Si no hay firma del analista, enviar imagen transparente
        firma_colaborador: sigColab.c.toDataURL().split(",")[1],
        firma_analista: sigAna.isSigned() ? sigAna.c.toDataURL().split(",")[1] : IMAGEN_TRANSPARENTE
    };
    
    try {
        const resp = await fetch(URL_ENVIO, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        });
        
        if(resp.ok) {
            estadoDiv.innerHTML = "✅ ¡Acta enviada exitosamente!";
            estadoDiv.style.color = "green";
            
            mostrarNotificacion("Acta generada y enviada correctamente", 'success');
            
            setTimeout(() => {
                mostrarNotificacion("Puede realizar una nueva entrega", 'info');
                
                borrarDatosLocales();
                document.getElementById("formulario").reset();
                limpiarFirma('colab'); 
                limpiarFirma('ana');
                configurarFechaActual();
                
                ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
                
                enviandoFormulario = false;
                btnEnviar.disabled = false;
                btnEnviar.style.opacity = "1";
                btnEnviar.style.cursor = "pointer";
                estadoDiv.innerHTML = "";
            }, 2000);
            
        } else {
            throw new Error(`Error HTTP: ${resp.status}`);
        }
    } catch(err) {
        console.error("Error al enviar:", err);
        estadoDiv.innerHTML = "❌ Error al enviar el acta";
        estadoDiv.style.color = "red";
        
        mostrarNotificacion("Error al enviar el acta. Verifique su conexión e intente nuevamente.", 'error');
        
        enviandoFormulario = false;
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = "1";
        btnEnviar.style.cursor = "pointer";
    }
});

// ============================================================================
// 9. VALIDACIONES DE ENTRADA
// ============================================================================
const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");

document.getElementById("cedula").addEventListener("input", soloNumeros);
document.getElementById("cedula_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap").addEventListener("input", soloNumeros);

document.getElementById("correo_colaborador").addEventListener("blur", function() {
    const correo = this.value.trim();
    if (correo && !correo.includes("@")) {
        mostrarNotificacion("Por favor ingrese un correo electrónico válido", 'warning');
        this.focus();
    }
});

// ============================================================================
// FIN DEL SCRIPT
// ============================================================================
console.log("📝 Sistema de Formularios RAMO v2.1 - Cargado correctamente");
