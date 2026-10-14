setTimeout(() => {

    const form = document.getElementById('formCategorias');
    const lista = document.getElementById('tablaCategorias');
    const vacio = document.getElementById('categoriasVacio');
    const total = document.getElementById('feedTotalCategorias');
    const formTitulo = document.getElementById('formTituloCategoria');
    const btnGuardar = document.getElementById('btnGuardarCategoria');
    const btnCancelar = document.getElementById('btnCancelarEdicionCategoria');

    let categorias = [];

    listar();

    // ========== SUBMIT DEL FORMULARIO ==========
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_categoria').value;
            const nombre_categoria = document.getElementById('nombre').value;
            const data = { nombre_categoria };

            btnGuardar.disabled = true;
            try {
                const url = id ? `/categorias/${id}` : '/categorias';
                const res = await fetch(url, {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    alert(result.error || 'No se pudo guardar la categoría');
                    return;
                }

                mostrarToast(id ? 'Categoría actualizada' : 'Categoría guardada. Agrega la siguiente');
                salirModoEdicion();
                await listar();
                document.getElementById('nombre').focus();
            } finally {
                btnGuardar.disabled = false;
            }
        });
    }

    // ========== LISTAR CATEGORIAS ==========
    async function listar() {
        if (!lista) return;

        const res = await fetch('/categorias');
        categorias = await res.json();

        lista.innerHTML = '';
        if (categorias.length === 0) {
            vacio.classList.remove('d-none');
            total.textContent = '';
            return;
        }
        vacio.classList.add('d-none');
        total.textContent = `${categorias.length} categoría${categorias.length === 1 ? '' : 's'}`;

        categorias.forEach(c => {
            const inicial = c.nombre_categoria.charAt(0).toUpperCase();

            lista.innerHTML += `
                <article class="expense-card">
                    <div class="expense-card__avatar">${inicial}</div>
                    <div class="expense-card__info">
                        <p class="expense-card__nombre">${c.nombre_categoria}</p>
                    </div>
                    <div class="expense-card__right">
                        <details class="card-menu">
                            <summary aria-label="Más opciones">⋮</summary>
                            <div class="card-menu__list">
                                <button type="button" onclick="editarCategoria(${c.pk_categoria})">Editar</button>
                                <button type="button" onclick="desactivarCategoria(${c.pk_categoria})">Desactivar</button>
                                <button type="button" class="danger" onclick="eliminarCategoria(${c.pk_categoria})">Eliminar</button>
                            </div>
                        </details>
                    </div>
                </article>
            `;
        });
    }

    // ========== EDITAR CATEGORIA ==========
    window.editarCategoria = (id) => {
        const c = categorias.find(x => x.pk_categoria === id);
        if (!c) return;

        document.getElementById('pk_categoria').value = c.pk_categoria;
        document.getElementById('nombre').value = c.nombre_categoria;

        entrarModoEdicion();
        document.getElementById('cardFormCategoria').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('nombre').focus();
    };

    if (btnCancelar) btnCancelar.addEventListener('click', salirModoEdicion);

    function entrarModoEdicion() {
        formTitulo.textContent = 'Editar categoría';
        btnGuardar.textContent = 'Actualizar categoría';
        btnCancelar.classList.remove('d-none');
    }

    function salirModoEdicion() {
        form.reset();
        document.getElementById('pk_categoria').value = '';
        formTitulo.textContent = 'Nueva categoría';
        btnGuardar.textContent = 'Guardar categoría';
        btnCancelar.classList.add('d-none');
    }

    // ========== DESACTIVAR (SOFT DELETE) ==========
    window.desactivarCategoria = async (id) => {
        const ok = await confirmarAccion('¿Desactivar esta categoría?', { textoConfirmar: 'Desactivar' });
        if (!ok) return;

        await fetch(`/categorias/${id}/desactivar`, { method: 'PATCH' });
        mostrarToast('Categoría desactivada');
        listar();
    };

    // ========== ELIMINAR (HARD DELETE) ==========
    window.eliminarCategoria = async (id) => {
        const ok = await confirmarAccion(
            '¿Eliminar permanentemente esta categoría? Esta acción no se puede deshacer.',
            { textoConfirmar: 'Eliminar', peligro: true }
        );
        if (!ok) return;

        const res = await fetch(`/categorias/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok) {
            alert(result.error);
            return;
        }

        mostrarToast('Categoría eliminada');
        listar();
    };

}, 100);
