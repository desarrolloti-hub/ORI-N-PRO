/* ========================================
   CATEGORY REPOSITORY - Orién Pro
   ======================================== */

import { db } from '/config/firebaseConfig.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { Category } from '/src/classes/Category';

const CATEGORIES_COLLECTION = 'categories';

export class CategoryRepository {

    async create(category) {
        try {
            const categoriesRef = collection(db, CATEGORIES_COLLECTION);
            const firestoreData = {
                ...category.toFirestore(),
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            
            const docRef = await addDoc(categoriesRef, firestoreData);
            category.id = docRef.id;
            category.fechaCreacion = firestoreData.fechaCreacion;
            
            return category;
        } catch (error) {
            console.error('Error en CategoryRepository.create:', error);
            throw new Error(error.message);
        }
    }

    async update(id, updateData) {
        try {
            const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
            const dataToUpdate = {
                ...updateData,
                fechaActualizacion: new Date()
            };
            delete dataToUpdate.id;
            delete dataToUpdate.fechaCreacion;
            
            await updateDoc(categoryRef, dataToUpdate);
        } catch (error) {
            console.error('Error en CategoryRepository.update:', error);
            throw new Error(error.message);
        }
    }

    async delete(id) {
        try {
            const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error('Error en CategoryRepository.delete:', error);
            throw new Error(error.message);
        }
    }

    async getById(id) {
        try {
            const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
            const categorySnap = await getDoc(categoryRef);
            
            if (categorySnap.exists()) {
                return Category.fromFirestore(id, categorySnap.data());
            }
            return null;
        } catch (error) {
            console.error('Error en CategoryRepository.getById:', error);
            throw new Error(error.message);
        }
    }

    async getAll(onlyActive = true) {
        try {
            const categoriesRef = collection(db, CATEGORIES_COLLECTION);
            let q = query(categoriesRef, orderBy('nombre', 'asc'));
            
            if (onlyActive) {
                q = query(q, where('activo', '==', true));
            }
            
            const querySnapshot = await getDocs(q);
            const categories = [];
            
            querySnapshot.forEach((doc) => {
                categories.push(Category.fromFirestore(doc.id, doc.data()));
            });
            
            return categories;
        } catch (error) {
            console.error('Error en CategoryRepository.getAll:', error);
            throw new Error(error.message);
        }
    }
}