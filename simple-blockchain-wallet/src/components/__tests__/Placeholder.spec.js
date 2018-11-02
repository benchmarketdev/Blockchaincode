import React from "react";
import { mount } from "enzyme";
import toJson from "enzyme-to-json";

import Placeholder from "../Placeholder";

describe("Login component", () => {
  const MockPlaceHolder = () => <Placeholder />;

  it("Should match snapshot", () => {
    const component = mount(<MockPlaceHolder />);

    expect(toJson(component)).toMatchSnapshot();
  });
});
