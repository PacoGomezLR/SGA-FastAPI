import api from "./axios";

export async function obtenerProductos() {
  const respuesta = await api.get("/productos");
  return respuesta.data;
}