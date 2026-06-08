/* ========================================
   CLASS PRODUCT - Orién Pro
   ======================================== */

export class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || "";
    this.caracteristicas = data.caracteristicas || "";
    this.precio = data.precio || "";
    this.precioOferta = data.precioOferta || "";
    this.enOferta = data.enOferta || false;
    this.tipo = data.tipo || "venta";
    this.categoriaId = data.categoriaId || "";
    this.imagenes = data.imagenes || [];
    this.vistas = data.vistas || 0;
    this.cotizaciones = data.cotizaciones || 0;
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      caracteristicas: this.caracteristicas,
      precio: this.precio,
      precioOferta: this.precioOferta,
      enOferta: this.enOferta,
      tipo: this.tipo,
      categoriaId: this.categoriaId,
      imagenes: this.imagenes.slice(0, 10),
      vistas: this.vistas,
      cotizaciones: this.cotizaciones,
      fechaActualizacion: new Date(),
    };
  }

  static fromFirestore(id, data) {
    return new Product({
      id: id,
      nombre: data.nombre || "",
      caracteristicas: data.caracteristicas || "",
      precio: data.precio || "",
      precioOferta: data.precioOferta || "",
      enOferta: data.enOferta || false,
      tipo: data.tipo || "venta",
      categoriaId: data.categoriaId || "",
      imagenes: data.imagenes || [],
      vistas: data.vistas || 0,
      cotizaciones: data.cotizaciones || 0,
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    return (
      this.nombre.trim() !== "" &&
      this.caracteristicas.trim() !== "" &&
      this.precio.trim() !== ""
    );
  }

  addImage(base64Image) {
    if (this.imagenes.length >= 10) return false;
    this.imagenes.push(base64Image);
    return true;
  }

  removeImage(index) {
    if (index >= 0 && index < this.imagenes.length) {
      this.imagenes.splice(index, 1);
    }
  }

  getMainImage() {
    return this.imagenes.length > 0 ? this.imagenes[0] : null;
  }

  getPrecioFormateado() {
    let precioMostrar = this.precio;
    if (this.enOferta && this.precioOferta) {
      precioMostrar = this.precioOferta;
    }
    if (precioMostrar.includes("$") && precioMostrar.includes("MXN")) {
      return precioMostrar;
    }
    const numeros = precioMostrar.replace(/[^0-9]/g, "");
    if (numeros === "") return precioMostrar;
    const numero = parseInt(numeros, 10);
    if (isNaN(numero)) return precioMostrar;
    return `$${numero.toLocaleString("es-MX")} MXN`;
  }

  getPrecioOriginalFormateado() {
    if (!this.enOferta || !this.precioOferta) return "";
    const numeros = this.precio.replace(/[^0-9]/g, "");
    if (numeros === "") return this.precio;
    const numero = parseInt(numeros, 10);
    if (isNaN(numero)) return this.precio;
    return `$${numero.toLocaleString("es-MX")} MXN`;
  }

  static limpiarPrecio(precio) {
    const numeros = precio.replace(/[^0-9]/g, "");
    if (numeros === "") return "";
    const numero = parseInt(numeros, 10);
    return isNaN(numero) ? "" : numero.toString();
  }

  getTipoTexto() {
    const tipos = {
      venta: "Venta",
      renta: "Renta",
      ambos: "Venta y Renta",
    };
    return tipos[this.tipo] || "Venta";
  }
}
