const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function resolveApiBaseUrl() {
  if (!configuredApiBaseUrl) {
    return process.env.NODE_ENV === "development" ? "http://localhost:3000" : "";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configuredApiBaseUrl.startsWith("http://")
  ) {
    console.warn(
      `[LogoutDev] API base URL "${configuredApiBaseUrl}" is HTTP, but the site is on HTTPS. ` +
      `This will cause mixed-content errors. Set NEXT_PUBLIC_API_BASE_URL to an HTTPS URL.`
    );
    return "";
  }

  return configuredApiBaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();