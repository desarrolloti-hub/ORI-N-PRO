/* ========================================
   CLASS CAROUSEL - Orién Pro
   Modelo de datos para carruseles (sliders)
   ======================================== */

export class Carousel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || ""; // Nombre del preset
    this.descripcion = data.descripcion || ""; // Descripción opcional
    this.slides = data.slides || []; // Array de objetos slide
    this.activo = data.activo !== undefined ? data.activo : false;
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  /**
   * Convierte la instancia a un objeto para Firestore
   */
  toFirestore() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      slides: this.slides.map((slide) => ({
        imagen: slide.imagen || "",
        titulo: slide.titulo || "",
        subtitulo: slide.subtitulo || "",
        ctaTexto: slide.ctaTexto || "",
        ctaUrl: slide.ctaUrl || "",
        orden: slide.orden || 0,
      })),
      activo: this.activo,
      fechaActualizacion: new Date(),
    };
  }

  /**
   * Crea una instancia desde datos de Firestore
   */
  static fromFirestore(id, data) {
    const slides = (data.slides || []).map((slide) => ({
      imagen: slide.imagen || "",
      titulo: slide.titulo || "",
      subtitulo: slide.subtitulo || "",
      ctaTexto: slide.ctaTexto || "",
      ctaUrl: slide.ctaUrl || "",
      orden: slide.orden || 0,
    }));
    // Ordenar slides por orden
    slides.sort((a, b) => a.orden - b.orden);

    return new Carousel({
      id: id,
      nombre: data.nombre || "",
      descripcion: data.descripcion || "",
      slides: slides,
      activo: data.activo || false,
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    return this.nombre.trim() !== "" && this.slides.length > 0;
  }

  /**
   * Agrega un slide al carrusel
   */
  addSlide(slide) {
    this.slides.push({
      imagen: slide.imagen || "",
      titulo: slide.titulo || "",
      subtitulo: slide.subtitulo || "",
      ctaTexto: slide.ctaTexto || "",
      ctaUrl: slide.ctaUrl || "",
      orden: slide.orden || this.slides.length + 1,
    });
  }

  /**
   * Elimina un slide por índice
   */
  removeSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.slides.splice(index, 1);
      // Reordenar
      this.slides.forEach((slide, idx) => (slide.orden = idx + 1));
    }
  }
}
