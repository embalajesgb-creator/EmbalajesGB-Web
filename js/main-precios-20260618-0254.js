function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const numero = typeof valor === 'number'
    ? valor
    : Number(String(valor).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numero)) return String(valor);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero).replace('ARS', '$').trim();
}

function partesPrecio(precioFormateado) {
  const texto = String(precioFormateado || '').trim();
  const match = texto.match(/^(\$)\s*(.+)$/);
  if (!match) return { simbolo: texto ? '$' : '', importe: texto.replace(/^\$\s*/, '') };
  return { simbolo: match[1], importe: match[2] };
}

function normalizarBusqueda(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function textoBusquedaArticulo(articulo) {
  return normalizarBusqueda([
    articulo.nombre,
    articulo.descripcion,
    articulo.precio_formateado,
    articulo.precio,
    articulo.codigo,
    articulo.medida,
  ].join(' '));
}

function filaArticulo(articulo) {
  const precioTexto = articulo.precio_formateado || formatearPrecio(articulo.precio);
  const precio = partesPrecio(precioTexto);
  return `
    <tr>
      <td>${escaparHtml(articulo.nombre)}</td>
      <td>${escaparHtml(articulo.descripcion)}</td>
      <td class="precio-celda"><span class="precio-web"><span>${escaparHtml(precio.simbolo)}</span><strong>${escaparHtml(precio.importe)}</strong></span></td>
    </tr>
  `;
}

let espaciadorListaPrecios;
let posicionNaturalListaPrecios = 0;
let encabezadoTablaPreciosFijo;

function actualizarAlturaEncabezado() {
  const encabezado = document.querySelector('.encabezado');
  if (!encabezado) return;
  document.documentElement.style.setProperty('--altura-encabezado', `${encabezado.offsetHeight}px`);
}

function prepararEncabezadoListaPrecios() {
  const encabezadoLista = document.querySelector('.encabezado-lista-precios');
  if (!encabezadoLista) return;

  if (!espaciadorListaPrecios) {
    espaciadorListaPrecios = document.createElement('div');
    espaciadorListaPrecios.className = 'espaciador-lista-precios';
    encabezadoLista.before(espaciadorListaPrecios);
  }

  encabezadoLista.classList.remove('esta-fijo');
  espaciadorListaPrecios.classList.remove('activo');
  posicionNaturalListaPrecios = encabezadoLista.getBoundingClientRect().top + window.scrollY;
  actualizarEncabezadoListaPrecios();
}

function actualizarEncabezadoListaPrecios() {
  const encabezado = document.querySelector('.encabezado');
  const encabezadoLista = document.querySelector('.encabezado-lista-precios');
  if (!encabezado || !encabezadoLista || !espaciadorListaPrecios) return;

  const altoEncabezado = encabezado.getBoundingClientRect().height;
  const mainRect = document.querySelector('main')?.getBoundingClientRect();
  const margenHorizontal = window.innerWidth <= 760 ? 16 : 24;
  const izquierda = mainRect ? mainRect.left + margenHorizontal : 0;
  const ancho = mainRect ? mainRect.width - (margenHorizontal * 2) : window.innerWidth;
  const debeFijarse = window.scrollY + altoEncabezado >= posicionNaturalListaPrecios;

  document.documentElement.style.setProperty('--altura-encabezado', `${altoEncabezado}px`);
  document.documentElement.style.setProperty('--lista-precios-izquierda', `${izquierda - margenHorizontal}px`);
  document.documentElement.style.setProperty('--lista-precios-ancho', `${ancho + (margenHorizontal * 2)}px`);
  document.documentElement.style.setProperty('--alto-encabezado-lista', `${encabezadoLista.offsetHeight}px`);

  encabezadoLista.classList.toggle('esta-fijo', debeFijarse);
  espaciadorListaPrecios.classList.toggle('activo', debeFijarse);
  actualizarEncabezadoTablaPrecios();
}

function prepararScrollHorizontalTablaPrecios() {
  const contenedor = document.querySelector('.tabla-precios-web');
  if (!contenedor || contenedor.dataset.sincronizaTitulos === 'true') return;

  contenedor.dataset.sincronizaTitulos = 'true';
  contenedor.addEventListener('scroll', actualizarEncabezadoTablaPrecios, { passive: true });
}

function prepararEncabezadoTablaPrecios() {
  prepararScrollHorizontalTablaPrecios();
  const titulos = Array.from(document.querySelectorAll('.tabla-precios-web thead th'));
  if (!titulos.length) return;

  if (!encabezadoTablaPreciosFijo) {
    encabezadoTablaPreciosFijo = document.createElement('div');
    encabezadoTablaPreciosFijo.className = 'encabezado-tabla-precios-fijo';
    document.body.appendChild(encabezadoTablaPreciosFijo);
  }

  encabezadoTablaPreciosFijo.innerHTML = titulos
    .map((titulo) => `<span>${titulo.innerHTML}</span>`)
    .join('');
  actualizarEncabezadoTablaPrecios();
}

function actualizarEncabezadoTablaPrecios() {
  const tabla = document.querySelector('.tabla-precios-web table');
  const filaTitulos = document.querySelector('.tabla-precios-web thead tr');
  const encabezadoLista = document.querySelector('.encabezado-lista-precios');
  if (!tabla || !filaTitulos || !encabezadoTablaPreciosFijo || !encabezadoLista) return;

  const tablaRect = tabla.getBoundingClientRect();
  const titulosRect = filaTitulos.getBoundingClientRect();
  const columnas = Array.from(filaTitulos.children)
    .map((titulo) => `${titulo.getBoundingClientRect().width}px`)
    .join(' ');
  const altoTitulos = titulosRect.height;
  const limiteSuperior = encabezadoLista.getBoundingClientRect().bottom;
  const debeFijarse = titulosRect.top <= limiteSuperior && tablaRect.bottom > limiteSuperior + altoTitulos;

  document.documentElement.style.setProperty('--tabla-precios-izquierda', `${tablaRect.left}px`);
  document.documentElement.style.setProperty('--tabla-precios-ancho', `${tablaRect.width}px`);
  document.documentElement.style.setProperty('--tabla-precios-columnas', columnas);
  encabezadoTablaPreciosFijo.classList.toggle('visible', debeFijarse);
}

async function obtenerDatosListaPrecios() {
  try {
    const respuesta = await fetch('data/precios.json?v=' + Date.now(), { cache: 'no-store' });
    if (!respuesta.ok) throw new Error('sin-publicacion');
    return await respuesta.json();
  } catch (error) {
    if (window.LISTA_PRECIOS_PUBLICADA) return window.LISTA_PRECIOS_PUBLICADA;
    throw error;
  }
}

async function cargarListaPrecios() {
  const estado = document.getElementById('estadoListaPrecios');
  const tabla = document.getElementById('tablaListaPreciosWeb');
  const buscador = document.getElementById('buscadorListaPrecios');
  if (!estado || !tabla) return;

  try {
    const datos = await obtenerDatosListaPrecios();
    const articulos = Array.isArray(datos.articulos) ? datos.articulos : [];
    if (!articulos.length) throw new Error('sin-articulos');

    const articulosConBusqueda = articulos.map((articulo) => ({
      ...articulo,
      textoBusqueda: textoBusquedaArticulo(articulo),
    }));

    function renderizarLista() {
      const busqueda = normalizarBusqueda(buscador?.value || '');
      const articulosVisibles = busqueda
        ? articulosConBusqueda.filter((articulo) => articulo.textoBusqueda.includes(busqueda))
        : articulosConBusqueda;

      const total = articulos.length;
      const visibles = articulosVisibles.length;
      const fecha = datos.actualizado || '-';
      estado.textContent = busqueda
        ? `Actualizada: ${fecha} - ${visibles} de ${total} articulos encontrados`
        : `Actualizada: ${fecha} - ${total} articulos publicados`;

      tabla.innerHTML = articulosVisibles.length
        ? articulosVisibles.map(filaArticulo).join('')
        : '<tr><td colspan="3">No se encontraron productos para esa busqueda.</td></tr>';
    }

    buscador?.addEventListener('input', () => {
      renderizarLista();
      prepararEncabezadoTablaPrecios();
    });
    renderizarLista();
    prepararEncabezadoTablaPrecios();
  } catch (error) {
    estado.textContent = 'Lista pendiente de publicacion.';
    tabla.innerHTML = '<tr><td colspan="3">Todavia no hay precios publicados en la web.</td></tr>';
  }
}

actualizarAlturaEncabezado();
prepararEncabezadoListaPrecios();
prepararEncabezadoTablaPrecios();
window.addEventListener('scroll', actualizarEncabezadoListaPrecios, { passive: true });
window.addEventListener('resize', () => {
  prepararEncabezadoListaPrecios();
  prepararEncabezadoTablaPrecios();
});
window.addEventListener('load', () => {
  prepararEncabezadoListaPrecios();
  prepararEncabezadoTablaPrecios();
});
cargarListaPrecios();
