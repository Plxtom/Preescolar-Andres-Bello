import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportarAExcel = (datos, nombreArchivo, nombreHoja = 'Datos') => {
  const worksheet = XLSX.utils.json_to_sheet(datos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  saveAs(data, `${nombreArchivo}.xlsx`);
};

export const exportarInscripciones = (inscripciones) => {
  const datosFormateados = inscripciones.map(insc => ({
    'Estudiante': `${insc.estudiante_nombres} ${insc.estudiante_apellidos}`,
    'Cédula Estudiante': insc.estudiante_cedula || '',
    'Representante': `${insc.representante_nombres} ${insc.representante_apellidos}`,
    'Cédula Representante': insc.representante_cedula,
    'Teléfono': insc.representante_telefono,
    'Período': insc.periodo_nombre,
    'Sección': insc.seccion_nombre,
    'Parentesco': insc.parentesco,
    'Estatus': insc.estatus,
    'Fecha': insc.fecha ? new Date(insc.fecha).toLocaleDateString('es-VE') : ''
  }));
  
  exportarAExcel(datosFormateados, 'inscripciones_preescolar', 'Inscripciones');
};