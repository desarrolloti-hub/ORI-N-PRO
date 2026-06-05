/* ========================================
   USER SERVICE - Orién Pro
   Capa de lógica de negocio para usuarios
   ======================================== */

import { UserRepository } from '/repository/userRepository.js';
import { User } from '/classes/User.js';

export class UserService {
    
    constructor() {
        this.repository = new UserRepository();
    }

    /**
     * Valida el formato de email
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida la fortaleza de la contraseña
     * @param {string} password
     * @returns {object} { isValid, message }
     */
    validatePassword(password) {
        if (!password || password.length < 6) {
            return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (!hasLetter || !hasNumber) {
            return { isValid: false, message: 'La contraseña debe incluir letras y números' };
        }
        
        return { isValid: true, message: 'Contraseña válida' };
    }

    /**
     * Valida que el email sea único
     * @param {string} email
     * @returns {Promise<boolean>}
     */
    async isEmailUnique(email) {
        const existingUser = await this.repository.getByEmail(email);
        return !existingUser;
    }

    /**
     * Normaliza los datos del usuario
     * @param {Object} userData
     * @returns {User}
     */
    normalizeUserData(userData) {
        const user = new User(userData);
        user.email = user.email.toLowerCase().trim();
        user.capitalizeName();
        return user;
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} formData - Datos del formulario
     * @param {string} password - Contraseña
     * @returns {Promise<User>}
     */
    async createUser(formData, password) {
        // Validaciones
        if (!this.isValidEmail(formData.email)) {
            throw new Error('El correo electrónico no es válido');
        }
        
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }
        
        const isUnique = await this.isEmailUnique(formData.email);
        if (!isUnique) {
            throw new Error('El correo electrónico ya está registrado');
        }
        
        if (!formData.nombre || formData.nombre.trim() === '') {
            throw new Error('El nombre es obligatorio');
        }
        
        // Normalizar datos
        const user = this.normalizeUserData(formData);
        
        // Crear usuario
        return await this.repository.create(user, password);
    }

    /**
     * Actualiza datos de usuario
     * @param {string} uid
     * @param {Object} formData
     * @returns {Promise<void>}
     */
    async updateUser(uid, formData) {
        if (!uid) {
            throw new Error('ID de usuario no proporcionado');
        }
        
        const updateData = {};
        
        if (formData.nombre) {
            const normalizedName = formData.nombre.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            updateData.nombre = normalizedName;
        }
        
        if (formData.cargo) {
            updateData.cargo = formData.cargo;
        }
        
        if (formData.activo !== undefined) {
            updateData.activo = formData.activo;
        }
        
        if (formData.fotoURL) {
            updateData.fotoURL = formData.fotoURL;
        }
        
        if (Object.keys(updateData).length === 0) {
            throw new Error('No hay datos para actualizar');
        }
        
        await this.repository.update(uid, updateData);
    }

    /**
     * Cambia la contraseña del usuario
     * @param {string} uid
     * @param {string} newPassword
     * @returns {Promise<void>}
     */
    async changeUserPassword(uid, newPassword) {
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }
        
        await this.repository.updatePassword(uid, newPassword);
    }

    /**
     * Inactiva un usuario
     * @param {string} uid
     * @returns {Promise<void>}
     */
    async deactivateUser(uid) {
        const user = await this.repository.getById(uid);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        
        if (!user.activo) {
            throw new Error('El usuario ya está inactivo');
        }
        
        await this.repository.delete(uid);
    }

    /**
     * Reactiva un usuario
     * @param {string} uid
     * @returns {Promise<void>}
     */
    async activateUser(uid) {
        const user = await this.repository.getById(uid);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        
        if (user.activo) {
            throw new Error('El usuario ya está activo');
        }
        
        await this.repository.activate(uid);
    }

    /**
     * Obtiene todos los usuarios
     * @param {boolean} onlyActive
     * @returns {Promise<User[]>}
     */
    async getAllUsers(onlyActive = true) {
        return await this.repository.getAll(onlyActive);
    }

    /**
     * Obtiene un usuario por ID
     * @param {string} uid
     * @returns {Promise<User|null>}
     */
    async getUserById(uid) {
        if (!uid) return null;
        return await this.repository.getById(uid);
    }

    /**
     * Cambia el rol del usuario
     * @param {string} uid
     * @param {string} newRole
     * @returns {Promise<void>}
     */
    async changeUserRole(uid, newRole) {
        const validRoles = ['admin', 'editor', 'viewer'];
        if (!validRoles.includes(newRole)) {
            throw new Error('Rol no válido');
        }
        
        await this.repository.changeRole(uid, newRole);
    }
}