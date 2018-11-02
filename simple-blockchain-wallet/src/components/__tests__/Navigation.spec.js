import React from "react";
import { mount } from "enzyme";
import toJson from "enzyme-to-json";
import { Switch, Route, BrowserRouter } from "react-router-dom";

import { Navigation } from "../Navigation";
import mockLocalStorage from "../../__mocks__/localStorage";

describe("Login component", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  const mockPostUnauthRequest = jest.fn();
  const NavigationMock = (
    <BrowserRouter>
      <Switch>
        <Route>
          <Navigation postUnauthRequest={mockPostUnauthRequest} />
        </Route>
      </Switch>
    </BrowserRouter>
  );

  it("Should match snapshot", () => {
    const component = mount(NavigationMock);

    expect(toJson(component)).toMatchSnapshot();
  });
  // username and password
  // it("Should contain username and password input", () => {
  //   const component = mount(<NavigationMock />);
  //   expect(component.text()).toContain("Username");
  //   expect(component.text()).toContain("Password");
  // });
});
