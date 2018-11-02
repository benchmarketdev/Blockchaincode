export const REQUEST = "REQUEST";
export const SUCCESS = "SUCCESS";
export const FAILURE = "FAILURE";
export const RESET = "RESET";

// utility function for generating action types
export const createRequestTypes = base =>
  [REQUEST, SUCCESS, FAILURE, RESET].reduce((acc, type) => {
    acc[type] = `${base}_${type}`;
    return acc;
  }, {});

// utility function for generating action functions
export const createAction = (type, payload = {}) => ({ type, ...payload });
