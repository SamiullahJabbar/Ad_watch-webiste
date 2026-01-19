// // const BASE_URL = "http://16.171.174.65:8000/api"; 
// const BASE_URL = "http://127.0.0.1:8001/api"; 


// // FIX: Now uses the correct key 'accessToken'
// export const saveAccessToken = (token) => {
//   if (token) {
//     sessionStorage.setItem("accessToken", token);
//   }
// };

// export const getAccessToken = () => {
//   return sessionStorage.getItem("accessToken");
// };

// // Added helper for refreshToken as it's used in cleanup
// export const saveRefreshToken = (token) => {
//   if (token) {
//     sessionStorage.setItem("refreshToken", token);
//   }
// };

// export const removeTokens = () => {
//   sessionStorage.removeItem("accessToken");
//   sessionStorage.removeItem("refreshToken");
// };

// export default BASE_URL;



// Install this package if you haven't: npm install jwt-decode
import { jwtDecode } from 'jwt-decode';

const BASE_URL = "https://establishment-ton-counts-nam.trycloudflare.com/api"; 

// FIX: Now uses the correct key 'accessToken'
export const saveAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem("accessToken", token);
  }
};

export const getAccessToken = () => {
  return sessionStorage.getItem("accessToken");
};

// --- NEW FUNCTION: Extract Username from Token Payload ---
export const getUsernameFromToken = () => {
  const token = getAccessToken();
  if (token) {
    try {
      const decoded = jwtDecode(token);
      // ✅ NOTE: Assuming your JWT payload has a 'username' or 'name' field
      // Agar tumhara field 'user_name' ya 'full_name' hai, to uske mutabik change kar lena.
      return decoded.username || decoded.name || 'User'; 
    } catch (e) {
      console.error("Failed to decode token:", e);
      return 'User';
    }
  }
  return 'Guest';
};
// --------------------------------------------------------


export const saveRefreshToken = (token) => {
  if (token) {
    sessionStorage.setItem("refreshToken", token);
  }
};

export const removeTokens = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
};

export default BASE_URL;