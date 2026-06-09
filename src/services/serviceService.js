/* ========================================
   SERVICE SERVICE - Orién Pro (con YouTube y Carrusel)
   ======================================== */

import { ServiceRepository } from "/src/repository/serviceRepository.js";
import { Service } from "/src/classes/Service.js";

export class ServiceService {
  constructor() {
    this.repository = new ServiceRepository();
  }

  isValidTitulo(titulo) {
    return titulo && titulo.trim().length >= 3;
  }

  isValidDescripcion(descripcion) {
    return descripcion && descripcion.trim().length >= 10;
  }

  isValidYoutubeUrl(url) {
    if (!url) return false;
    const pattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return pattern.test(url.trim());
  }

  extractYoutubeId(url) {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  }

  getEmbedUrl(url) {
    const id = this.extractYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  normalizeServiceData(serviceData) {
    const service = new Service(serviceData);
    service.titulo = service.titulo.trim();
    if (!service.carouselEnabled) {
      service.descripcion = service.descripcion
        ? service.descripcion.trim()
        : "";
    }
    service.youtubeUrl = service.youtubeUrl.trim();
    return service;
  }

  async createService(formData, carouselItems = []) {
    const titulo = formData.get("titulo");
    const youtubeUrl = formData.get("youtubeUrl");
    const orden = formData.get("orden");
    const activo = formData.get("status");
    const alternar = formData.get("alternar");
    const carouselEnabled = formData.get("carouselEnabled") === "true";

    if (!this.isValidTitulo(titulo)) {
      throw new Error("El título debe tener al menos 3 caracteres");
    }
    if (!this.isValidYoutubeUrl(youtubeUrl)) {
      throw new Error("Debe ingresar una URL válida de YouTube");
    }

    let descripcion = "";
    if (!carouselEnabled) {
      descripcion = formData.get("descripcion") || "";
      if (!this.isValidDescripcion(descripcion)) {
        throw new Error("La descripción debe tener al menos 10 caracteres");
      }
    } else {
      if (!carouselItems || carouselItems.length === 0) {
        throw new Error("Debe agregar al menos una imagen al carrusel");
      }
    }

    const service = this.normalizeServiceData({
      titulo,
      descripcion,
      youtubeUrl,
      orden: parseInt(orden) || 0,
      activo: activo === "active",
      alternar: alternar === "true",
      carouselEnabled,
      carouselItems: carouselEnabled ? carouselItems : [],
    });

    return await this.repository.create(service);
  }

  async updateService(id, formData, carouselItems = null) {
    if (!id) throw new Error("ID de servicio no proporcionado");

    const titulo = formData.get("titulo");
    const youtubeUrl = formData.get("youtubeUrl");
    const orden = formData.get("orden");
    const activo = formData.get("status");
    const alternar = formData.get("alternar");
    const carouselEnabled = formData.get("carouselEnabled") === "true";

    if (!this.isValidTitulo(titulo)) {
      throw new Error("El título debe tener al menos 3 caracteres");
    }
    if (!this.isValidYoutubeUrl(youtubeUrl)) {
      throw new Error("Debe ingresar una URL válida de YouTube");
    }

    let descripcion = "";
    if (!carouselEnabled) {
      descripcion = formData.get("descripcion") || "";
      if (!this.isValidDescripcion(descripcion)) {
        throw new Error("La descripción debe tener al menos 10 caracteres");
      }
    } else {
      if (!carouselItems || carouselItems.length === 0) {
        throw new Error("Debe agregar al menos una imagen al carrusel");
      }
    }

    const updateData = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      youtubeUrl: youtubeUrl.trim(),
      orden: parseInt(orden) || 0,
      activo: activo === "active",
      alternar: alternar === "true",
      carouselEnabled,
      carouselItems: carouselEnabled ? carouselItems : [],
    };

    await this.repository.update(id, updateData);
  }

  async deleteService(id) {
    if (!id) throw new Error("ID de servicio no proporcionado");
    await this.repository.delete(id);
  }

  async getAllServices(onlyActive = true) {
    return await this.repository.getAll(onlyActive);
  }

  async getServiceById(id) {
    if (!id) return null;
    return await this.repository.getById(id);
  }
}
