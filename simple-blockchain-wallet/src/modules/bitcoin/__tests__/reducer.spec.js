import { bitcoin } from "../actions";
import bitcoinReducer, { bitcoinInitialState } from "../reducer";

// mocks
const bitcoinSuccess = { sent: true };
const ERROR_MESSAGE = "Bitcoin transaction failed.";

describe("Bitcoin reducer", () => {
  it("Should return bitcoin initial state", () => {
    expect(bitcoinReducer(undefined, {})).toEqual(bitcoinInitialState);
  });

  it("Should call POST_BITCOIN_REQUEST", () => {
    expect(
      bitcoinReducer(bitcoinInitialState, bitcoin.postSendBitcoinRequest())
    ).toEqual({
      ...bitcoinInitialState,
      isLoading: true
    });
  });

  it("Should call POST_BITCOIN_SUCCESS", () => {
    expect(
      bitcoinReducer(
        bitcoinInitialState,
        bitcoin.postSendBitcoinSuccess(bitcoinSuccess)
      )
    ).toEqual({
      ...bitcoinInitialState,
      data: { ...bitcoinSuccess },
      notification: {
        ...bitcoinInitialState.notification,
        success: true
      }
    });
  });

  it("Should call POST_BITCOIN_FAILURE", () => {
    expect(
      bitcoinReducer(
        bitcoinInitialState,
        bitcoin.postSendBitcoinFailure(ERROR_MESSAGE)
      )
    ).toEqual({
      ...bitcoinInitialState,
      error: ERROR_MESSAGE,
      notification: {
        ...bitcoinInitialState.notification,
        failure: true
      }
    });
  });

  // resets all of the notifications
  it("Should call POST_SEND_BITCOIN_RESET", () => {
    expect(
      bitcoinReducer(
        bitcoinInitialState,
        bitcoin.resetSendBitcoinNotification()
      )
    ).toEqual({
      ...bitcoinInitialState // equal to initial state
    });
  });
});
