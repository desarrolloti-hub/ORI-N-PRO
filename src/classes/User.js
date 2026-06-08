/* ========================================
   CLASS USER - Orién Pro
   Modelo de datos para usuarios
   ======================================== */

export class User {
    constructor(data = {}) {
        this.uid = data.uid || null;
        this.nombre = data.nombre || '';
        this.email = data.email || '';
        this.fotoURL = data.fotoURL || '';
        this.cargo = data.cargo || 'viewer';
        this.activo = data.activo !== undefined ? data.activo : true;
        this.fechaCreacion = data.fechaCreacion || null;
        this.fechaActualizacion = data.fechaActualizacion || null;
    }

    /**
     * Convierte la instancia a un objeto plano para Firestore
     */
    toFirestore() {
        return {
            nombre: this.nombre,
            email: this.email.toLowerCase(),
            fotoURL: this.fotoURL,
            cargo: this.cargo,
            activo: this.activo,
            fechaActualizacion: new Date()
        };
    }

    /**
     * Crea una instancia de User desde datos de Firestore
     * @param {string} uid - ID del usuario
     * @param {Object} data - Datos de Firestore
     * @returns {User}
     */
    static fromFirestore(uid, data) {
        return new User({
            uid: uid,
            nombre: data.nombre || '',
            email: data.email || '',
            fotoURL: data.fotoURL || '',
            cargo: data.cargo || 'viewer',
            activo: data.activo !== undefined ? data.activo : true,
            fechaCreacion: data.fechaCreacion || null,
            fechaActualizacion: data.fechaActualizacion || null
        });
    }

    /**
     * Valida que el usuario tenga datos mínimos requeridos
     */
    isValid() {
        return this.nombre.trim() !== '' && 
               this.email.trim() !== '' && 
               this.email.includes('@');
    }

    /**
     * Capitaliza el nombre del usuario
     */
    capitalizeName() {
        this.nombre = this.nombre.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        return this;
    }

    /**
     * Obtiene el rol en español para mostrar en UI
     */
    getRolTexto() {
        const roles = {
            'admin': 'Administrador',
            'editor': 'Editor',
            'viewer': 'Visualizador'
        };
        return roles[this.cargo] || 'Visualizador';
    }
}