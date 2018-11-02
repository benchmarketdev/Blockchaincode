import axios from "axios";

const BASE_API_URL = "http://localhost:8000/api/v1";

export const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 10000
});

axiosInstance.defaults.headers.post["Content-Type"] = "application/json";

// a utility function for calling the node api using axios
const Api = (options = {}) => {
  return axiosInstance(options)
    .then(res => (res.status !== 200 ? Promise.reject(res) : res))
    .then(response => ({ response }), error => ({ error }));
};

export default Api;
