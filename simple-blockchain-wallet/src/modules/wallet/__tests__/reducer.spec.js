import { wallet } from "../actions";
import walletReducer, { walletInitialState } from "../reducer";

// MOCKS
import {
  GET_WALLET_FAILURE_ERROR,
  walletData
} from "../../../__mocks__/wallet";

describe("wallet reducer", () => {
  it("should return wallet initial state", () => {
    expect(walletReducer(undefined, {})).toEqual(walletInitialState);
  });

  it("should call GET_WALLET_LIST_REQUEST", () => {
    expect(
      walletReducer(walletInitialState, wallet.getWalletListRequest())
    ).toEqual({
      ...walletInitialState,
      isLoading: true,
      error: null
    });
  });

  it("should should call GET_WALLET_LIST_FAILURE", () => {
    expect(
      walletReducer(
        walletInitialState,
        wallet.getWalletListFailure(GET_WALLET_FAILURE_ERROR)
      )
    ).toEqual({
      ...walletInitialState,
      error: GET_WALLET_FAILURE_ERROR,
      isLoading: false
    });
  });

  it("should call GET_WALLET_LIST_SUCCESS", () => {
    expect(
      walletReducer(
        walletInitialState,
        wallet.getWalletListSuccess({
          wallets: {
            wallets: walletData
          }
        })
      )
    ).toEqual({
      ...walletInitialState,
      error: null,
      data: {
        [walletData[0]._wallet.id]: {
          id: walletData[0]._wallet.id,
          label: walletData[0]._wallet.label
        }
      }
    });
  });

  it("should call GET_WALLET_REQUEST with ID params", () => {
    expect(
      walletReducer(
        walletInitialState,
        wallet.getWalletRequest([walletData[0]._wallet.id])
      )
    ).toEqual({
      ...walletInitialState,
      data: {
        [walletData[0]._wallet.id]: {
          isLoading: true
        }
      }
    });
  });

  it("should call GET_WALLET_FAILURE", () => {
    const walletFirstData = walletData[0]; // first item on the mock wallet data only
    const mockWalletId = walletData[0]._wallet.id; // walletId of the first item in mocked wallet data
    expect(
      walletReducer(
        {
          ...walletInitialState,
          data: {
            // prepopulate store data
            [mockWalletId]: { ...walletFirstData }
          }
        },
        wallet.getWalletFailure(mockWalletId, GET_WALLET_FAILURE_ERROR)
      )
    ).toEqual({
      ...walletInitialState,
      data: {
        // get only the first data
        [mockWalletId]: {
          error: GET_WALLET_FAILURE_ERROR,
          ...walletFirstData,
          isLoading: false
        }
      }
    });
  });

  it("should call GET_WALLET_SUCCESS with ID params", () => {
    const walletFirstData = walletData[0]; // first item on the mock wallet data only
    const mockWalletId = walletData[0]._wallet.id; // walletId of the first item in mocked wallet data
    expect(
      walletReducer(
        walletInitialState,
        wallet.getWalletSuccess(mockWalletId, {
          wallet: walletFirstData
        })
      )
    ).toEqual({
      ...walletInitialState,
      data: {
        [mockWalletId]: {
          ...walletFirstData,
          isLoading: false,
          error: null
        }
      }
    });
  });
});
