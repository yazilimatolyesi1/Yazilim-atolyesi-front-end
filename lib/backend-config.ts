const BACKEND_URL = process.env.CLUB_API_URL;
if (!BACKEND_URL) throw new Error("CLUB_API_URL is not defined");
export const backendURLConfig: {
  baseUrl: string;
  apiPrefix: string;
} = {
  baseUrl: BACKEND_URL.replace(/\/+$/, ""),
  apiPrefix: "api/v1", // The reason I have included this part separately is that the API might be released in the future, but in a gradual manner.
};