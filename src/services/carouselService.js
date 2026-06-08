/* ========================================
   CAROUSEL SERVICE - Orién Pro
   Capa de lógica de negocio para carruseles
   ======================================== */

import { CarouselRepository } from "/src/repository/carouselRepository.js";
import { Carousel } from "/src/classes/Carousel.js";

export class CarouselService {
  constructor() {
    this.repository = new CarouselRepository();
  }

  isValidNombre(nombre) {
    return nombre && nombre.trim().length >= 3;
  }

  isValidSlides(slides) {
    return slides && slides.length > 0;
  }

  isValidSlide(slide) {
    return slide.imagen && slide.imagen.trim() !== "";
  }

  normalizeCarouselData(carouselData) {
    const carousel = new Carousel(carouselData);
    carousel.nombre = carousel.nombre.trim();
    if (carousel.descripcion)
      carousel.descripcion = carousel.descripcion.trim();
    // Asegurar orden en slides
    if (carousel.slides) {
      carousel.slides.forEach((slide, idx) => {
        if (!slide.orden) slide.orden = idx + 1;
      });
      carousel.slides.sort((a, b) => a.orden - b.orden);
    }
    return carousel;
  }

  async createCarousel(formData, slides) {
    if (!this.isValidNombre(formData.nombre)) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    if (!this.isValidSlides(slides)) {
      throw new Error("Debe agregar al menos un slide");
    }
    const carousel = this.normalizeCarouselData({
      nombre: formData.nombre,
      descripcion: formData.descripcion || "",
      slides: slides,
      activo: false,
    });
    return await this.repository.create(carousel);
  }

  async updateCarousel(id, formData, slides) {
    if (!id) throw new Error("ID de carrusel no proporcionado");
    if (!this.isValidNombre(formData.nombre)) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }
    if (!this.isValidSlides(slides)) {
      throw new Error("Debe tener al menos un slide");
    }
    const updateData = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion || "",
      slides: slides.map((slide, idx) => ({
        imagen: slide.imagen,
        titulo: slide.titulo || "",
        subtitulo: slide.subtitulo || "",
        ctaTexto: slide.ctaTexto || "",
        ctaUrl: slide.ctaUrl || "",
        orden: slide.orden || idx + 1,
      })),
    };
    await this.repository.update(id, updateData);
  }

  async deleteCarousel(id) {
    if (!id) throw new Error("ID de carrusel no proporcionado");
    await this.repository.delete(id);
  }

  async getAllCarousels() {
    return await this.repository.getAll();
  }

  async getCarouselById(id) {
    if (!id) return null;
    return await this.repository.getById(id);
  }

  async getActiveCarousel() {
    return await this.repository.getActive();
  }

  async setActiveCarousel(id) {
    if (!id) throw new Error("ID de carrusel no proporcionado");
    await this.repository.setActive(id);
  }
}
