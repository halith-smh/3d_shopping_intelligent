import { ApiResponse } from "../utils/ApiResponse.js";

export const getHome = async (req, res) => {
  res.send(
    new ApiResponse(
      200,
      {
        products: [],
      },
      "Sample Products list"
    )
  );
};
