/* ========================================
   PRODUCT REPOSITORY - Orién Pro
   Capa de acceso a datos (Firestore)
   ======================================== */

import { db } from "/config/firebaseConfig.js";
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
  where,
  increment,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { Product } from "/src/classes/Product";

const PRODUCTS_COLLECTION = "products";

export class ProductRepository {
  async create(product) {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const firestoreData = {
        ...product.toFirestore(),
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };
      const docRef = await addDoc(productsRef, firestoreData);
      product.id = docRef.id;
      product.fechaCreacion = firestoreData.fechaCreacion;
      product.fechaActualizacion = firestoreData.fechaActualizacion;
      return product;
    } catch (error) {
      console.error("Error en ProductRepository.create:", error);
      throw this._handleError(error);
    }
  }

  async update(id, updateData) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      const dataToUpdate = {
        ...updateData,
        fechaActualizacion: new Date(),
      };
      delete dataToUpdate.id;
      delete dataToUpdate.fechaCreacion;
      await updateDoc(productRef, dataToUpdate);
    } catch (error) {
      console.error("Error en ProductRepository.update:", error);
      throw this._handleError(error);
    }
  }

  async delete(id) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error("Error en ProductRepository.delete:", error);
      throw this._handleError(error);
    }
  }

  async getById(id) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        return Product.fromFirestore(id, productSnap.data());
      }
      return null;
    } catch (error) {
      console.error("Error en ProductRepository.getById:", error);
      throw this._handleError(error);
    }
  }

  async getAll() {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const q = query(productsRef, orderBy("fechaCreacion", "desc"));
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push(Product.fromFirestore(doc.id, doc.data()));
      });
      return products;
    } catch (error) {
      console.error("Error en ProductRepository.getAll:", error);
      throw this._handleError(error);
    }
  }

  async searchByName(searchTerm) {
    try {
      const allProducts = await this.getAll();
      return allProducts.filter((product) =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    } catch (error) {
      console.error("Error en ProductRepository.searchByName:", error);
      throw this._handleError(error);
    }
  }

  async incrementVistas(id) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(productRef, {
        vistas: increment(1),
        fechaActualizacion: new Date(),
      });
    } catch (error) {
      console.error("Error incrementando vistas:", error);
      throw this._handleError(error);
    }
  }

  async incrementCotizaciones(id) {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(productRef, {
        cotizaciones: increment(1),
        fechaActualizacion: new Date(),
      });
    } catch (error) {
      console.error("Error incrementando cotizaciones:", error);
      throw this._handleError(error);
    }
  }

  _handleError(error) {
    const message = error.message || "Error en la operación";
    return new Error(message);
  }
}
