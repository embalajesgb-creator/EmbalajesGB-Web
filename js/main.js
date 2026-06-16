function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function partesPrecio(precioFormateado) {
  const texto = String(precioFormateado || '').trim();
  const match = texto.match(/^(\$)\s*(.+)$/);
  if (!match) return { simbolo: '', importe: texto };
  return { simbolo: match[1], importe: match[2] };
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
    tabla.innerHTML = articulos.map((articulo) => {
      const precio = partesPrecio(articulo.precio_formateado);
      return `
        <tr>
          <td>${escaparHtml(articulo.nombre)}</td>
          <td>${escaparHtml(articulo.descripcion)}</td>
          <td class="precio-web"><span>${escaparHtml(precio.simbolo)}</span><strong>${escaparHtml(precio.importe)}</strong></td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    estado.textContent = 'Lista pendiente de publicacion.';
    tabla.innerHTML = '<tr><td colspan="3">Todavia no hay precios publicados en la web.</td></tr>';
  }
}

cargarListaPrecios();
