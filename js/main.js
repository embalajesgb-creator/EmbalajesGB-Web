function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function cargarListaPrecios() {
  const estado = document.getElementById('estadoListaPrecios');
  const tabla = document.getElementById('tablaListaPreciosWeb');
  if (!estado || !tabla) return;

  try {
    const respuesta = await fetch('data/precios.json', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error('sin-publicacion');
    const datos = await respuesta.json();
    const articulos = Array.isArray(datos.articulos) ? datos.articulos : [];
    if (!articulos.length) throw new Error('sin-articulos');

    estado.textContent = `Actualizada: ${datos.actualizado || '-'} - ${articulos.length} articulos publicados`;
    tabla.innerHTML = articulos.map((articulo) => `
      <tr>
        <td>${escaparHtml(articulo.nombre)}</td>
        <td>${escaparHtml(articulo.descripcion)}</td>
        <td>${escaparHtml(articulo.precio_formateado)}</td>
      </tr>
    `).join('');
  } catch (error) {
    estado.textContent = 'Lista pendiente de publicacion.';
    tabla.innerHTML = '<tr><td colspan="3">Todavia no hay precios publicados en la web.</td></tr>';
  }
}

cargarListaPrecios();
