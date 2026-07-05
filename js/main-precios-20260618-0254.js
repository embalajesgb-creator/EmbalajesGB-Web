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

const catalogoImagenesProductos = window.IMAGENES_PRODUCTOS_GB || {};
const productosImagenes = Array.isArray(catalogoImagenesProductos.productos)
  ? catalogoImagenesProductos.productos
  : [];
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

function normalizarRelacionadosExactos(valores) {
  if (!Array.isArray(valores)) return [];
  return valores.map(normalizarBusqueda).filter(Boolean);
}

function normalizarRelacionadosIncluye(valores) {
  if (!Array.isArray(valores)) return [];
  return valores.map(normalizarBusqueda).filter(Boolean);
}

function coincideRelacionExactaArticulo(articulo, relacionadosExactos) {
  if (!relacionadosExactos.length) return true;
  const claves = [
    articulo.articulo,
    articulo.codigo,
    articulo.nombre,
  ].map(normalizarBusqueda).filter(Boolean);
  return relacionadosExactos.some((relacionado) => claves.includes(relacionado));
}

function coincideRelacionIncluyeArticulo(articulo, relacionadosIncluye) {
  if (!relacionadosIncluye.length) return true;
  return relacionadosIncluye.every((relacionado) => articulo.textoBusqueda.includes(relacionado));
}

function productoImagenPorId(id) {
  return productosImagenes.find((producto) => producto.id === id) || null;
}

function rutaImagenProducto(producto) {
  if (!producto?.archivo) return '';
  return `${catalogoImagenesProductos.basePath || ''}${producto.archivo}`;
}

