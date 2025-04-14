import axios from "axios";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LLM_URI } from "../utils/constants.js";
import { lipSync } from "../modules/lip-sync.mjs";

export const getResponse = async (req, res, next) => {
  const { query } = req.body;

  try {
    const _getResponse = await axios.post(LLM_URI, { query: query });
    console.log(_getResponse.data.messages);
    
    // console.log(_getResponse.data);
    // res.send(_getResponse.data)
    const _lipSync = await lipSync({ messages: _getResponse.data.messages });
    res.send(
      new ApiResponse(
        200,
        _getResponse.data,
        `LLm response for the user query: ${query}`
      )
    );
  } catch (error) {
    next(error);
  }
};
