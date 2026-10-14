setTimeout(() => {

    const form = document.getElementById('formLimiteGasto');
    const lista = document.getElementById('listaLimite');
    const vacio = document.getElementById('limiteVacio');
    const total = document.getElementById('feedTotalLimite');
    const formTitulo = document.getElementById('formTituloLimite');
    const btnGuardar = document.getElementById('btnGuardarLimite');
    const btnCancelar = document.getElementById('btnCancelarEdicionLimite');

    let limites = [];

    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_limite').value;
            const fecha = document.getElementById('fecha').value;
            const monto = document.getElementById('monto').value;
            const comentario = document.getElementById('comentario').value || null;
            const data = { fecha, monto, comentario };

            btnGuardar.disabled = true;
            try {
                const url = id ? `/limitegasto/${id}` : '/limitegasto';
                const res = await fetch(url, {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    // Muy probable: ya existe un límite para esa fecha (columna UNIQUE)
                    alert(result.error || 'No se pudo guardar el límite de gasto');
                    return;
                }

                mostrarToast(id ? 'Límite actualizado' : 'Límite guardado. Agrega el siguiente');
                salirModoEdicion();
                await listar();
                document.getElementById('fecha').focus();
            } finally {
                btnGuardar.disabled = false;
            }
        });
    }

    // ========== LISTAR LIMITES DE GASTO ==========
    async function listar() {
        if (!lista) return;

        const res = await fetch('/limitegasto');
        limites = await res.json();

        lista.innerHTML = '';
        if (limites.length === 0) {
            vacio.classList.remove('d-none');
            total.textContent = '';
            return;
        }
        vacio.classList.add('d-none');
        total.textContent = `${limites.length} límite${limites.length === 1 ? '' : 's'}`;

        limites.forEach(l => {
            const fechaObj = new Date(l.fecha);
            const dia = fechaObj.toLocaleDateString('es-MX', { day: '2-digit' });
            const fechaLarga = fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

            lista.innerHTML += `
                <article class="expense-card">
                    <div class="expense-card__avatar">${dia}</div>
                    <div class="expense-card__info">
                        <p class="expense-card__nombre">${fechaLarga}</p>
                        <p class="expense-card__meta">${l.comentario ?? 'Sin comentario'}</p>
                    </div>
                    <div class="expense-card__right">
                        <p class="expense-card__monto">$${Number(l.monto).toFixed(2)}</p>
                        <details class="card-menu">
                            <summary aria-label="Más opciones">⋮</summary>
                            <div class="card-menu__list">
                                <button type="button" onclick="editarLimite(${l.pk_limite})">Editar</button>
                                <button type="button" onclick="desactivarLimite(${l.pk_limite})">Desactivar</button>
                                <button type="button" class="danger" onclick="eliminarLimite(${l.pk_limite})">Eliminar</button>
                            </div>
                        </details>
                    </div>
                </article>
            `;
        });
    }

    // ========== EDITAR LIMITE ==========
    window.editarLimite = (id) => {
        const l = limites.find(x => x.pk_limite === id);
        if (!l) return;

        document.getElementById('pk_limite').value = l.pk_limite;
        // La fecha llega como ISO completo; se recorta a YYYY-MM-DD para el input date
        document.getElementById('fecha').value = String(l.fecha).substring(0, 10);
        document.getElementById('monto').value = l.monto;
        document.getElementById('comentario').value = l.comentario ?? '';

        entrarModoEdicion();
        document.getElementById('cardFormLimite').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (btnCancelar) btnCancelar.addEventListener('click', salirModoEdicion);

    function entrarModoEdicion() {
        formTitulo.textContent = 'Editar límite de gasto';
        btnGuardar.textContent = 'Actualizar límite';
        btnCancelar.classList.remove('d-none');
    }

    function salirModoEdicion() {
        form.reset();
        document.getElementById('pk_limite').value = '';
        formTitulo.textContent = 'Nuevo límite de gasto';
        btnGuardar.textContent = 'Guardar límite';
        btnCancelar.classList.add('d-none');
    }

    // ========== DESACTIVAR (SOFT DELETE) ==========
    window.desactivarLimite = async (id) => {
        const ok = await confirmarAccion('¿Desactivar este límite de gasto?', { textoConfirmar: 'Desactivar' });
        if (!ok) return;

        await fetch(`/limitegasto/${id}/desactivar`, { method: 'PATCH' });
        mostrarToast('Límite desactivado');
        listar();
    };

    // ========== ELIMINAR (HARD DELETE) ==========
    window.eliminarLimite = async (id) => {
        const ok = await confirmarAccion(
            '¿Eliminar permanentemente este límite de gasto? Esta acción no se puede deshacer.',
            { textoConfirmar: 'Eliminar', peligro: true }
        );
        if (!ok) return;

        const res = await fetch(`/limitegasto/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok) {
            alert(result.error);
            return;
        }

        mostrarToast('Límite eliminado');
        listar();
    };

}, 100);
