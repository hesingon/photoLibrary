import React from "react";
import { Link } from "@pankod/refine";

import { TitleProps } from "@pankod/refine";

export const Title: React.FC<TitleProps> = ({ collapsed }) => (
  <Link to="/">
    <div
        style={{
          width: "200px",
          padding: "20px 5px 5px 5px",
        }}
      />
  </Link>
);
