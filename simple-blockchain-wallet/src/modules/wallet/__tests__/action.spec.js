import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import moxios from "moxios";

import { REQUEST, FAILURE, SUCCESS } from "../../utils";
import { axiosInstance } from "../../../services/api";

// actions
import {
  GET_WALLET,
  GET_WALLET_LIST,
  requestWalletListAction,
  requestWalletAction
} from "../actions";

// mocks
import {
  walletData,
  walletId,
  GET_WALLET_FAILURE_ERROR
} from "../../../__mocks__/wallet";
import { userData } from "../../../__mocks__/user";

// setup
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe("Async call in wallet bitgo API ", () => {
  beforeEach(() => {
    moxios.install(axiosInstance);
  });

  afterEach(() => {
    moxios.uninstall(axiosInstance);
  });

  it("shoud return error dispatch: getWallet -  NO WALLET ID PASSED AS PARAMS", () => {
    const store = mockStore({ wallet: {} });
    const expectedActions = [
      {
        type: GET_WALLET[REQUEST]
      },
      {
        type: GET_WALLET[FAILURE],
        error: GET_WALLET_FAILURE_ERROR
      }
    ];

    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 400
      });
    });

    return store.dispatch(requestWalletAction()).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  // successful mock
  it("Should return wallet data on getWalletRequest()", () => {
    const store = mockStore({ wallet: {} });
    const expectedActions = [
      {
        type: GET_WALLET[REQUEST],
        walletId
      },
      {
        type: GET_WALLET[SUCCESS],
        walletId,
        response: walletData
      }
    ];

    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: walletData
      });
    });

    return store.dispatch(requestWalletAction(walletId)).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  // wallet list
  it("should return error on dispatch failure - getWalletList", () => {
    const store = mockStore({ wallet: {} });
    const expectedActions = [
      {
        type: GET_WALLET_LIST[REQUEST]
      },
      {
        type: GET_WALLET_LIST[FAILURE],
        error: new Error("Request failed with status code 400")
      }
    ];

    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 400
      });
    });

    return store.dispatch(requestWalletListAction()).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("should return data on dispatch success - getWalletList", () => {
    const store = mockStore({ wallet: {} });
    const expectedActions = [
      {
        type: GET_WALLET_LIST[REQUEST]
      },
      {
        type: GET_WALLET_LIST[SUCCESS],
        response: walletData
      }
    ];

    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: walletData
      });
    });

    return store.dispatch(requestWalletListAction()).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
