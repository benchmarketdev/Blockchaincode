export const setToken = (token, userData) => {
  localStorage.setItem("bitgo-user", userData);
  localStorage.setItem("bitgo-token", token);
};

export const unsetToken = () => {
  localStorage.removeItem("bitgo-user");
  localStorage.removeItem("bitgo-token");
};

export const getUser = () => JSON.parse(localStorage.getItem("bitgo-user"));
export const getToken = () => localStorage.getItem("bitgo-token");

export const isAuthenticated = () => !!getToken() && !!getUser();
