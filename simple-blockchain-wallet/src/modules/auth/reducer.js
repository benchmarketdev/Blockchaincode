import { REQUEST, FAILURE, SUCCESS } from "../utils";
import { POST_AUTH, POST_UNAUTH } from "./actions";

export const authInitialState = {
  data: {
    isAuthenticated: false,
    profile: {}
  },
  error: null
};

const auth = (state = authInitialState, action) => {
  switch (action.type) {
    case POST_UNAUTH[REQUEST]:
    case POST_AUTH[REQUEST]:
      return {
        ...state
      };
    case POST_AUTH[FAILURE]:
      return {
        ...state,
        error: action.error
      };
    case POST_AUTH[SUCCESS]:
      return {
        ...state,
        error: null,
        data: {
          isAuthenticated: !!action.response,
          profile: {
            ...state.data.profile,
            ...action.response.user.user // user profile data from bitgo api
          }
        }
      };
    case POST_UNAUTH[SUCCESS]:
      return {
        ...state,
        data: {
          ...state.data,
          ...authInitialState.data
        }
      };
    default:
      return state;
  }
};

export default auth;
