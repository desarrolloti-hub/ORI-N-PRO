/* ========================================
   USER REPOSITORY - Orién Pro
   Capa de acceso a datos (Firestore + Auth)
   ======================================== */

import { db, auth } from '/config/firebaseConfig';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    query, 
    where,
    orderBy 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { 
    createUserWithEmailAndPassword,
    updatePassword,
    sendPasswordResetEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { User } from '/src/classes/User';

const USERS_COLLECTION = 'users';

export class UserRepository {

    /**
     * Crea un nuevo usuario en Auth y Firestore
     * @param {User} user - Instancia de User
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<User>}
     */
    async create(user, password) {
        try {
            // 1. Crear en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                user.email.toLowerCase(), 
                password
            );
            
            const uid = userCredential.user.uid;
            
            // 2. Preparar datos para Firestore
            const firestoreData = {
                ...user.toFirestore(),
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            
            // 3. Guardar en Firestore
            const userRef = doc(db, USERS_COLLECTION, uid);
            await setDoc(userRef, firestoreData);
            
            // 4. Retornar usuario completo
            user.uid = uid;
            user.fechaCreacion = firestoreData.fechaCreacion;
            user.fechaActualizacion = firestoreData.fechaActualizacion;
            
            return user;
            
        } catch (error) {
            console.error('Error en UserRepository.create:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Actualiza datos de usuario en Firestore (no contraseña)
     * @param {string} uid - ID del usuario
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<void>}
     */
    async update(uid, updateData) {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            
            const dataToUpdate = {
                ...updateData,
                fechaActualizacion: new Date()
            };
            
            // No permitir actualizar email desde aquí (se maneja aparte)
            delete dataToUpdate.email;
            delete dataToUpdate.fechaCreacion;
            delete dataToUpdate.uid;
            
            await updateDoc(userRef, dataToUpdate);
            
        } catch (error) {
            console.error('Error en UserRepository.update:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Actualiza la contraseña del usuario en Firebase Auth
     * @param {string} uid - ID del usuario
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<void>}
     */
    async updatePassword(uid, newPassword) {
        try {
            // Necesitamos al usuario actual para cambiar contraseña
            // Esto requiere que el usuario esté logueado
            const currentUser = auth.currentUser;
            
            if (!currentUser || currentUser.uid !== uid) {
                // Si no es el mismo usuario, usar reset de contraseña
                const userDoc = await this.getById(uid);
                if (userDoc && userDoc.email) {
                    await sendPasswordResetEmail(auth, userDoc.email);
                    return;
                }
            }
            
            await updatePassword(currentUser, newPassword);
            
        } catch (error) {
            console.error('Error en UserRepository.updatePassword:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Inactiva un usuario (soft delete) - no elimina físicamente
     * @param {string} uid - ID del usuario
     * @returns {Promise<void>}
     */
    async delete(uid) {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            await updateDoc(userRef, {
                activo: false,
                fechaActualizacion: new Date()
            });
        } catch (error) {
            console.error('Error en UserRepository.delete:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Reactiva un usuario inactivo
     * @param {string} uid - ID del usuario
     * @returns {Promise<void>}
     */
    async activate(uid) {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            await updateDoc(userRef, {
                activo: true,
                fechaActualizacion: new Date()
            });
        } catch (error) {
            console.error('Error en UserRepository.activate:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Obtiene un usuario por su UID
     * @param {string} uid - ID del usuario
     * @returns {Promise<User|null>}
     */
    async getById(uid) {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                return User.fromFirestore(uid, userSnap.data());
            }
            return null;
            
        } catch (error) {
            console.error('Error en UserRepository.getById:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Obtiene un usuario por su email
     * @param {string} email - Correo electrónico
     * @returns {Promise<User|null>}
     */
    async getByEmail(email) {
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            const q = query(usersRef, where('email', '==', email.toLowerCase()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return User.fromFirestore(doc.id, doc.data());
            }
            return null;
            
        } catch (error) {
            console.error('Error en UserRepository.getByEmail:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Obtiene todos los usuarios
     * @param {boolean} onlyActive - Si solo se obtienen activos
     * @returns {Promise<User[]>}
     */
    async getAll(onlyActive = true) {
        try {
            const usersRef = collection(db, USERS_COLLECTION);
            let q = query(usersRef, orderBy('fechaCreacion', 'desc'));
            
            if (onlyActive) {
                q = query(q, where('activo', '==', true));
            }
            
            const querySnapshot = await getDocs(q);
            const users = [];
            
            querySnapshot.forEach((doc) => {
                users.push(User.fromFirestore(doc.id, doc.data()));
            });
            
            return users;
            
        } catch (error) {
            console.error('Error en UserRepository.getAll:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Cambia el rol/cargo de un usuario
     * @param {string} uid - ID del usuario
     * @param {string} newRole - Nuevo rol (admin, editor, viewer)
     * @returns {Promise<void>}
     */
    async changeRole(uid, newRole) {
        try {
            const validRoles = ['admin', 'editor', 'viewer'];
            if (!validRoles.includes(newRole)) {
                throw new Error('Rol no válido');
            }
            
            const userRef = doc(db, USERS_COLLECTION, uid);
            await updateDoc(userRef, {
                cargo: newRole,
                fechaActualizacion: new Date()
            });
            
        } catch (error) {
            console.error('Error en UserRepository.changeRole:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Elimina físicamente un usuario de Auth y Firestore
     * @param {string} uid - ID del usuario
     * @returns {Promise<void>}
     */
    async deletePermanently(uid) {
        try {
            // Verificar que el usuario esté inactivo primero
            const user = await this.getById(uid);
            if (user && user.activo) {
                throw new Error('No se puede eliminar un usuario activo. Inactívelo primero.');
            }
            
            // Eliminar de Firestore
            const userRef = doc(db, USERS_COLLECTION, uid);
            await deleteDoc(userRef);
            
            // Nota: La eliminación de Auth requiere admin SDK
            // Por seguridad, esto debe hacerse desde backend o Cloud Function
            
        } catch (error) {
            console.error('Error en UserRepository.deletePermanently:', error);
            throw this._handleError(error);
        }
    }

    /**
     * Maneja errores de Firebase
     * @private
     */
    _handleError(error) {
        const errorMap = {
            'auth/email-already-in-use': 'El correo electrónico ya está registrado',
            'auth/invalid-email': 'El correo electrónico no es válido',
            'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta'
        };
        
        const message = errorMap[error.code] || error.message || 'Error en la operación';
        return new Error(message);
    }
}