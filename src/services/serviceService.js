/* ========================================
   SERVICE SERVICE - Orién Pro
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

  normalizeServiceData(serviceData) {
    const service = new Service(serviceData);
    service.titulo = service.titulo.trim();
    service.descripcion = service.descripcion.trim();
    return service;
  }

  async createService(formData, videoFile) {
    if (!this.isValidTitulo(formData.titulo)) {
      throw new Error("El título debe tener al menos 3 caracteres");
    }
    if (!this.isValidDescripcion(formData.descripcion)) {
      throw new Error("La descripción debe tener al menos 10 caracteres");
    }
    if (!videoFile) {
      throw new Error("Debe seleccionar un video");
    }
    
    const service = this.normalizeServiceData({
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      orden: parseInt(formData.orden) || 0,
      activo: formData.activo === "active",
      alternar: formData.alternar === "true"
    });
    
    return await this.repository.create(service, videoFile);
  }

  async updateService(id, formData, videoFile = null, oldVideoURL = null) {
    if (!id) throw new Error("ID de servicio no proporcionado");
    if (!this.isValidTitulo(formData.titulo)) {
      throw new Error("El título debe tener al menos 3 caracteres");
    }
    if (!this.isValidDescripcion(formData.descripcion)) {
      throw new Error("La descripción debe tener al menos 10 caracteres");
    }
    
    const updateData = {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      orden: parseInt(formData.orden) || 0,
      activo: formData.activo === "active",
      alternar: formData.alternar === "true"
    };
    
    await this.repository.update(id, updateData, videoFile, oldVideoURL);
  }

  async deleteService(id, videoURL) {
    if (!id) throw new Error("ID de servicio no proporcionado");
    await this.repository.delete(id, videoURL);
  }

  async getAllServices(onlyActive = true) {
    return await this.repository.getAll(onlyActive);
  }

  async getServiceById(id) {
    if (!id) return null;
    return await this.repository.getById(id);
  }
}