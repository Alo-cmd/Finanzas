setTimeout(() => {

    // Referencias a elementos del DOM
    const form = document.getElementById('formGasto');
    const selectCategoria = document.getElementById('fk_categoria');
    const detalleToggle = document.getElementById('detalleToggle');
    const formTitulo = document.getElementById('formTitulo');
    const btnGuardar = document.getElementById('btnGuardarGasto');
    const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
    const btnAgregarLista = document.getElementById('btnAgregarLista');
    const bloquePendientes = document.getElementById('bloquePendientes');
    const pendientesList = document.getElementById('pendientesList');
    const pendientesCount = document.getElementById('pendientesCount');
    const btnGuardarTodos = document.getElementById('btnGuardarTodos');
    const btnLimpiarPendientes = document.getElementById('btnLimpiarPendientes');

    let pendientes = []; // gastos acumulados en modo "alta en lote", aún no guardados
    let editando = false;

    // Cargar categorías y, si venimos de "Registros" a editar algo, precargar el formulario
    cargarCategorias().then(cargarEdicionPendiente);

    // ========== CARGAR CATEGORIAS EN EL SELECT (LLAVE FORANEA) ==========
    async function cargarCategorias() {
        if (!selectCategoria) return;

        const res = await fetch('/categorias');
        const categorias = await res.json();

        selectCategoria.innerHTML = '<option value="">Elegir…</option>';
        categorias.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.pk_categoria}">${cat.nombre_categoria}</option>`;
        });
    }

    // ========== EDICION PENDIENTE (llega desde "Registros") ==========
    function cargarEdicionPendiente() {
        const pendiente = sessionStorage.getItem('gastoEnEdicion');
        if (!pendiente) return;
        sessionStorage.removeItem('gastoEnEdicion');

        const g = JSON.parse(pendiente);

        document.getElementById('pk_gasto').value = g.pk_gasto;
        document.getElementById('nombre_gasto').value = g.nombre_gasto;
        document.getElementById('total').value = g.total;
        document.getElementById('description').value = g.description ?? '';
        document.getElementById('cantidad').value = g.cantidad ?? '';
        document.getElementById('precio').value = g.precio ?? '';
        document.getElementById('fk_categoria').value = g.fk_categoria ?? '';

        // Si ya tenía detalle cargado, se muestra expandido de una vez
        if (g.description || g.cantidad || g.precio) {
            detalleToggle.open = true;
        }

        entrarModoEdicion();
        document.getElementById('nombre_gasto').focus();
    }

    // ========== LEER / LIMPIAR LOS CAMPOS DEL FORMULARIO ==========
    function leerFormulario() {
        return {
            nombre_gasto: document.getElementById('nombre_gasto').value,
            total: document.getElementById('total').value,
            description: document.getElementById('description').value || null,
            cantidad: document.getElementById('cantidad').value || null,
            precio: document.getElementById('precio').value || null,
            fk_categoria: document.getElementById('fk_categoria').value,
            nombre_categoria: selectCategoria.options[selectCategoria.selectedIndex]?.text ?? ''
        };
    }

    function limpiarCamposRapidos() {
        form.reset();
        detalleToggle.open = false;
    }

    // ========== SUBMIT DEL FORMULARIO (guardar de inmediato, un solo gasto) ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_gasto').value;
            const data = leerFormulario();
            delete data.nombre_categoria;

            btnGuardar.disabled = true;
            try {
                const url = id ? `/gasto/${id}` : '/gasto';
                const res = await fetch(url, {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    alert(result.error || 'No se pudo guardar el gasto');
                    return;
                }

                if (id) {
                    mostrarToast('Gasto actualizado');
                    salirModoEdicion();
                    cargarVista('registros'); // se editó desde ahí, regresamos a verlo
                    return;
                }

                // El formulario queda listo de inmediato para el siguiente registro
                mostrarToast('Gasto guardado. Agrega el siguiente');
                limpiarCamposRapidos();
                document.getElementById('nombre_gasto').focus();
            } finally {
                btnGuardar.disabled = false;
            }
        });
    }

    // ========== ALTA EN LOTE: agregar el registro actual a la lista de pendientes ==========
    if (btnAgregarLista) {
        btnAgregarLista.addEventListener('click', () => {
            if (!form.reportValidity()) return; // usa la validación nativa (required) del formulario

            const item = leerFormulario();
            item._id = Date.now() + Math.random();
            pendientes.push(item);

            limpiarCamposRapidos();
            renderPendientes();
            document.getElementById('nombre_gasto').focus();
        });
    }

    function renderPendientes() {
        pendientesCount.textContent = pendientes.length;
        bloquePendientes.classList.toggle('d-none', pendientes.length === 0);

        pendientesList.innerHTML = pendientes.map(p => `
            <li class="pendientes__item">
                <span class="pendientes__texto">
                    <strong>${p.nombre_gasto}</strong> — $${Number(p.total).toFixed(2)}
                    ${p.nombre_categoria ? `· ${p.nombre_categoria}` : ''}
                </span>
                <button type="button" aria-label="Quitar de la lista" onclick="quitarPendiente(${p._id})">×</button>
            </li>
        `).join('');
    }

    window.quitarPendiente = (id) => {
        pendientes = pendientes.filter(p => p._id !== id);
        renderPendientes();
    };

    if (btnLimpiarPendientes) {
        btnLimpiarPendientes.addEventListener('click', async () => {
            if (pendientes.length === 0) return;
            const ok = await confirmarAccion('¿Vaciar la lista de gastos por guardar?', { textoConfirmar: 'Vaciar' });
            if (!ok) return;
            pendientes = [];
            renderPendientes();
        });
    }

    // ========== GUARDAR TODOS LOS PENDIENTES (bulk insert) ==========
    if (btnGuardarTodos) {
        btnGuardarTodos.addEventListener('click', async () => {
            if (pendientes.length === 0) return;

            const items = pendientes.map(({ _id, nombre_categoria, ...resto }) => resto);

            btnGuardarTodos.disabled = true;
            try {
                const res = await fetch('/gasto/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items })
                });
                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    alert(result.error || 'No se pudo guardar la lista de gastos');
                    return;
                }

                mostrarToast(`${items.length} gastos guardados`);
                pendientes = [];
                renderPendientes();
            } finally {
                btnGuardarTodos.disabled = false;
            }
        });
    }

    if (btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener('click', () => {
            salirModoEdicion();
            cargarVista('registros');
        });
    }

    function entrarModoEdicion() {
        editando = true;
        formTitulo.textContent = 'Editar gasto';
        btnGuardar.textContent = 'Actualizar gasto';
        btnCancelarEdicion.classList.remove('d-none');
        // La alta en lote no aplica mientras se edita un registro existente
        btnAgregarLista.classList.add('d-none');
    }

    function salirModoEdicion() {
        editando = false;
        form.reset();
        document.getElementById('pk_gasto').value = '';
        detalleToggle.open = false;
        formTitulo.textContent = 'Nuevo gasto';
        btnGuardar.textContent = 'Guardar gasto';
        btnCancelarEdicion.classList.add('d-none');
        btnAgregarLista.classList.remove('d-none');
    }

}, 100); // Timeout para asegurar que el DOM esté listo
