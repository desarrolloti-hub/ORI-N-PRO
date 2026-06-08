/* ========================================
   CLASS CATEGORY - Orién Pro
   Modelo de datos para categorías
   ======================================== */

export class Category {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || "";
    this.slug = data.slug || "";
    this.descripcion = data.descripcion || "";
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      slug: this.slug || this.nombre.toLowerCase().replace(/ /g, "-"),
      descripcion: this.descripcion,
      activo: this.activo,
      fechaActualizacion: new Date(),
    };
  }

  static fromFirestore(id, data) {
    return new Category({
      id: id,
      nombre: data.nombre || "",
      slug: data.slug || "",
      descripcion: data.descripcion || "",
      activo: data.activo !== undefined ? data.activo : true,
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    return this.nombre.trim() !== "";
  }

  generateSlug() {
    this.slug = this.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    return this;
  }
}
