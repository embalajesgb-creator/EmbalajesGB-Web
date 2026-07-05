window.IMAGENES_PRODUCTOS_GB = {
  basePath: 'assets/bolsas/web/',
  hero: [
    'rollo-polietileno-bd-cristal',
    'bolsas-consorcio',
    'bolsas-camiseta-ad-blancas',
  ],
  rubros: {
    indumentaria: 'bolsas-camiseta-ad-blancas',
    ecommerce: 'bolsa-camiseta-bd-color',
    alimentos: 'bolsas-polipropileno',
    textil: 'bolsas-camiseta-ad-blancas',
    ferreteria: 'bolsa-camiseta-bd-negra',
    cosmetica: 'folex',
    mayoristas: 'bolsas-consorcio',
    industria: 'rollo-polietileno-bd-cristal',
  },
  productos: [
    {
      id: 'rollo-polietileno-bd-cristal',
      titulo: 'Rollo de polietileno BD cristal',
      familia: 'Rollos',
      descripcion: 'Polietileno baja densidad cristal para produccion y transformacion.',
      archivo: 'rollo-polietileno-bd-cristal.jpg',
      busqueda: 'rollo polietileno bd cristal baja densidad',
      filtroLista: 'rollo',
      relacionadosExactos: [
        'BD 09 a 11 cm',
        'BD 12 a 15 cm',
        'BD 16 a 20 cm',
        'BD 21 a (++) cm',
      ],
      reglas: [
        ['rollo', 'polietileno', 'bd', 'cristal'],
        ['rollo', 'baja densidad', 'cristal'],
      ],
    },
    {
      id: 'bolsas-consorcio',
      titulo: 'Bolsas de consorcio',
      familia: 'Limpieza e industria',
      descripcion: 'Bolsas resistentes para residuos, consorcio y usos intensivos.',
      archivo: 'bolsas-consorcio.jpg',
      busqueda: 'consorcio residuos limpieza industria',
      filtroLista: 'consorcio',
      reglas: [
        ['consorcio'],
        ['residuos'],
      ],
    },
    {
      id: 'bolsa-camiseta-bd-negra',
      titulo: 'Bolsa camiseta BD negra',
      familia: 'Bolsas camiseta',
      descripcion: 'Baja densidad negra para comercio, regalos y entregas.',
      archivo: 'bolsa-camiseta-bd-negra.jpg',
      busqueda: 'camiseta bd negra baja densidad',
      filtroLista: 'camiseta bd',
      relacionadosIncluye: ['bolsa', 'camiseta', 'bd', 'negra', 'x100u'],
      reglas: [
        ['camiseta', 'bd', 'negra'],
        ['camiseta', 'baja densidad', 'negra'],
      ],
    },
    {
      id: 'bolsa-camiseta-bd-color',
      titulo: 'Bolsa camiseta BD color',
      familia: 'Bolsas camiseta',
      descripcion: 'Baja densidad color para entregas con presencia visual.',
      archivo: 'bolsa-camiseta-bd-color.jpg',
      busqueda: 'camiseta bd color baja densidad',
      filtroLista: 'camiseta bd',
      relacionadosIncluye: ['bolsa', 'camiseta', 'bd', 'color', 'x100u'],
      reglas: [
        ['camiseta', 'bd', 'color'],
        ['camiseta', 'baja densidad', 'color'],
      ],
    },
    {
      id: 'rollos-arranque-paquete',
      titulo: 'Rollos de arranque',
      familia: 'Rollos',
      descripcion: 'Paquetes de rollos para pedidos por volumen o reposicion.',
      archivo: 'rollos-arranque-paquete.jpg',
      busqueda: 'rollos arranque paquete',
      filtroLista: 'arranque',
      reglas: [
        ['rollos', 'arranque'],
        ['rollo', 'arranque'],
        ['rollo', 'paquete'],
      ],
    },
    {
      id: 'bolsas-camiseta-ad-blancas',
      titulo: 'Bolsas camiseta AD blancas',
      familia: 'Bolsas camiseta',
      descripcion: 'Presentacion agrupada para pedidos recurrentes o por bulto.',
      archivo: 'bolsas-camiseta-ad-blancas.jpg',
      busqueda: 'camiseta ad blanca blancas alta densidad bulto',
      filtroLista: 'camiseta ad',
      reglas: [
        ['bolsa', 'camiseta', 'ad', 'blanca'],
        ['bolsas', 'camiseta', 'ad', 'blancas'],
        ['camiseta', 'alta densidad'],
        ['camiseta', 'bulto', 'alta densidad'],
      ],
    },
    {
      id: 'folex',
      titulo: 'Folex',
      familia: 'Materiales especiales',
      descripcion: 'Material para pedidos que requieren una terminacion especifica.',
      archivo: 'folex.jpg',
      busqueda: 'folex material especial',
      filtroLista: 'folex',
      reglas: [
        ['folex'],
      ],
    },
    {
      id: 'bolsas-polipropileno',
      titulo: 'Bolsas de polipropileno',
      familia: 'Polipropileno',
      descripcion: 'Presentacion transparente para alimentos, textiles y productos exhibidos.',
      archivo: 'bolsas-polipropileno.jpg',
      busqueda: 'polipropileno cristal transparente alimento textil',
      filtroLista: 'polipropileno',
      relacionadosIncluye: ['bolsa', 'sobre', 'pp', 'cristal', 'x100'],
      reglas: [
        ['polipropileno'],
        ['opp'],
        ['cristal', 'transparente'],
      ],
    },
  ],
};







