/* ========================================
   CLASS USER - Orién Pro
   Modelo de datos para usuarios
   ======================================== */

export class User {
  constructor(data = {}) {
    this.uid = data.uid || null;
    this.nombre = data.nombre || "";
    this.email = data.email || "";
    this.fotoURL = data.fotoURL || "";
    this.cargo = data.cargo || "colaborador"; // 'admin' o 'colaborador'
    this.activo = data.activo !== undefined ? data.activo : true;
    this.fechaCreacion = data.fechaCreacion || null;
    this.fechaActualizacion = data.fechaActualizacion || null;
  }

  toFirestore() {
    return {
      nombre: this.nombre,
      email: this.email.toLowerCase(),
      fotoURL: this.fotoURL,
      cargo: this.cargo,
      activo: this.activo,
      fechaActualizacion: new Date(),
    };
  }

  static fromFirestore(uid, data) {
    return new User({
      uid: uid,
      nombre: data.nombre || "",
      email: data.email || "",
      fotoURL: data.fotoURL || "",
      cargo: data.cargo || "colaborador",
      activo: data.activo !== undefined ? data.activo : true,
      fechaCreacion: data.fechaCreacion || null,
      fechaActualizacion: data.fechaActualizacion || null,
    });
  }

  isValid() {
    return (
      this.nombre.trim() !== "" &&
      this.email.trim() !== "" &&
      this.email.includes("@")
    );
  }

  capitalizeName() {
    this.nombre = this.nombre
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return this;
  }

  getRolTexto() {
    return this.cargo === "admin" ? "Administrador" : "Colaborador";
  }
}
