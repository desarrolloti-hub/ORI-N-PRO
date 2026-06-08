/* ========================================
   CLASS SERVICE - Orién Pro
   Modelo de datos para servicios
   ======================================== */

export class Service {
  constructor(data = {}) {
    this.id = data.id || null;
    this.titulo = data.titulo || "";
    this.descripcion = data.descripcion || "";
    this.videoURL = data.videoURL || "";
    this.orden = data.orden || 0;
    this.activo = data.activo !== undefined ? data.activo : true;
    this.alternar = data.alternar !== undefined ? data.alternar : false; // false = imagen a la izquierda, true = video a la izquierda
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  toFirestore() {
    return {
      titulo: this.titulo,
      descripcion: this.descripcion,
      videoURL: this.videoURL,
      orden: this.orden,
      activo: this.activo,
      alternar: this.alternar,
      fechaActualizacion: new Date(),
    };
  }

  static fromFirestore(id, data) {
    return new Service({
      id: id,
      titulo: data.titulo || "",
      descripcion: data.descripcion || "",
      videoURL: data.videoURL || "",
      orden: data.orden || 0,
      activo: data.activo !== undefined ? data.activo : true,
      alternar: data.alternar !== undefined ? data.alternar : false,
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    return this.titulo.trim() !== "" && this.descripcion.trim() !== "";
  }
}
