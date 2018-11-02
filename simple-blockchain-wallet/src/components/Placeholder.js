import { Placeholder } from "zent";
import React from "react";

// loading component on loading requests
const LoadingPlaceholder = () => (
  <Placeholder.RichTextBlock rows={7} shape="rect" size={160} />
);

export default LoadingPlaceholder;
