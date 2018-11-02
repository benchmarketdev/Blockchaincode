import { auth } from "../actions";
import authReducer, { authInitialState } from "../reducer";

describe("auth reducer", () => {
  it("should return auth initial state", () => {
    expect(authReducer(undefined, {})).toEqual(authInitialState);
  });

  it("should call POST_AUTH_REQUEST", () => {
    expect(authReducer(authInitialState, auth.postAuthRequest())).toEqual({
      ...authInitialState,
      error: null
    });
  });

  it("should call POST_AUTH_FAILURE", () => {
    const mockErrorMessage = "Authentication failure";
    expect(
      authReducer(authInitialState, auth.postAuthFailure(mockErrorMessage))
    ).toEqual({
      ...authInitialState,
      error: mockErrorMessage
    });
  });

  it("should call POST_AUTH_SUCCESS", () => {
    const mockAuthResponse = {
      user: {}
    };
    expect(
      authReducer(
        authInitialState,
        auth.postAuthSuccess({
          user: mockAuthResponse
        })
      )
    ).toEqual({
      data: {
        isAuthenticated: true,
        profile: {}
      },
      error: null
    });
  });

  // logout reducer
  it("should call POST_UNAUTH_REQUEST", () => {
    expect(authReducer(authInitialState, auth.postUnauthRequest())).toEqual({
      ...authInitialState
    });
  });

  // logout reducer
  it("should call POST_UNAUTH_SUCCESS", () => {
    expect(authReducer(authInitialState, auth.postUnauthSuccess())).toEqual({
      ...authInitialState // go back to initial state for logout
    });
  });
});
