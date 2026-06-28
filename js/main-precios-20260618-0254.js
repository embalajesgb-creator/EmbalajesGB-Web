const WHATSAPP_NUMERO = '541164902019';
const MENSAJE_INICIAL_WHATSAPP = 'Hola Embalajes GB, quiero hacer una consulta/cotización.';
const CATEGORIAS_PUBLICAS = [
  'Todas',
  'Bolsas camiseta',
  'Bolsas consorcio / residuo',
  'Bolsas PP / cristal',
  'Friselina',
  'Cintas',
  'Laminas / rollos',
  'Medidas especiales',
  'Otros',
];

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

function urlWhatsApp(mensaje) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function categoriaInferida(articulo) {
  const texto = ` ${normalizarBusqueda([articulo.articulo, articulo.codigo, articulo.nombre, articulo.descripcion].join(' '))} `;
  const reglas = [
    ['Bolsas camiseta', ['camiseta']],
    ['Bolsas consorcio / residuo', ['consorcio', 'residuo', 'basura']],
    ['Bolsas PP / cristal', [' pp ', 'polipropileno', 'cristal', 'bopp', 'celofan']],
    ['Friselina', ['friselina', 'frizelina', 'tnt']],
    ['Cintas', ['cinta', 'adhesiva', 'embalar']],
    ['Laminas / rollos', ['lamina', 'rollo', 'bobina', 'film', 'stretch']],
    ['Medidas especiales', ['especial', 'a medida', 'medida especial']],
  ];
  const encontrada = reglas.find(([, palabras]) => palabras.some((palabra) => texto.includes(palabra)));
  return encontrada ? encontrada[0] : 'Otros';
}

function unidadPublica(articulo) {
  const unidad = String(articulo.unidad || articulo.tipo_cantidad || articulo.medida_unidad || '').trim();
  if (!unidad) return 'unidad';
  if (normalizarBusqueda(unidad).includes('peso')) return 'kg';
  return unidad;
}

function normalizarArticuloPublico(articulo, indice) {
  const codigo = String(articulo.codigo || articulo.articulo || articulo.nombre || '').trim();
  const nombre = String(articulo.articulo || articulo.nombre || codigo).trim();
  const descripcion = String(articulo.descripcion || '').trim();
  const precioFormateado = articulo.precio_formateado || formatearPrecio(articulo.precio);
  const base = {
    indice,
    articulo: nombre,
    codigo,
    nombre,
    descripcion,
    precio: articulo.precio ?? '',
    precio_formateado: precioFormateado,
    unidad: unidadPublica(articulo),
    categoria: CATEGORIAS_PUBLICAS.includes(articulo.categoria) ? articulo.categoria : '',
  };
  base.categoria = base.categoria || categoriaInferida(base);
  base.textoBusqueda = textoBusquedaArticulo(base);
  return base;
}

function textoBusquedaArticulo(articulo) {
  return normalizarBusqueda([
    articulo.articulo,
    articulo.codigo,
    articulo.nombre,
    articulo.descripcion,
    articulo.precio_formateado,
    articulo.precio,
    articulo.unidad,
    articulo.categoria,
  ].join(' '));
}

function mensajeProducto(articulo) {
  const precioTexto = articulo.precio_formateado || formatearPrecio(articulo.precio) || 'A consultar';
  return [
    'Hola Embalajes GB, quiero consultar por este producto:',
    `Articulo/codigo: ${articulo.codigo || articulo.articulo || '-'}`,
    `Descripcion: ${articulo.descripcion || '-'}`,
    `Precio mostrado: ${precioTexto}`,
    `Unidad: ${articulo.unidad || '-'}`,
  ].join('\n');
}

