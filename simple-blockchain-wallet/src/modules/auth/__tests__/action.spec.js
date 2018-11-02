import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import moxios from "moxios";

import { REQUEST, FAILURE, SUCCESS } from "../../utils";

// mocks
import { userData } from "../../../__mocks__/user";

// actions
import {
  POST_AUTH,
  POST_UNAUTH,
  postAuthRequest,
  postUnauthRequest
} from "../actions";
import { axiosInstance } from "../../../services/api";

// setup
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const mockUsername = "testUsername";
const mockPassword = "testPassword";

describe("Async call in wallet bitgo API", () => {
  beforeEach(() => {
    moxios.install(axiosInstance);
  });

  afterEach(() => {
    moxios.uninstall(axiosInstance);
  });

  it("should return error dispatch on AUTH_REQUEST", () => {
    const store = mockStore({ auth: {} });

    const expectedActions = [
      {
        type: POST_AUTH[REQUEST],
        username: mockUsername,
        password: mockPassword
      },
      {
        type: POST_AUTH[FAILURE],
        error: "Invalid credentials."
      }
    ];
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 400
      });
    });

    return store
      .dispatch(postAuthRequest(mockUsername, mockPassword))
      .then(() => {
        // return of async actions
        expect(store.getActions()).toEqual(expectedActions);
      });
  });

  it("should return error dispatch on AUTH_REQUEST no username or password", () => {
    const store = mockStore({ auth: {} });

    const expectedActions = [
      {
        type: POST_AUTH[FAILURE],
        error: "Login error."
      }
    ];
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 400
      });
    });

    return store.dispatch(postAuthRequest()).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  // it("should return success dispatch on AUTH_REQUEST", () => {
  //   const store = mockStore({ auth: {} });
  //
  //   const expectedActions = [
  //     {
  //       type: POST_AUTH[REQUEST],
  //       username: mockUsername,
  //       password: mockPassword
  //     },
  //     {
  //       type: POST_AUTH[SUCCESS],
  //       response: userData
  //     }
  //   ];
  //   moxios.wait(() => {
  //     const request = moxios.requests.mostRecent();
  //     request.respondWith({
  //       status: 200,
  //       response: [userData]
  //     });
  //   });
  //
  //   return store
  //     .dispatch(postAuthRequest(mockUsername, mockPassword))
  //     .then(() => {
  //       // return of async actions
  //       expect(store.getActions()).toEqual(expectedActions);
  //     });
  // });
});
