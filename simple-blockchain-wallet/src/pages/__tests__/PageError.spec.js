import React from "react";
import toJson from "enzyme-to-json";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router";

import { mount } from "enzyme";

import store, { history } from "../../store";
import PageError from "../PageError";

// mocks
import mockLocalStorage from "../../__mocks__/localStorage";

describe("Error page", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  const Component = (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <PageError />
      </ConnectedRouter>
    </Provider>
  );

  it("should render PageError page", () => {
    const component = mount(Component);
    expect(toJson(component)).toMatchSnapshot();
  });
});
