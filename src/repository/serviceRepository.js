/* ========================================
   SERVICE REPOSITORY - Orién Pro (Sin Storage)
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
import { Service } from "/src/classes/Service.js";

const SERVICES_COLLECTION = "services";

export class ServiceRepository {
  async create(service) {
    try {
      const servicesRef = collection(db, SERVICES_COLLECTION);
      const firestoreData = {
        ...service.toFirestore(),
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };

      const docRef = await addDoc(servicesRef, firestoreData);
      service.id = docRef.id;
      service.fechaCreacion = firestoreData.fechaCreacion;

      return service;
    } catch (error) {
      console.error("Error en ServiceRepository.create:", error);
      throw new Error(error.message);
    }
  }

  async update(id, updateData) {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, id);
      const dataToUpdate = {
        ...updateData,
        fechaActualizacion: new Date(),
      };
      delete dataToUpdate.id;
      delete dataToUpdate.fechaCreacion;

      await updateDoc(serviceRef, dataToUpdate);
    } catch (error) {
      console.error("Error en ServiceRepository.update:", error);
      throw new Error(error.message);
    }
  }

  async delete(id) {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, id);
      await deleteDoc(serviceRef);
    } catch (error) {
      console.error("Error en ServiceRepository.delete:", error);
      throw new Error(error.message);
    }
  }

  async getById(id) {
    try {
      const serviceRef = doc(db, SERVICES_COLLECTION, id);
      const serviceSnap = await getDoc(serviceRef);

      if (serviceSnap.exists()) {
        return Service.fromFirestore(serviceSnap.id, serviceSnap.data());
      }
      return null;
    } catch (error) {
      console.error("Error en ServiceRepository.getById:", error);
      throw new Error(error.message);
    }
  }

  async getAll(onlyActive = true) {
    try {
      const servicesRef = collection(db, SERVICES_COLLECTION);
      let q = query(servicesRef, orderBy("orden", "asc"));

      if (onlyActive) {
        q = query(q, where("activo", "==", true));
      }

      const querySnapshot = await getDocs(q);
      const services = [];

      querySnapshot.forEach((doc) => {
        services.push(Service.fromFirestore(doc.id, doc.data()));
      });

      return services;
    } catch (error) {
      console.error("Error en ServiceRepository.getAll:", error);
      throw new Error(error.message);
    }
  }
}
