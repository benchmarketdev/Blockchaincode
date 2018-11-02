import React from "react";
import toJson from "enzyme-to-json";
import { Provider } from "react-redux";
import { ConnectedRouter } from "connected-react-router";

import { mount } from "enzyme";

import store, { history } from "../../store";
import Home from "../Home";

// mocks
import mockLocalStorage from "../../__mocks__/localStorage";

describe("Home page", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  const Component = (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Home />
      </ConnectedRouter>
    </Provider>
  );

  it("should render home page", () => {
    const component = mount(Component);
    expect(toJson(component)).toMatchSnapshot();
  });
});
