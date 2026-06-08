/* ========================================
   CATEGORY SERVICE - Orién Pro
   ======================================== */

import { CategoryRepository } from '/src/repository/categoryRepository';
import { Category } from '/src/classes/Category';

export class CategoryService {
    
    constructor() {
        this.repository = new CategoryRepository();
    }

    isValidNombre(nombre) {
        return nombre && nombre.trim().length >= 2;
    }

    normalizeCategoryData(categoryData) {
        const category = new Category(categoryData);
        category.nombre = category.nombre.trim();
        category.generateSlug();
        return category;
    }

    async createCategory(formData) {
        if (!this.isValidNombre(formData.nombre)) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        const category = this.normalizeCategoryData(formData);
        return await this.repository.create(category);
    }

    async updateCategory(id, formData) {
        if (!id) throw new Error('ID de categoría no proporcionado');
        if (!this.isValidNombre(formData.nombre)) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        const category = this.normalizeCategoryData(formData);
        const updateData = {
            nombre: category.nombre,
            slug: category.slug,
            descripcion: formData.descripcion || '',
            activo: formData.activo !== undefined ? formData.activo : true
        };
        
        await this.repository.update(id, updateData);
    }

    async deleteCategory(id) {
        if (!id) throw new Error('ID de categoría no proporcionado');
        await this.repository.delete(id);
    }

    async getAllCategories(onlyActive = true) {
        return await this.repository.getAll(onlyActive);
    }

    async getCategoryById(id) {
        if (!id) return null;
        return await this.repository.getById(id);
    }
}