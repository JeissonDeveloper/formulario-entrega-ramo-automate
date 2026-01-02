// ============================================================================
// FORMULARIO DE ENTREGA DE DISPOSITIVOS MÓVILES - RAMO
// Versión: 2.0 - Actualizada Enero 2025
// ============================================================================

// URLS POWER AUTOMATE - ACTUALIZADAS (Enero 2025)
const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

// Variables globales
let sigColab, sigAna;
let enviandoFormulario = false; // Control de envíos duplicados

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
    
    console.log("✅ Formulario RAMO inicializado correctamente");
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
        // Excluir 'serial' para no guardar datos antiguos
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
        // Excluir 'serial' para no sobrescribir el que viene por URL
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

    // Identificar Select y Input de Observación
    let nombreSelect = `estado_${item}`;
    if (item === 'bateria') nombreSelect = `estado_bateria_item`;

    const selectEstado = document.querySelector(`select[name="${nombreSelect}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        // Bloquear
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

// ============================================================================
// 5. BÚSQUEDA DE COLABORADORES Y ANALISTAS
// ============================================================================
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula || cedula.trim() === "") { 
        alert("⚠️ Por favor ingrese una cédula válida"); 
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
                // MEJORA: Autocompletar TODOS los campos del analista
                document.getElementById("nombre_analista").value = data.nombre_colaborador || "";
                document.getElementById("agencia_analista").value = data.agencia || "";
                document.getElementById("telefono_analista").value = data.telefono || "";
                
                // Autocompletar campos adicionales si vienen en la respuesta
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
    
    // VALIDACIÓN 1: Serial obligatorio (NO puede estar vacío)
    const serial = document.getElementById("serial").value.trim();
    if (!serial || serial === "") {
        errores.push("❌ El campo SERIAL es obligatorio y no puede estar vacío.");
    }
    
    // VALIDACIÓN 2: Firma del colaborador (obligatoria)
    if (!sigColab.isSigned()) {
        errores.push("❌ La firma del COLABORADOR es obligatoria.");
    }
    
    // VALIDACIÓN 3: Firma del analista (AHORA ES OPCIONAL - según requerimiento #3)
    // Ya no se valida la firma del analista
    
    // VALIDACIÓN 4: Campos requeridos básicos
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
            errores.push(`❌ El campo "${campo.nombre}" es obligatorio.`);
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
        alert("⚠️ El formulario ya se está enviando. Por favor espere...");
        return;
    }

    // Ejecutar validaciones
    const errores = validarFormulario();
    if (errores.length > 0) {
        alert("⚠️ ERRORES EN EL FORMULARIO:\n\n" + errores.join("\n"));
        return;
    }

    // Marcar como "enviando" para evitar duplicados
    enviandoFormulario = true;
    
    const estadoDiv = document.getElementById("estado-envio");
    const btnEnviar = document.querySelector('.btn-principal');
    
    // Deshabilitar botón y mostrar spinner
    btnEnviar.disabled = true;
    btnEnviar.style.opacity = "0.6";
    btnEnviar.style.cursor = "not-allowed";
    estadoDiv.innerHTML = '<span class="spinner" style="border-color: #666; border-top-color: #000;"></span> Enviando acta...';

    // Helpers para extraer valores
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

    // Preparar datos del formulario
    const data = {
        // Colaborador
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

        // Dispositivo
        tipo_equipo: "Handheld",
        marca: valInput("marca"),
        modelo: valInput("modelo"),
        serial: valInput("serial"), // VALIDADO como obligatorio

        // Accesorios
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

        // Analista
        cedula_analista: valInput("cedula_analista"),
        nombre_analista: valInput("nombre_analista"),
        agencia_analista: valInput("agencia_analista"),
        telefono_analista: valInput("telefono_analista"),
        codigo_sap_analista: valInput("codigo_sap_analista"),
        cargo_analista: valInput("cargo_analista"),
        zona_analista: valInput("zona_analista"),

        // Firmas
        firma_colaborador: sigColab.c.toDataURL().split(",")[1],
        // MEJORA: Firma del analista ahora es OPCIONAL
        firma_analista: sigAna.isSigned() ? sigAna.c.toDataURL().split(",")[1] : ""
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
            
            // Limpiar formulario y datos guardados
            setTimeout(() => {
                borrarDatosLocales();
                document.getElementById("formulario").reset();
                limpiarFirma('colab'); 
                limpiarFirma('ana');
                configurarFechaActual(); // Reconfigurar fecha actual
                
                // Resetear bloqueos visuales
                ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
                
                // Re-habilitar botón
                enviandoFormulario = false;
                btnEnviar.disabled = false;
                btnEnviar.style.opacity = "1";
                btnEnviar.style.cursor = "pointer";
                estadoDiv.innerHTML = "";
                
                alert("✅ Acta generada y enviada correctamente.\n\nPuede realizar una nueva entrega.");
            }, 2000);
            
        } else {
            throw new Error(`Error HTTP: ${resp.status}`);
        }
    } catch(err) {
        console.error("Error al enviar:", err);
        estadoDiv.innerHTML = "❌ Error al enviar el acta";
        estadoDiv.style.color = "red";
        
        // Re-habilitar botón en caso de error
        enviandoFormulario = false;
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = "1";
        btnEnviar.style.cursor = "pointer";
        
        alert("❌ Error al enviar el acta. Por favor:\n\n1. Verifique su conexión a internet\n2. Verifique que todos los datos sean correctos\n3. Intente nuevamente\n\nSi el problema persiste, contacte a soporte técnico.");
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

// Validación de correo electrónico
document.getElementById("correo_colaborador").addEventListener("blur", function() {
    const correo = this.value.trim();
    if (correo && !correo.includes("@")) {
        alert("⚠️ Por favor ingrese un correo electrónico válido");
        this.focus();
    }
});

// ============================================================================
// FIN DEL SCRIPT
// ============================================================================
console.log("📝 Sistema de Formularios RAMO v2.0 - Cargado correctamente");
