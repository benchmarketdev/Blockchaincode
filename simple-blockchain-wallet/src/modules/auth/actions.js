import { push } from "connected-react-router";

import Api from "../../services/api";
import { setToken, unsetToken } from "../../utils";

import {
  createRequestTypes,
  createAction,
  REQUEST,
  SUCCESS,
  FAILURE
} from "../utils";

export const POST_AUTH = createRequestTypes("POST_AUTH");
export const POST_UNAUTH = createRequestTypes("POST_UNAUTH");

export const auth = {
  // auth request
  postAuthRequest: (username, password) =>
    createAction(POST_AUTH[REQUEST], { username, password }),
  postAuthSuccess: response => createAction(POST_AUTH[SUCCESS], { response }),
  postAuthFailure: error => createAction(POST_AUTH[FAILURE], { error }),

  // unauth / logout request
  postUnauthRequest: () => createAction(POST_UNAUTH[REQUEST]),
  postUnauthFailure: () => createAction(POST_UNAUTH[FAILURE]),
  postUnauthSuccess: () => createAction(POST_UNAUTH[SUCCESS])
};

/*
* Login or authenticate action
* setting of token and user info to localstorage
* after successful login, user is redirected to the /wallets page
*/
export const postAuthRequest = (username, password) => async dispatch => {
  if (!username || !password) {
    return dispatch(auth.postAuthFailure("Login error."));
  }
  dispatch(auth.postAuthRequest(username, password));
  const { response } = await Api({
    method: "post",
    url: "/login",
    data: { username, password }
  });
  if (response) {
    dispatch(auth.postAuthSuccess(response.data));
    // set localstorage token
    setToken(
      response.data.user.access_token,
      JSON.stringify(response.data.user.user)
    );
    return dispatch(push("/wallets"));
  }
  return dispatch(auth.postAuthFailure("Invalid credentials."));
};

/* logout action
* upon logout, remove local storage token and redirect to home page
*/
export const postUnauthRequest = () => async dispatch => {
  dispatch(auth.postUnauthRequest());
  unsetToken();
  dispatch(auth.postUnauthSuccess());
  const { response, error } = await Api({
    method: "post",
    url: "logout"
  });
  if (response) {
    return dispatch(push("/"));
  }
  dispatch(push("/"));
  return dispatch(auth.postUnauthFailure(error));
};
