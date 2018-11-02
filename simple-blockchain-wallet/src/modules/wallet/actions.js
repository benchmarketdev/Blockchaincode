import Api from "../../services/api";

import {
  createAction,
  createRequestTypes,
  REQUEST,
  FAILURE,
  SUCCESS
} from "../utils";

export const GET_WALLET_LIST = createRequestTypes("GET_WALLET_LIST");
export const GET_WALLET = createRequestTypes("GET_WALLET");

export const wallet = {
  // individual wallet
  getWalletRequest: walletId => createAction(GET_WALLET[REQUEST], { walletId }),
  getWalletFailure: (walletId, error) =>
    createAction(GET_WALLET[FAILURE], { walletId, error }),
  getWalletSuccess: (walletId, response) =>
    createAction(GET_WALLET[SUCCESS], { walletId, response }),

  // wallet list
  getWalletListRequest: () => createAction(GET_WALLET_LIST[REQUEST]),
  getWalletListFailure: error =>
    createAction(GET_WALLET_LIST[FAILURE], { error }),
  getWalletListSuccess: response =>
    createAction(GET_WALLET_LIST[SUCCESS], { response })
};

/*
* Only get the index list of wallets and not all of the info of each wallet,
*/
export const requestWalletListAction = () => async dispatch => {
  dispatch(wallet.getWalletListRequest());
  const { response, error } = await Api({
    method: "post",
    url: "/wallet-list"
  });
  return response
    ? dispatch(wallet.getWalletListSuccess(response.data))
    : dispatch(wallet.getWalletListFailure(error));
};

/*
* Get specific wallet information,
* requires walletId as params
*/
export const requestWalletAction = walletId => async dispatch => {
  dispatch(wallet.getWalletRequest(walletId));
  const { response } = await Api({
    method: "post",
    url: "/wallet-info",
    data: {
      address: walletId
    }
  });
  return response
    ? dispatch(wallet.getWalletSuccess(walletId, response.data))
    : dispatch(wallet.getWalletFailure(walletId, "Unable to fetch wallet."));
};
