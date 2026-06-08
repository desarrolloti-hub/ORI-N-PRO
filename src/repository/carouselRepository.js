/* ========================================
   CAROUSEL REPOSITORY - Orién Pro
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
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { Carousel } from "/src/classes/Carousel.js";

const CAROUSELS_COLLECTION = "carousels";

export class CarouselRepository {
  async create(carousel) {
    try {
      const ref = collection(db, CAROUSELS_COLLECTION);
      const firestoreData = {
        ...carousel.toFirestore(),
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };
      const docRef = await addDoc(ref, firestoreData);
      carousel.id = docRef.id;
      carousel.fechaCreacion = firestoreData.fechaCreacion;
      return carousel;
    } catch (error) {
      console.error("Error en CarouselRepository.create:", error);
      throw new Error(error.message);
    }
  }

  async update(id, updateData) {
    try {
      const ref = doc(db, CAROUSELS_COLLECTION, id);
      const dataToUpdate = {
        ...updateData,
        fechaActualizacion: new Date(),
      };
      delete dataToUpdate.id;
      delete dataToUpdate.fechaCreacion;
      await updateDoc(ref, dataToUpdate);
    } catch (error) {
      console.error("Error en CarouselRepository.update:", error);
      throw new Error(error.message);
    }
  }

  async delete(id) {
    try {
      const ref = doc(db, CAROUSELS_COLLECTION, id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("Error en CarouselRepository.delete:", error);
      throw new Error(error.message);
    }
  }

  async getById(id) {
    try {
      const ref = doc(db, CAROUSELS_COLLECTION, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return Carousel.fromFirestore(snap.id, snap.data());
      }
      return null;
    } catch (error) {
      console.error("Error en CarouselRepository.getById:", error);
      throw new Error(error.message);
    }
  }

  async getAll() {
    try {
      const ref = collection(db, CAROUSELS_COLLECTION);
      const q = query(ref, orderBy("fechaCreacion", "desc"));
      const snapshot = await getDocs(q);
      const carousels = [];
      snapshot.forEach((doc) => {
        carousels.push(Carousel.fromFirestore(doc.id, doc.data()));
      });
      return carousels;
    } catch (error) {
      console.error("Error en CarouselRepository.getAll:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtiene el carrusel que está activo (activo === true)
   */
  async getActive() {
    try {
      const ref = collection(db, CAROUSELS_COLLECTION);
      const q = query(
        ref,
        where("activo", "==", true),
        orderBy("fechaActualizacion", "desc"),
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return Carousel.fromFirestore(doc.id, doc.data());
      }
      return null;
    } catch (error) {
      console.error("Error en CarouselRepository.getActive:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Activa un carrusel (pone activo=true) y desactiva los demás
   */
  async setActive(id) {
    try {
      // Desactivar todos
      const all = await this.getAll();
      for (const carousel of all) {
        if (carousel.activo) {
          await this.update(carousel.id, { activo: false });
        }
      }
      // Activar el seleccionado
      await this.update(id, { activo: true });
    } catch (error) {
      console.error("Error en CarouselRepository.setActive:", error);
      throw new Error(error.message);
    }
  }
}
