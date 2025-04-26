export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// Terms and Conditions
export const TERMS_CONDITIONS_DATE = "April 26, 2025"

/* =========== API BACKEND URI ===========*/
const version = "v1";
// Auth
export const SIGN_IN_URI = `/api/${version}/auth/sign-in`;
export const SIGN_UP_URI = `/api/${version}/auth/sign-up`;
// Home
export const HOME_URI = `/api/${version}/user/home`;
// Chat
export const GET_CHAT_HISTORY_URI = `/api/${version}/llm/chat-history`;
export const CLEAR_CHAT_HISTORY_URI = `/api/${version}/llm/clear-history`;
export const POST_CHAT_MESSAGE_URI = `/api/${version}/llm/get-response`;
