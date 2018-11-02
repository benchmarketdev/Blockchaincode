import Api from "../../services/api";

import {
  createAction,
  createRequestTypes,
  REQUEST,
  FAILURE,
  SUCCESS,
  RESET
} from "../utils";

export const POST_SEND_BITCOIN = createRequestTypes("POST_SEND_BITCOIN");

export const bitcoin = {
  postSendBitcoinRequest: () => createAction(POST_SEND_BITCOIN[REQUEST]),
  postSendBitcoinFailure: error =>
    createAction(POST_SEND_BITCOIN[FAILURE], { error }),
  postSendBitcoinSuccess: response =>
    createAction(POST_SEND_BITCOIN[SUCCESS], { response }),

  resetSendBitcoinNotification: () => createAction(POST_SEND_BITCOIN[RESET])
};

/*
* Sending bitcoin to other wallet,
* walletId, walletPass, destionation and amount should be passed as arguments
*/
export const postSendBitcoinRequest = (
  walletId,
  walletPass,
  destination,
  amount
) => async dispatch => {
  dispatch(bitcoin.postSendBitcoinRequest());
  const { response, error } = await Api({
    method: "post",
    url: "/send",
    data: {
      walletId,
      walletPass,
      destination,
      amount
    }
  });
  if (response) {
    return dispatch(bitcoin.postSendBitcoinSuccess(response.data));
  }
  return dispatch(bitcoin.postSendBitcoinFailure(error));
};