function filaArticulo(articulo) {
  const precioTexto = articulo.precio_formateado || formatearPrecio(articulo.precio);
  const precio = partesPrecio(precioTexto);
  return `
    <tr>
      <td>
        <span class="nombre-articulo">${escaparHtml(articulo.articulo || articulo.nombre)}</span>
      </td>
      <td>${escaparHtml(articulo.descripcion)}</td>
      <td class="precio-celda">
        <span class="precio-web"><span>${escaparHtml(precio.simbolo)}</span><strong>${escaparHtml(precio.importe)}</strong></span>
      </td>
      <td class="consulta-celda"><button type="button" class="boton-consultar" data-indice="${articulo.indice}">Consultar</button></td>
    </tr>
  `;
}

let espaciadorListaPrecios;
let posicionNaturalListaPrecios = 0;
let encabezadoTablaPreciosFijo;
let articulosListaPrecios = [];

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
  const espacioHorizontal = window.innerWidth <= 760 ? 16 : 24;
  const izquierda = mainRect ? mainRect.left + espacioHorizontal : 0;
  const ancho = mainRect ? mainRect.width - (espacioHorizontal * 2) : window.innerWidth;
  const debeFijarse = window.scrollY + altoEncabezado >= posicionNaturalListaPrecios;

  document.documentElement.style.setProperty('--altura-encabezado', `${altoEncabezado}px`);
  document.documentElement.style.setProperty('--lista-precios-izquierda', `${izquierda - espacioHorizontal}px`);
  document.documentElement.style.setProperty('--lista-precios-ancho', `${ancho + (espacioHorizontal * 2)}px`);
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
  const filtroCategoria = document.getElementById('filtroCategoriaListaPrecios');
  if (!estado || !tabla) return;

  try {
    const datos = await obtenerDatosListaPrecios();
    const articulos = Array.isArray(datos.articulos) ? datos.articulos : [];
    if (!articulos.length) throw new Error('sin-articulos');

    articulosListaPrecios = articulos.map(normalizarArticuloPublico);

    function renderizarLista() {
      const busqueda = normalizarBusqueda(buscador?.value || '');
      const categoria = filtroCategoria?.value || 'Todas';
      const articulosVisibles = articulosListaPrecios.filter((articulo) => {
        const coincideBusqueda = !busqueda || articulo.textoBusqueda.includes(busqueda);
        const coincideCategoria = categoria === 'Todas' || articulo.categoria === categoria;
        return coincideBusqueda && coincideCategoria;
      });

      const total = articulosListaPrecios.length;
      const visibles = articulosVisibles.length;
      const fecha = datos.actualizado || '-';
      const detalleCategoria = categoria === 'Todas' ? '' : ` - ${categoria}`;
      estado.textContent = (busqueda || categoria !== 'Todas')
        ? `Actualizada: ${fecha} - ${visibles} de ${total} articulos encontrados${detalleCategoria}`
        : `Actualizada: ${fecha} - ${total} articulos publicados`;

      tabla.innerHTML = articulosVisibles.length
        ? articulosVisibles.map(filaArticulo).join('')
        : '<tr><td colspan="4">No se encontraron productos para esa busqueda.</td></tr>';
    }

    buscador?.addEventListener('input', () => {
      renderizarLista();
      prepararEncabezadoTablaPrecios();
    });
    filtroCategoria?.addEventListener('change', () => {
      renderizarLista();
      prepararEncabezadoTablaPrecios();
    });
    tabla.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.boton-consultar');
      if (!boton) return;
      const articulo = articulosListaPrecios[Number(boton.dataset.indice)];
      if (!articulo) return;
      window.open(urlWhatsApp(mensajeProducto(articulo)), '_blank', 'noopener');
    });

    renderizarLista();
    prepararEncabezadoTablaPrecios();
  } catch (error) {
    estado.textContent = 'Lista pendiente de publicacion.';
    tabla.innerHTML = '<tr><td colspan="4">Todavia no hay precios publicados en la web.</td></tr>';
  }
}

