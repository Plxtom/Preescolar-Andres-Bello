import React, { useState } from 'react';
import '../estilos/FormularioInscripcion.css';

const FormularioInscripcion = () => {
  // Estado que mapea los campos de los modelos SQLModel
  const [formData, setFormData] = useState({
    // RepresentanteModel
    rep_nombres: '',
    rep_apellidos: '',
    rep_cedula: '',
    rep_telefono: '',
    rep_email: '',
    rep_direccion: '',
    rep_lugar_trabajo: '',
    rep_telefono_trabajo: '',
    
    // EstudianteModel
    est_nombres: '',
    est_apellidos: '',
    est_cedula_escolar: '',
    est_fecha_nacimiento: '',
    est_genero: 'M',
    est_lugar_nacimiento: '',
    est_alergias_condiciones_medicas: '',
    est_observaciones: '',

    // EstudianteRepresentanteModel (Tabla puente)
    rel_parentesco: 'Madre',
    rel_es_representante_legal: true,
    rel_autorizado_retirar: true,

    // MatriculaModel (Asignación básica)
    mat_seccion_id: '1'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos de inscripción (para backend con SQLModel):", formData);
    alert("¡Inscripción registrada correctamente!");
  };

  return (
    <div className="inscripcion-container">
      <div className="inscripcion-card">
        <h2>📝 Ficha de Inscripción y Matrícula Preescolar</h2>
        <p>Complete los datos del representante, del estudiante y la relación familiar.</p>

        <form onSubmit={handleSubmit} className="inscripcion-form">
          
          {/* SECCIÓN 1: DATOS DEL REPRESENTANTE */}
          <fieldset className="form-section">
            <legend>1. Datos del Representante</legend>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Nombres</label>
                <input type="text" name="rep_nombres" value={formData.rep_nombres} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group">
                <label>Apellidos</label>
                <input type="text" name="rep_apellidos" value={formData.rep_apellidos} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group">
                <label>Cédula</label>
                <input type="text" name="rep_cedula" value={formData.rep_cedula} onChange={handleChange} required maxLength="20" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="rep_telefono" value={formData.rep_telefono} onChange={handleChange} required maxLength="20" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="rep_email" value={formData.rep_email} onChange={handleChange} maxLength="100" />
              </div>
              <div className="form-group">
                <label>Lugar de Trabajo</label>
                <input type="text" name="rep_lugar_trabajo" value={formData.rep_lugar_trabajo} onChange={handleChange} maxLength="150" />
              </div>
              <div className="form-group">
                <label>Teléfono de Trabajo</label>
                <input type="text" name="rep_telefono_trabajo" value={formData.rep_telefono_trabajo} onChange={handleChange} maxLength="20" />
              </div>
              <div className="form-group full-width">
                <label>Dirección de Habitación</label>
                <textarea name="rep_direccion" value={formData.rep_direccion} onChange={handleChange} required rows="2" />
              </div>
            </div>
          </fieldset>

          {/* SECCIÓN 2: DATOS DEL ESTUDIANTE */}
          <fieldset className="form-section">
            <legend>2. Datos del Estudiante</legend>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Nombres</label>
                <input type="text" name="est_nombres" value={formData.est_nombres} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group">
                <label>Apellidos</label>
                <input type="text" name="est_apellidos" value={formData.est_apellidos} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group">
                <label>Cédula Escolar (Opcional)</label>
                <input type="text" name="est_cedula_escolar" value={formData.est_cedula_escolar} onChange={handleChange} maxLength="30" />
              </div>
              <div className="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" name="est_fecha_nacimiento" value={formData.est_fecha_nacimiento} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Género</label>
                <select name="est_genero" value={formData.est_genero} onChange={handleChange}>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lugar de Nacimiento</label>
                <input type="text" name="est_lugar_nacimiento" value={formData.est_lugar_nacimiento} onChange={handleChange} maxLength="100" />
              </div>
              <div className="form-group full-width">
                <label>Alergias o Condiciones Médicas</label>
                <textarea name="est_alergias_condiciones_medicas" value={formData.est_alergias_condiciones_medicas} onChange={handleChange} rows="2" />
              </div>
              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea name="est_observaciones" value={formData.est_observaciones} onChange={handleChange} rows="2" />
              </div>
            </div>
          </fieldset>

          {/* SECCIÓN 3: RELACIÓN Y MATRÍCULA */}
          <fieldset className="form-section">
            <legend>3. Relación Familiar y Matrícula</legend>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Parentesco</label>
                <input type="text" name="rel_parentesco" value={formData.rel_parentesco} onChange={handleChange} required placeholder="Ej. Madre, Padre, Tío/a" />
              </div>
              
              <div className="form-group">
                <label>Sección / Grupo</label>
                <select name="mat_seccion_id" value={formData.mat_seccion_id} onChange={handleChange}>
                  <option value="1">Grupo 1 (3 Años - Secc A)</option>
                  <option value="2">Grupo 2 (4 Años - Secc A)</option>
                  <option value="3">Grupo 3 (5 Años - Secc A)</option>
                </select>
              </div>

              <div className="form-group checkbox-group full-width">
                <label>
                  <input type="checkbox" name="rel_es_representante_legal" checked={formData.rel_es_representante_legal} onChange={handleChange} />
                  ¿Es el Representante Legal?
                </label>
              </div>

              <div className="form-group checkbox-group full-width">
                <label>
                  <input type="checkbox" name="rel_autorizado_retirar" checked={formData.rel_autorizado_retirar} onChange={handleChange} />
                  Autorizado para retirar al estudiante
                </label>
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-submit">Registrar Matrícula</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormularioInscripcion;