/* ========================================
   CLASS SERVICE - Orién Pro
   Modelo de datos para servicios (YouTube + Carrusel)
   ======================================== */

export class Service {
  constructor(data = {}) {
    this.id = data.id || null;
    this.titulo = data.titulo || "";
    this.descripcion = data.descripcion || ""; // Se usa solo si carouselEnabled = false
    this.youtubeUrl = data.youtubeUrl || "";
    this.orden = data.orden || 0;
    this.activo = data.activo !== undefined ? data.activo : true;
    this.alternar = data.alternar !== undefined ? data.alternar : false; // false = video derecha
    this.carouselEnabled =
      data.carouselEnabled !== undefined ? data.carouselEnabled : false;
    this.carouselItems = data.carouselItems || []; // Array de { imageBase64, caption }
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  toFirestore() {
    return {
      titulo: this.titulo,
      descripcion: this.descripcion,
      youtubeUrl: this.youtubeUrl,
      orden: this.orden,
      activo: this.activo,
      alternar: this.alternar,
      carouselEnabled: this.carouselEnabled,
      carouselItems: this.carouselItems,
      fechaActualizacion: new Date(),
    };
  }

  static fromFirestore(id, data) {
    return new Service({
      id: id,
      titulo: data.titulo || "",
      descripcion: data.descripcion || "",
      youtubeUrl: data.youtubeUrl || "",
      orden: data.orden || 0,
      activo: data.activo !== undefined ? data.activo : true,
      alternar: data.alternar !== undefined ? data.alternar : false,
      carouselEnabled: data.carouselEnabled || false,
      carouselItems: data.carouselItems || [],
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    if (this.carouselEnabled) {
      return (
        this.titulo.trim() !== "" &&
        this.carouselItems.length > 0 &&
        this.youtubeUrl.trim() !== ""
      );
    } else {
      return (
        this.titulo.trim() !== "" &&
        this.descripcion.trim() !== "" &&
        this.youtubeUrl.trim() !== ""
      );
    }
  }
}
