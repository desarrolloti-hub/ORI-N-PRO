/* ========================================
   PRODUCT SERVICE - Orién Pro
   ======================================== */

import { ProductRepository } from "/src/repository/productRepository";
import { Product } from "/src/classes/Product";

export class ProductService {
  constructor() {
    this.repository = new ProductRepository();
  }

  isValidNombre(nombre) {
    return nombre && nombre.trim().length >= 3;
  }

  isValidCaracteristicas(caracteristicas) {
    return caracteristicas && caracteristicas.trim().length >= 10;
  }

  isValidPrecio(precio) {
    return precio && precio.trim() !== "";
  }

  isValidImagenes(imagenes) {
    return !imagenes || imagenes.length <= 10;
  }

  isValidTipo(tipo) {
    return ["venta", "renta", "ambos"].includes(tipo);
  }

  normalizeProductData(productData) {
    const product = new Product(productData);
    product.nombre = product.nombre.trim();
    product.caracteristicas = product.caracteristicas.trim();
    product.precio = product.precio.trim();
    return product;
  }

  async createProduct(formData, imagenes) {
    if (!this.isValidNombre(formData.nombre)) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    if (!this.isValidCaracteristicas(formData.caracteristicas)) {
      throw new Error("Las características deben tener al menos 10 caracteres");
    }
    if (!this.isValidPrecio(formData.precio)) {
      throw new Error("El precio es obligatorio");
    }
    if (!this.isValidTipo(formData.tipo)) {
      throw new Error("El tipo de producto no es válido");
    }
    if (!this.isValidImagenes(imagenes)) {
      throw new Error("Máximo 10 imágenes por producto");
    }
    if (!formData.categoriaId) {
      throw new Error("Debe seleccionar una categoría");
    }
    const product = this.normalizeProductData({
      nombre: formData.nombre,
      caracteristicas: formData.caracteristicas,
      precio: formData.precio,
      tipo: formData.tipo,
      categoriaId: formData.categoriaId,
      imagenes: imagenes || [],
    });
    return await this.repository.create(product);
  }

  async updateProduct(id, formData, imagenes) {
    if (!id) throw new Error("ID de producto no proporcionado");
    if (!this.isValidNombre(formData.nombre)) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    if (!this.isValidCaracteristicas(formData.caracteristicas)) {
      throw new Error("Las características deben tener al menos 10 caracteres");
    }
    if (!this.isValidPrecio(formData.precio)) {
      throw new Error("El precio es obligatorio");
    }
    if (!this.isValidTipo(formData.tipo)) {
      throw new Error("El tipo de producto no es válido");
    }
    if (!this.isValidImagenes(imagenes)) {
      throw new Error("Máximo 10 imágenes por producto");
    }
    if (!formData.categoriaId) {
      throw new Error("Debe seleccionar una categoría");
    }
    const updateData = {
      nombre: formData.nombre.trim(),
      caracteristicas: formData.caracteristicas.trim(),
      precio: formData.precio,
      tipo: formData.tipo,
      categoriaId: formData.categoriaId,
      imagenes: imagenes || [],
      enOferta: formData.enOferta || false,
      precioOferta: formData.precioOferta || "",
    };
    await this.repository.update(id, updateData);
  }

  async deleteProduct(id) {
    if (!id) throw new Error("ID de producto no proporcionado");
    const product = await this.repository.getById(id);
    if (!product) throw new Error("Producto no encontrado");
    await this.repository.delete(id);
  }

  async getAllProducts() {
    return await this.repository.getAll();
  }

  async getProductById(id) {
    if (!id) return null;
    return await this.repository.getById(id);
  }

  async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return await this.getAllProducts();
    }
    return await this.repository.searchByName(searchTerm);
  }

  async incrementProductVistas(id) {
    if (!id) throw new Error("ID de producto no proporcionado");
    await this.repository.incrementVistas(id);
  }

  async incrementProductCotizaciones(id) {
    if (!id) throw new Error("ID de producto no proporcionado");
    await this.repository.incrementCotizaciones(id);
  }
}