function camposCotizacionDesdeFormulario(formulario) {
  const datos = new FormData(formulario);
  const material = String(datos.get('material') || '').trim();
  const impresion = String(datos.get('impresion') || '').trim();
  const colorMaterialSeleccionado = String(datos.get('colorMaterial') || '').trim();
  const otroColorMaterial = String(datos.get('otroColorMaterial') || '').trim();
  const colorMaterial = colorMaterialSeleccionado === 'Otro'
    ? (otroColorMaterial || 'Otro')
    : colorMaterialSeleccionado;
  const campos = [
    ['Nombre del cliente', datos.get('nombreCliente')],
    ['Zona', datos.get('zonaEntrega')],
    ['Tipo de bolsa', datos.get('tipoProducto')],
    ['Medida (ancho, largo y espesor)', datos.get('medida')],
    ['Cantidad', datos.get('cantidad')],
    ['Material', material],
  ];
  campos.push(['Color material', colorMaterial]);
  campos.push(['Impresion', impresion]);
  if (impresion === 'Si') {
    campos.push(['Cantidad de colores', datos.get('cantidadColoresImpresion')]);
    campos.push(['Lado de impresion', datos.get('carasImpresion')]);
  }
  campos.push(['Observaciones', datos.get('observaciones')]);
  return campos;
}

function mensajeCotizacionWhatsapp(campos) {
  const lineas = campos
    .map(([etiqueta, valor]) => [etiqueta, String(valor || '').trim()])
    .filter(([, valor]) => valor)
    .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`);
  return [
    'Hola Embalajes GB, quiero solicitar una cotizacion.',
    ...lineas,
  ].join('\n');
}

function actualizarCamposCondicionalesCotizacion(formulario) {
  const colorMaterial = formulario.elements.colorMaterial?.value || '';
  const campoOtroColorMaterial = document.getElementById('campoOtroColorMaterialCotizacion');
  const otroColorMaterial = formulario.elements.otroColorMaterial;
  const mostrarOtroColor = colorMaterial === 'Otro';
  if (campoOtroColorMaterial) campoOtroColorMaterial.hidden = !mostrarOtroColor;
  if (otroColorMaterial) {
    otroColorMaterial.disabled = !mostrarOtroColor;
    if (!mostrarOtroColor) otroColorMaterial.value = '';
  }

  const conImpresion = formulario.elements.impresion?.value === 'Si';
  document.querySelectorAll('.campo-impresion-cotizacion').forEach((campo) => {
    campo.hidden = !conImpresion;
    campo.querySelectorAll('input, select, textarea').forEach((control) => {
      control.disabled = !conImpresion;
    });
  });
}

function abrirEmailCotizacion(mensaje) {
  const asunto = encodeURIComponent('Solicitud de cotizacion desde la web');
  const cuerpo = encodeURIComponent(mensaje);
  window.location.href = `mailto:Embalajesgb@gmail.com?subject=${asunto}&body=${cuerpo}`;
}

function prepararFormularioCotizacion() {
  const formulario = document.getElementById('formularioCotizacionWhatsapp');
  if (!formulario) return;

  actualizarCamposCondicionalesCotizacion(formulario);
  formulario.elements.material?.addEventListener('change', () => actualizarCamposCondicionalesCotizacion(formulario));
  formulario.elements.colorMaterial?.addEventListener('change', () => actualizarCamposCondicionalesCotizacion(formulario));
  formulario.elements.impresion?.addEventListener('change', () => actualizarCamposCondicionalesCotizacion(formulario));

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const mensaje = mensajeCotizacionWhatsapp(camposCotizacionDesdeFormulario(formulario));
    window.open(urlWhatsApp(mensaje), '_blank', 'noopener');
  });

  document.getElementById('enviarCotizacionEmail')?.addEventListener('click', () => {
    const mensaje = mensajeCotizacionWhatsapp(camposCotizacionDesdeFormulario(formulario));
    abrirEmailCotizacion(mensaje);
  });
}

actualizarAlturaEncabezado();
prepararEncabezadoListaPrecios();
prepararEncabezadoTablaPrecios();
prepararFormularioCotizacion();
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



