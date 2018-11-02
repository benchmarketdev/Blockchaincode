import React from "react";
import { Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import { isAuthenticated } from "../utils";

// utility component for filtering unauthenticated users
// redirect users to home page if they're unauthenticated
const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      isAuthenticated() ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: "/",
            state: { from: props.location } // eslint-disable-line
          }}
        />
      )
    }
  />
);

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired
};

export default PrivateRoute;
