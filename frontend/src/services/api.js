import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

export default API;