function escaparRegExp(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contieneTermino(textoNormalizado, termino) {
  const terminoNormalizado = normalizarBusqueda(termino);
  if (!terminoNormalizado) return false;
  if (terminoNormalizado.length <= 3) {
    const patron = new RegExp(`(^|[^a-z0-9])${escaparRegExp(terminoNormalizado)}($|[^a-z0-9])`);
    return patron.test(textoNormalizado);
  }
  return textoNormalizado.includes(terminoNormalizado);
}

function puntajeImagenArticulo(textoNormalizado, producto) {
  const reglas = Array.isArray(producto.reglas) ? producto.reglas : [];
  let puntaje = 0;

  reglas.forEach((regla) => {
    const terminos = Array.isArray(regla) ? regla : [regla];
    if (terminos.every((termino) => contieneTermino(textoNormalizado, termino))) {
      puntaje = Math.max(puntaje, terminos.length * 10);
    }
  });

  const busqueda = normalizarBusqueda(producto.busqueda || producto.titulo || '');
  busqueda.split(/\s+/).forEach((termino) => {
    if (contieneTermino(textoNormalizado, termino)) puntaje += 1;
  });

  return puntaje;
}

function imagenParaArticulo(articulo) {
  const texto = normalizarBusqueda([
    articulo.articulo,
    articulo.nombre,
    articulo.codigo,
    articulo.descripcion,
    articulo.categoria,
  ].join(' '));

  return productosImagenes
    .map((producto) => ({ producto, puntaje: puntajeImagenArticulo(texto, producto) }))
    .filter((resultado) => resultado.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)[0]?.producto || null;
}

function urlWhatsApp(mensaje) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function mensajeProductoImagen(producto) {
  return [
    'Hola Embalajes GB, quiero consultar por este producto.',
    `Producto: ${producto.titulo}`,
    `Familia: ${producto.familia}`,
    `Descripcion: ${producto.descripcion}`,
  ].join('\n');
}

function tarjetaProductoDestacado(producto) {
  return `
    <article class="tarjeta-producto-web">
      <img src="${escaparHtml(rutaImagenProducto(producto))}" alt="${escaparHtml(producto.titulo)}" loading="lazy" />
      <div>
        <span class="familia-producto-web">${escaparHtml(producto.familia)}</span>
        <h3>${escaparHtml(producto.titulo)}</h3>
      </div>
      <p>${escaparHtml(producto.descripcion)}</p>
      <div class="acciones-producto-web">
        <button type="button" class="boton-ver-relacionados" data-producto="${escaparHtml(producto.id)}" data-busqueda="${escaparHtml(producto.filtroLista || producto.busqueda || producto.titulo)}">Ver relacionados</button>
        <button type="button" class="boton-consultar-producto" data-producto="${escaparHtml(producto.id)}">Consultar</button>
      </div>
    </article>
  `;
}

function renderizarProductosDestacados() {
  const contenedor = document.getElementById('productosDestacadosWeb');
  if (!contenedor || !productosImagenes.length) return;

  contenedor.innerHTML = productosImagenes.map(tarjetaProductoDestacado).join('');
  contenedor.addEventListener('click', (evento) => {
    const botonRelacionados = evento.target.closest('.boton-ver-relacionados');
    if (botonRelacionados) {
      const producto = productoImagenPorId(botonRelacionados.dataset.producto);
      const relacionadosExactos = Array.isArray(producto?.relacionadosExactos)
        ? producto.relacionadosExactos
        : [];
      const relacionadosIncluye = Array.isArray(producto?.relacionadosIncluye)
        ? producto.relacionadosIncluye
        : [];
      const tieneRelacionDefinida = relacionadosExactos.length || relacionadosIncluye.length;
      document.dispatchEvent(new CustomEvent('gb:filtrar-relacionados', {
        detail: {
          busqueda: tieneRelacionDefinida ? '' : (botonRelacionados.dataset.busqueda || ''),
          relacionadosExactos,
          relacionadosIncluye,
        },
      }));
      document.getElementById('lista-precios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const botonConsultar = evento.target.closest('.boton-consultar-producto');
    if (!botonConsultar) return;
    const producto = productoImagenPorId(botonConsultar.dataset.producto);
    if (!producto) return;
    window.open(urlWhatsApp(mensajeProductoImagen(producto)), '_blank', 'noopener');
  });
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
  const precioBulto = articulo.precio_bulto ?? null;
  const precioBultoFormateado = precioBulto !== null && precioBulto !== undefined
    ? (articulo.precio_bulto_formateado || formatearPrecio(precioBulto))
    : '';
  const base = {
    indice,
    articulo: nombre,
    codigo,
    nombre,
    descripcion,
    precio: articulo.precio ?? '',
    precio_formateado: precioFormateado,
    precio_bulto: precioBulto,
    precio_bulto_formateado: precioBultoFormateado,
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
    articulo.precio_bulto_formateado,
    articulo.precio_bulto,
    articulo.unidad,
    articulo.categoria,
  ].join(' '));
}

function mensajeProducto(articulo) {
  const precioTexto = articulo.precio_formateado || formatearPrecio(articulo.precio) || 'A consultar';
  const precioBultoTexto = articulo.precio_bulto_formateado || '';
  return [
    'Hola Embalajes GB, quiero consultar por este producto:',
    `Articulo/codigo: ${articulo.codigo || articulo.articulo || '-'}`,
    `Descripcion: ${articulo.descripcion || '-'}`,
    `Precio mostrado: ${precioTexto}`,
    ...(precioBultoTexto ? [`Precio por bulto: ${precioBultoTexto}`] : []),
    `Unidad: ${articulo.unidad || '-'}`,
  ].join('\n');
}

function filaArticulo(articulo) {
  const precioTexto = articulo.precio_formateado || formatearPrecio(articulo.precio);
  const precio = partesPrecio(precioTexto);
  const precioBultoTexto = articulo.precio_bulto_formateado || '';
  const precioBulto = partesPrecio(precioBultoTexto);
  const precioBultoHtml = precioBultoTexto
    ? `<span class="precio-web precio-bulto-web"><span>${escaparHtml(precioBulto.simbolo)}</span><strong>${escaparHtml(precioBulto.importe)}</strong></span>`
    : '<span class="sin-precio-bulto">-</span>';
  const nombreArticuloHtml = `<span class="nombre-articulo">${escaparHtml(articulo.articulo || articulo.nombre)}</span>`;
  return `
    <tr>
      <td>
        ${nombreArticuloHtml}
      </td>
      <td>${escaparHtml(articulo.descripcion)}</td>
      <td class="precio-celda">
        <span class="precio-web"><span>${escaparHtml(precio.simbolo)}</span><strong>${escaparHtml(precio.importe)}</strong></span>
      </td>
      <td class="precio-celda precio-bulto-celda">
        ${precioBultoHtml}
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
  const expandirEncabezado = window.innerWidth <= 760 ? 0 : espacioHorizontal;
  const izquierda = mainRect ? mainRect.left + espacioHorizontal : 0;
  const ancho = mainRect ? mainRect.width - (espacioHorizontal * 2) : window.innerWidth;
  const debeFijarse = window.scrollY + altoEncabezado >= posicionNaturalListaPrecios;

  document.documentElement.style.setProperty('--altura-encabezado', `${altoEncabezado}px`);
  document.documentElement.style.setProperty('--lista-precios-izquierda', `${izquierda - expandirEncabezado}px`);
  document.documentElement.style.setProperty('--lista-precios-ancho', `${ancho + (expandirEncabezado * 2)}px`);
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
    let relacionadosExactosActivos = [];
    let relacionadosIncluyeActivos = [];

    function renderizarLista() {
      const busqueda = normalizarBusqueda(buscador?.value || '');
      const categoria = filtroCategoria?.value || 'Todas';
      const tieneRelacionExacta = relacionadosExactosActivos.length > 0;
      const tieneRelacionIncluye = relacionadosIncluyeActivos.length > 0;
      const tieneRelacionDefinida = tieneRelacionExacta || tieneRelacionIncluye;
      const articulosVisibles = articulosListaPrecios.filter((articulo) => {
        const coincideExacto = coincideRelacionExactaArticulo(articulo, relacionadosExactosActivos);
        const coincideIncluye = coincideRelacionIncluyeArticulo(articulo, relacionadosIncluyeActivos);
        const coincideBusqueda = tieneRelacionDefinida ? true : (!busqueda || articulo.textoBusqueda.includes(busqueda));
        const coincideCategoria = tieneRelacionDefinida || categoria === 'Todas' || articulo.categoria === categoria;
        return coincideExacto && coincideIncluye && coincideBusqueda && coincideCategoria;
      });

      const total = articulosListaPrecios.length;
      const visibles = articulosVisibles.length;
      const fecha = datos.actualizado || '-';
      const detalleCategoria = categoria === 'Todas' ? '' : ` - ${categoria}`;
      estado.textContent = (relacionadosExactosActivos.length || relacionadosIncluyeActivos.length || busqueda || categoria !== 'Todas')
        ? `Actualizada: ${fecha} - ${visibles} de ${total} articulos encontrados${detalleCategoria}`
        : `Actualizada: ${fecha} - ${total} articulos publicados`;

      tabla.innerHTML = articulosVisibles.length
        ? articulosVisibles.map(filaArticulo).join('')
        : '<tr><td colspan="5">No se encontraron productos para esa busqueda.</td></tr>';
    }

    document.addEventListener('gb:filtrar-relacionados', (evento) => {
      relacionadosExactosActivos = normalizarRelacionadosExactos(evento.detail?.relacionadosExactos);
      relacionadosIncluyeActivos = normalizarRelacionadosIncluye(evento.detail?.relacionadosIncluye);
      if (buscador) buscador.value = (relacionadosExactosActivos.length || relacionadosIncluyeActivos.length) ? '' : (evento.detail?.busqueda || '');
      if (filtroCategoria) filtroCategoria.value = 'Todas';
      renderizarLista();
      prepararEncabezadoTablaPrecios();
    });
    buscador?.addEventListener('input', () => {
      relacionadosExactosActivos = [];
      relacionadosIncluyeActivos = [];
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
    tabla.innerHTML = '<tr><td colspan="5">Todavia no hay precios publicados en la web.</td></tr>';
  }
}

function camposCotizacionDesdeFormulario(formulario) {
  sincronizarMedidaCotizacion(formulario);
  normalizarCamposCotizacion(formulario);
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

function formatearCantidadMiles(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function capitalizarPrimerLetra(valor) {
  return String(valor || '').replace(/^(\s*)(\S)/, (_, espacios, letra) => espacios + letra.toUpperCase());
}

function normalizarCamposCotizacion(formulario) {
  const cantidad = formulario.elements.cantidad;
  if (cantidad) cantidad.value = formatearCantidadMiles(cantidad.value);

  const nombreCliente = formulario.elements.nombreCliente;
  if (nombreCliente) nombreCliente.value = capitalizarPrimerLetra(nombreCliente.value);
}

function prepararFormatoCamposCotizacion(formulario) {
  const cantidad = formulario.elements.cantidad;
  if (cantidad) {
    cantidad.addEventListener('input', () => {
      const formateado = formatearCantidadMiles(cantidad.value);
      if (cantidad.value !== formateado) cantidad.value = formateado;
    });
  }

  const nombreCliente = formulario.elements.nombreCliente;
  if (nombreCliente) {
    nombreCliente.addEventListener('input', () => {
      const formateado = capitalizarPrimerLetra(nombreCliente.value);
      if (nombreCliente.value !== formateado) nombreCliente.value = formateado;
    });
  }
}

const partesMedidaCotizacion = [
  ['ancho', 'medidaAncho'],
  ['largo', 'medidaLargo'],
  ['espesor', 'medidaEspesor'],
];

function sincronizarMedidaCotizacion(formulario) {
  const medida = formulario.elements.medida;
  if (!medida) return;

  const partes = partesMedidaCotizacion.map(([etiqueta, nombre]) => {
    const campo = formulario.elements[nombre];
    return {
      etiqueta,
      campo,
      valor: String(campo?.value || '').trim(),
      segmento: campo?.closest('.medida-segmento'),
    };
  });
  medida.value = partes
    .filter((parte) => parte.valor)
    .map((parte) => `${parte.etiqueta} ${parte.valor}`)
    .join(', ');

  const hayAlgunDato = partes.some((parte) => parte.valor);
  const indicePendiente = hayAlgunDato ? partes.findIndex((parte) => !parte.valor) : -1;
  partes.forEach((parte, indice) => {
    if (!parte.segmento) return;
    parte.segmento.classList.toggle('completo', Boolean(parte.valor));
    parte.segmento.classList.toggle('esta-pendiente', indice === indicePendiente);
  });
}

function prepararMedidaCotizacion(formulario) {
  partesMedidaCotizacion.forEach(([, nombre]) => {
    formulario.elements[nombre]?.addEventListener('input', () => sincronizarMedidaCotizacion(formulario));
  });
  sincronizarMedidaCotizacion(formulario);
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

function prepararGaleriasServicios() {
  const botones = document.querySelectorAll('[data-galeria-servicio]');
  if (!botones.length) return;
  const galerias = document.querySelectorAll('.galeria-servicio-web');

  botones.forEach((boton) => {
    boton.addEventListener('click', () => {
      const galeria = document.getElementById(boton.getAttribute('aria-controls'));
      if (!galeria) return;
      const estabaAbierta = boton.getAttribute('aria-expanded') === 'true';

      botones.forEach((otroBoton) => otroBoton.setAttribute('aria-expanded', 'false'));
      galerias.forEach((otraGaleria) => { otraGaleria.hidden = true; });

      if (!estabaAbierta) {
        boton.setAttribute('aria-expanded', 'true');
        galeria.hidden = false;
        galeria.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}
function prepararFormularioCotizacion() {
  const formulario = document.getElementById('formularioCotizacionWhatsapp');
  if (!formulario) return;

  prepararFormatoCamposCotizacion(formulario);
  prepararMedidaCotizacion(formulario);
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
prepararGaleriasServicios();
renderizarProductosDestacados();
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












