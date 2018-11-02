import { REQUEST, FAILURE, SUCCESS, RESET } from "../utils";
import { POST_SEND_BITCOIN } from "./actions";

export const bitcoinInitialState = {
  data: {},
  error: null,
  isLoading: false,
  notification: {
    // notify user if the transaction is successful or not
    success: false,
    failure: false
  }
};

const bitcoin = (state = bitcoinInitialState, action) => {
  switch (action.type) {
    case POST_SEND_BITCOIN[REQUEST]:
      return {
        ...state,
        isLoading: true
      };
    case POST_SEND_BITCOIN[FAILURE]:
      return {
        ...state,
        error: action.error,
        isLoading: false,
        notification: {
          ...bitcoinInitialState.notification,
          failure: true,
          success: false
        }
      };
    case POST_SEND_BITCOIN[SUCCESS]:
      return {
        ...state,
        data: action.response,
        error: null,
        isLoading: false,
        notification: {
          ...bitcoinInitialState.notification,
          failure: false,
          success: true
        }
      };
    case POST_SEND_BITCOIN[RESET]:
      return {
        ...state,
        notification: {
          ...bitcoinInitialState.notification
        }
      };
    default:
      return state;
  }
};

export default bitcoin;
