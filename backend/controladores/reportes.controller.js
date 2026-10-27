const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const reportesService = require('../servicios/reportes.service');

exports.obtenerReporte = async (peticion, respuesta) => {
  try {
    const { agrupar_por, fecha_inicio, fecha_fin, formato } = peticion.query;
    const reporte = await reportesService.generarReporteUso({ agrupar_por, fecha_inicio, fecha_fin });

    if (formato === 'csv') {
      return exportarCSV(respuesta, reporte);
    }
    if (formato === 'pdf') {
      return exportarPDF(respuesta, reporte, agrupar_por);
    }
    // Por defecto: JSON (para mostrarlo en pantalla)
    respuesta.json(reporte);

  } catch (error) {
    if (error.codigo === 'PARAMETRO_INVALIDO') {
      return respuesta.status(400).json({ error: error.message });
    }
    console.error(error);
    respuesta.status(500).json({ error: 'Error al generar el reporte.' });
  }
};

// RF-20: exportación a CSV
function exportarCSV(respuesta, reporte) {
  const parser = new Parser({
    fields: [
      { label: reporte.etiquetaColumna, value: 'etiqueta' },
      { label: 'Total de reservas', value: 'total_reservas' },
      { label: 'Total de laptops prestadas', value: 'total_laptops_prestadas' }
    ]
  });
  const csv = parser.parse(reporte.filas);

  respuesta.header('Content-Type', 'text/csv');
  respuesta.attachment('reporte.csv');
  respuesta.send(csv);
}

// RF-20: exportación a PDF
function exportarPDF(respuesta, reporte, agrupadoPor) {
  const documento = new PDFDocument({ margin: 40 });

  respuesta.header('Content-Type', 'application/pdf');
  respuesta.attachment('reporte.pdf');
  documento.pipe(respuesta);

  documento.fontSize(16).text('Reporte de uso del Sistema de Préstamos de Laptops', { align: 'center' });
  documento.moveDown();
  documento.fontSize(12).text(`Agrupado por: ${reporte.etiquetaColumna}`);
  documento.moveDown();

  reporte.filas.forEach((fila) => {
    documento.fontSize(10).text(
      `${fila.etiqueta}  —  Reservas: ${fila.total_reservas}  —  Laptops prestadas: ${fila.total_laptops_prestadas}`
    );
  });

  documento.end();
}