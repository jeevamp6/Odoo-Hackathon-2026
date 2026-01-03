import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const createTrip = (data) => API.post("/trips", data);
export const getItinerary = (tripId) =>
  API.get(`/itinerary/${tripId}`);
