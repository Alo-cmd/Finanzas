setTimeout(() => {

    // Referencias a elementos del DOM
    const lista = document.getElementById('listaGasto');
    const feedVacio = document.getElementById('feedVacio');
    const feedTotal = document.getElementById('feedTotal');
    const btnCargarMas = document.getElementById('btnCargarMas');
    const buscador = document.getElementById('buscadorRegistros');
    const inputFecha = document.getElementById('fechaRegistros');
    const btnHoy = document.getElementById('btnHoy');

    let gastos = [];
    let visibles = 10;
    const PAGINA = 10;

    // Por defecto siempre se muestra el día de HOY (hora local del navegador)
    inputFecha.value = hoyLocalISO();
    actualizarBotonHoy();

    listar();

    // ========== FECHAS: la BD guarda fecha_hora en UTC ==========
    // Hay que convertir a la fecha LOCAL del navegador antes de comparar,
    // si no, cerca de medianoche "hoy" podría mostrar el día equivocado.
    function hoyLocalISO() {
        return fechaLocalISO(new Date());
    }

    function fechaLocalISO(fecha) {
        const d = (fecha instanceof Date) ? fecha : new Date(fecha);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    }

    // ========== LISTAR GASTOS (feed de tarjetas) ==========
    async function listar() {
        if (!lista) return;

        const res = await fetch('/gasto');
        gastos = await res.json();
        visibles = PAGINA;
        renderLista();
    }

    function obtenerFiltrados() {
        const fechaSeleccionada = inputFecha.value;
        const termino = buscador.value.trim().toLowerCase();

        return gastos.filter(g => {
            if (fechaSeleccionada && fechaLocalISO(g.fecha_hora) !== fechaSeleccionada) return false;
            if (!termino) return true;

            const nombre = (g.nombre_gasto || '').toLowerCase();
            const categoria = (g.nombre_categoria || '').toLowerCase();
            return nombre.includes(termino) || categoria.includes(termino);
        });
    }

    function renderLista() {
        const filtrados = obtenerFiltrados();
        lista.innerHTML = '';

        if (filtrados.length === 0) {
            feedVacio.textContent = mensajeVacio();
            feedVacio.classList.remove('d-none');
            feedTotal.textContent = '$0.00';
            btnCargarMas.classList.add('d-none');
            return;
        }
        feedVacio.classList.add('d-none');

        // El total de arriba refleja lo que se está viendo (el día, y la búsqueda si hay una)
        const totalFiltrado = filtrados.reduce((acc, g) => acc + Number(g.total), 0);
        feedTotal.textContent = `Total: $${totalFiltrado.toFixed(2)}`;

        filtrados.slice(0, visibles).forEach(g => {
            const fecha = new Date(g.fecha_hora).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
            const inicial = (g.nombre_categoria || g.nombre_gasto || '?').charAt(0).toUpperCase();

            lista.innerHTML += `
                <article class="expense-card">
                    <div class="expense-card__avatar">${inicial}</div>
                    <div class="expense-card__info">
                        <p class="expense-card__nombre">${g.nombre_gasto}</p>
                        <p class="expense-card__meta">${g.nombre_categoria ?? 'Sin categoría'} · ${fecha}</p>
                    </div>
                    <div class="expense-card__right">
                        <p class="expense-card__monto">$${Number(g.total).toFixed(2)}</p>
                        <details class="card-menu">
                            <summary aria-label="Más opciones">⋮</summary>
                            <div class="card-menu__list">
                                <button type="button" onclick="editarRegistro(${g.pk_gasto})">Editar</button>
                                <button type="button" onclick="desactivarRegistro(${g.pk_gasto})">Desactivar</button>
                                <button type="button" class="danger" onclick="eliminarRegistro(${g.pk_gasto})">Eliminar</button>
                            </div>
                        </details>
                    </div>
                </article>
            `;
        });

        btnCargarMas.classList.toggle('d-none', visibles >= filtrados.length);
    }

    function mensajeVacio() {
        const termino = buscador.value.trim();
        if (termino) {
            return `No se encontraron resultados para "${termino}".`;
        }

        // 'T00:00:00' fuerza que se interprete en hora LOCAL (si no, un YYYY-MM-DD
        // solo se toma como UTC y podría mostrar un día antes).
        const fechaTexto = new Date(`${inputFecha.value}T00:00:00`)
            .toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

        return inputFecha.value === hoyLocalISO()
            ? `Aún no registras gastos hoy, ${fechaTexto}.`
            : `No hay gastos registrados el ${fechaTexto}.`;
    }

    function actualizarBotonHoy() {
        if (!btnHoy) return;
        btnHoy.classList.toggle('d-none', inputFecha.value === hoyLocalISO());
    }

    // ========== FILTROS: buscador en vivo + selector de fecha ==========
    if (buscador) {
        buscador.addEventListener('input', () => {
            visibles = PAGINA;
            renderLista();
        });
    }

    if (inputFecha) {
        inputFecha.addEventListener('change', () => {
            if (!inputFecha.value) inputFecha.value = hoyLocalISO();
            visibles = PAGINA;
            actualizarBotonHoy();
            renderLista();
        });
    }

    if (btnHoy) {
        btnHoy.addEventListener('click', () => {
            inputFecha.value = hoyLocalISO();
            visibles = PAGINA;
            actualizarBotonHoy();
            renderLista();
        });
    }

    if (btnCargarMas) {
        btnCargarMas.addEventListener('click', () => {
            visibles += PAGINA;
            renderLista();
        });
    }

    // ========== EDITAR (delega al formulario de "Nuevo gasto") ==========
    window.editarRegistro = (id) => {
        const g = gastos.find(x => x.pk_gasto === id);
        if (!g) return;

        // El formulario vive solo en la vista "gasto"; se le pasa el registro
        // a editar mediante sessionStorage y se navega hacia allá
        sessionStorage.setItem('gastoEnEdicion', JSON.stringify(g));
        cargarVista('gasto');
    };

    // ========== DESACTIVAR GASTO (SOFT DELETE) ==========
    window.desactivarRegistro = async (id) => {
        const ok = await confirmarAccion('¿Desactivar este gasto?', { textoConfirmar: 'Desactivar' });
        if (!ok) return;

        await fetch(`/gasto/${id}/desactivar`, { method: 'PATCH' });
        mostrarToast('Gasto desactivado');
        listar();
    };

    // ========== ELIMINAR GASTO (HARD DELETE) ==========
    window.eliminarRegistro = async (id) => {
        const ok = await confirmarAccion(
            '¿Eliminar permanentemente este gasto? Esta acción no se puede deshacer.',
            { textoConfirmar: 'Eliminar', peligro: true }
        );
        if (!ok) return;

        const res = await fetch(`/gasto/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok) {
            alert(result.error);
            return;
        }

        mostrarToast('Gasto eliminado');
        listar();
    };

}, 100); // Timeout para asegurar que el DOM esté listo
