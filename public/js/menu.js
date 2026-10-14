// "gasto" (alta rápida) es la pantalla principal: se abre automáticamente al entrar
window.onload = () => cargarVista(localStorage.getItem('vista') || 'gasto');


// Mapa vista → JS a cargar
const modulos = {
    gasto: 'gasto',
    registros: 'registros',
    categorias: 'categorias',
    ahorro: 'ahorro',
    limitegasto: 'limitegasto'
};


async function cargarVista(vista) {


    localStorage.setItem('vista', vista);

    // Mientras seguimos iterando el diseño, se evita que el navegador
    // sirva versiones viejas en caché de la vista y su script
    const cacheBuster = Date.now();

    const res = await fetch(`/views/${vista}.html?v=${cacheBuster}`);
    const html = await res.text();


    const contenedor = document.getElementById('contenido');
    contenedor.innerHTML = html;


    // Eliminar scripts anteriores
    document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());


    marcarNavActivo(vista);


    const modulo = modulos[vista];
    if (!modulo) return;


    const script = document.createElement('script');
    script.src = `/js/${modulo}.js?v=${cacheBuster}`;
    script.dataset.modulo = modulo;


    contenedor.appendChild(script);
}


// Resalta en el menú (lateral en escritorio, inferior en móvil) la sección activa
function marcarNavActivo(vista) {
    document.querySelectorAll('.side-nav__item, .bottom-nav__item').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.vista === vista);
    });
}


// ---------- Aviso de confirmación (global, usado por cualquier vista) ----------
let toastTimeout;

window.mostrarToast = function (mensaje) {
    const toast = document.getElementById('toastApp');
    const texto = document.getElementById('toastMensaje');
    if (!toast || !texto) return;

    texto.textContent = mensaje;
    toast.classList.add('is-visible');

    // Se cierra solo a los 2 segundos
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(cerrarToast, 2000);
};

function cerrarToast() {
    const toast = document.getElementById('toastApp');
    if (!toast) return;
    toast.classList.remove('is-visible');
    clearTimeout(toastTimeout);
}

// Botón "×" para cerrar el aviso manualmente antes de que se cierre solo
const btnCerrarToast = document.getElementById('toastCerrar');
if (btnCerrarToast) {
    btnCerrarToast.addEventListener('click', cerrarToast);
}

// ---------- Confirmación personalizada (reemplaza el confirm() del navegador) ----------
// Uso: const ok = await confirmarAccion('¿Seguro?', { textoConfirmar: 'Eliminar', peligro: true });
window.confirmarAccion = function (mensaje, opciones = {}) {
    const { textoConfirmar = 'Confirmar', peligro = false } = opciones;

    const backdrop = document.getElementById('appConfirmBackdrop');
    const texto = document.getElementById('appConfirmMensaje');
    const btnAceptar = document.getElementById('appConfirmAceptar');
    const btnCancelar = document.getElementById('appConfirmCancelar');

    if (!backdrop || !texto || !btnAceptar || !btnCancelar) {
        // Red de seguridad por si el modal no cargó: no se queda sin funcionar
        return Promise.resolve(window.confirm(mensaje));
    }

    return new Promise((resolve) => {
        texto.textContent = mensaje;
        btnAceptar.textContent = textoConfirmar;
        btnAceptar.classList.toggle('btn-danger', peligro);
        btnAceptar.classList.toggle('btn-primary', !peligro);

        backdrop.classList.add('is-visible');
        btnAceptar.focus();

        function cerrar(resultado) {
            backdrop.classList.remove('is-visible');
            btnAceptar.removeEventListener('click', onAceptar);
            btnCancelar.removeEventListener('click', onCancelar);
            backdrop.removeEventListener('click', onFondo);
            document.removeEventListener('keydown', onTecla);
            resolve(resultado);
        }
        function onAceptar() { cerrar(true); }
        function onCancelar() { cerrar(false); }
        function onFondo(e) { if (e.target === backdrop) cerrar(false); }
        function onTecla(e) { if (e.key === 'Escape') cerrar(false); }

        btnAceptar.addEventListener('click', onAceptar);
        btnCancelar.addEventListener('click', onCancelar);
        backdrop.addEventListener('click', onFondo);
        document.addEventListener('keydown', onTecla);
    });
};
