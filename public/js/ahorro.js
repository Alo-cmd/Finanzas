setTimeout(() => {

    const form = document.getElementById('formAhorro');
    const lista = document.getElementById('listaAhorro');
    const vacio = document.getElementById('ahorroVacio');
    const total = document.getElementById('feedTotalAhorro');
    const formTitulo = document.getElementById('formTituloAhorro');
    const btnGuardar = document.getElementById('btnGuardarAhorro');
    const btnCancelar = document.getElementById('btnCancelarEdicionAhorro');

    let ahorros = [];

    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_ahorro').value;
            const nombre_ahorro = document.getElementById('nombre_ahorro').value;
            const monto = document.getElementById('monto').value;
            const descripcion = document.getElementById('descripcion').value || null;
            const data = { nombre_ahorro, monto, descripcion };

            btnGuardar.disabled = true;
            try {
                const url = id ? `/ahorro/${id}` : '/ahorro';
                const res = await fetch(url, {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    alert(result.error || 'No se pudo guardar el ahorro');
                    return;
                }

                mostrarToast(id ? 'Ahorro actualizado' : 'Ahorro guardado. Agrega el siguiente');
                salirModoEdicion();
                await listar();
                document.getElementById('nombre_ahorro').focus();
            } finally {
                btnGuardar.disabled = false;
            }
        });
    }

    // ========== LISTAR AHORROS ==========
    async function listar() {
        if (!lista) return;

        const res = await fetch('/ahorro');
        ahorros = await res.json();

        lista.innerHTML = '';
        if (ahorros.length === 0) {
            vacio.classList.remove('d-none');
            total.textContent = '';
            return;
        }
        vacio.classList.add('d-none');

        const totalGeneral = ahorros.reduce((acc, a) => acc + Number(a.monto), 0);
        total.textContent = `Total: $${totalGeneral.toFixed(2)}`;

        ahorros.forEach(a => {
            const inicial = a.nombre_ahorro.charAt(0).toUpperCase();
            const fecha = new Date(a.fecha_hora).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

            lista.innerHTML += `
                <article class="expense-card">
                    <div class="expense-card__avatar">${inicial}</div>
                    <div class="expense-card__info">
                        <p class="expense-card__nombre">${a.nombre_ahorro}</p>
                        <p class="expense-card__meta">${a.descripcion ? a.descripcion + ' · ' : ''}${fecha}</p>
                    </div>
                    <div class="expense-card__right">
                        <p class="expense-card__monto">$${Number(a.monto).toFixed(2)}</p>
                        <details class="card-menu">
                            <summary aria-label="Más opciones">⋮</summary>
                            <div class="card-menu__list">
                                <button type="button" onclick="editarAhorro(${a.pk_ahorro})">Editar</button>
                                <button type="button" onclick="desactivarAhorro(${a.pk_ahorro})">Desactivar</button>
                                <button type="button" class="danger" onclick="eliminarAhorro(${a.pk_ahorro})">Eliminar</button>
                            </div>
                        </details>
                    </div>
                </article>
            `;
        });
    }

    // ========== EDITAR AHORRO ==========
    window.editarAhorro = (id) => {
        const a = ahorros.find(x => x.pk_ahorro === id);
        if (!a) return;

        document.getElementById('pk_ahorro').value = a.pk_ahorro;
        document.getElementById('nombre_ahorro').value = a.nombre_ahorro;
        document.getElementById('monto').value = a.monto;
        document.getElementById('descripcion').value = a.descripcion ?? '';

        entrarModoEdicion();
        document.getElementById('cardFormAhorro').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('nombre_ahorro').focus();
    };

    if (btnCancelar) btnCancelar.addEventListener('click', salirModoEdicion);

    function entrarModoEdicion() {
        formTitulo.textContent = 'Editar ahorro';
        btnGuardar.textContent = 'Actualizar ahorro';
        btnCancelar.classList.remove('d-none');
    }

    function salirModoEdicion() {
        form.reset();
        document.getElementById('pk_ahorro').value = '';
        formTitulo.textContent = 'Nuevo ahorro';
        btnGuardar.textContent = 'Guardar ahorro';
        btnCancelar.classList.add('d-none');
    }

    // ========== DESACTIVAR (SOFT DELETE) ==========
    window.desactivarAhorro = async (id) => {
        const ok = await confirmarAccion('¿Desactivar este ahorro?', { textoConfirmar: 'Desactivar' });
        if (!ok) return;

        await fetch(`/ahorro/${id}/desactivar`, { method: 'PATCH' });
        mostrarToast('Ahorro desactivado');
        listar();
    };

    // ========== ELIMINAR (HARD DELETE) ==========
    window.eliminarAhorro = async (id) => {
        const ok = await confirmarAccion(
            '¿Eliminar permanentemente este ahorro? Esta acción no se puede deshacer.',
            { textoConfirmar: 'Eliminar', peligro: true }
        );
        if (!ok) return;

        const res = await fetch(`/ahorro/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok) {
            alert(result.error);
            return;
        }

        mostrarToast('Ahorro eliminado');
        listar();
    };

}, 100);
