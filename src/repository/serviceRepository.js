/* ========================================
   SERVICE REPOSITORY - Orién Pro
   ======================================== */

import { db, storage } from "/config/firebaseConfig.js";
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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";
import { Service } from "/src/classes/Service.js";

const SERVICES_COLLECTION = "services";
const STORAGE_PATH = "servicios/video";

export class ServiceRepository {

  async create(service, videoFile = null) {
    try {
      let videoURL = service.videoURL;
      
      // Subir video a Storage si existe
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
        await uploadBytes(storageRef, videoFile);
        videoURL = await getDownloadURL(storageRef);
      }

      const servicesRef = collection(db, SERVICES_COLLECTION);
      const firestoreData = {
        ...service.toFirestore(),
        videoURL: videoURL,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };
      
      const docRef = await addDoc(servicesRef, firestoreData);
      service.id = docRef.id;
      service.videoURL = videoURL;
      service.fechaCreacion = firestoreData.fechaCreacion;
      
      return service;
    } catch (error) {
      console.error("Error en ServiceRepository.create:", error);
      throw new Error(error.message);
    }
  }

  async update(id, updateData, newVideoFile = null, oldVideoURL = null) {
    try {
      let videoURL = updateData.videoURL;
      
      // Si hay nuevo video, subirlo y eliminar el anterior
      if (newVideoFile) {
        // Eliminar video antiguo si existe
        if (oldVideoURL) {
          try {
            const oldRef = ref(storage, oldVideoURL);
            await deleteObject(oldRef);
          } catch (e) {
            console.warn("No se pudo eliminar video anterior:", e);
          }
        }
        
        const fileExt = newVideoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
        await uploadBytes(storageRef, newVideoFile);
        videoURL = await getDownloadURL(storageRef);
      }
      
      const serviceRef = doc(db, SERVICES_COLLECTION, id);
      const dataToUpdate = {
        ...updateData,
        videoURL: videoURL,
        fechaActualizacion: new Date()
      };
      delete dataToUpdate.id;
      delete dataToUpdate.fechaCreacion;
      
      await updateDoc(serviceRef, dataToUpdate);
    } catch (error) {
      console.error("Error en ServiceRepository.update:", error);
      throw new Error(error.message);
    }
  }

  async delete(id, videoURL = null) {
    try {
      // Eliminar video de Storage si existe
      if (videoURL) {
        try {
          const videoRef = ref(storage, videoURL);
          await deleteObject(videoRef);
        } catch (e) {
          console.warn("No se pudo eliminar video:", e);
        }
      }
      
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