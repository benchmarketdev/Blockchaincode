import React from "react";
import { mount } from "enzyme";
import toJson from "enzyme-to-json";
import { BrowserRouter as Router } from "react-router-dom";

import { WalletsMenu } from "../WalletsMenu";

describe("Login component", () => {
  const mockGetWalletListRequest = jest.fn();
  const mockWalletList = [];
  const mockLoading = false;
  const MockWalletsMenu = () => (
    <WalletsMenu
      getWalletListRequest={mockGetWalletListRequest}
      walletList={mockWalletList}
      loading={mockLoading}
    />
  );

  it("Should match snapshot", () => {
    const component = mount(<MockWalletsMenu />);
    expect(toJson(component)).toMatchSnapshot();
  });

  it("Should contain walletList data", () => {
    const mockWalletListData = [
      {
        id: 1,
        label: "label1"
      },
      {
        id: 2,
        label: "label2"
      }
    ];
    const WalletMenuWithRouter = () => (
      <Router>
        <WalletsMenu
          getWalletListRequest={mockGetWalletListRequest}
          walletList={mockWalletListData}
          loading={mockLoading}
        />
      </Router>
    );
    const component = mount(<WalletMenuWithRouter />);
    expect(component.text()).toContain(mockWalletListData[0].label);
    expect(component.text()).toContain(mockWalletListData[1].label);
  });

  // it("Should call componentWillMount", () => {
  //
  //   sinon.spy(WalletsMenu.prototype, "componentWillMount");
  //   expect(WalletsMenu.prototype.componentWillMount.calledOnce).toBeTruthy();
  // });
});
