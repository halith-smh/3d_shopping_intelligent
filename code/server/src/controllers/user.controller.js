import { ApiResponse } from "../utils/ApiResponse.js";

export const getHome = async (req, res) => {
  res.send(
    new ApiResponse(
      200,
      {
        products: [
          { id: 101, name: "Fridge", price: "18000" },
          { id: 102, name: "Washing Machine", price: "22000" },
        ],
      },
      "Sample Products list"
    )
  );
};
