const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function resolveApiBaseUrl() {
  if (!configuredApiBaseUrl) {
    return process.env.NODE_ENV === "development" ? "http://localhost:3000" : "";
  }

  const isBrowserHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (isBrowserHttps && configuredApiBaseUrl.startsWith("http://")) {
    return "/api";
  }

  return configuredApiBaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();