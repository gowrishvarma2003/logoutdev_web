import { clearStoredVault } from "@/lib/chatCrypto";
import * as requestCache from "@/lib/services/requestCache";

function isBrowser() {
  return typeof window !== "undefined";
}

function cookieDomainCandidates(hostname: string) {
  const domains = new Set<string>();
  if (!hostname || hostname === "localhost" || /^[\d.]+$/.test(hostname)) return [];

  domains.add(hostname);
  const parts = hostname.split(".");
  for (let index = 0; index <= parts.length - 2; index += 1) {
    domains.add(`.${parts.slice(index).join(".")}`);
  }
  return [...domains];
}

function cookiePathCandidates(pathname: string) {
  const paths = new Set<string>(["/"]);
  const segments = pathname.split("/").filter(Boolean);
  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    paths.add(current);
  }
  return [...paths];
}

export function clearReadableCookies() {
  if (!isBrowser()) return;
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean);
  if (!cookies.length) return;

  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const maxAge = "Max-Age=0";
  const sameSite = "SameSite=Lax";
  const paths = cookiePathCandidates(window.location.pathname);
  const domains = cookieDomainCandidates(window.location.hostname);

  for (const name of cookies) {
    const encodedName = name;
    for (const path of paths) {
      document.cookie = `${encodedName}=; ${expires}; ${maxAge}; path=${path}; ${sameSite}`;
      for (const domain of domains) {
        document.cookie = `${encodedName}=; ${expires}; ${maxAge}; path=${path}; domain=${domain}; ${sameSite}`;
      }
    }
  }
}

export function clearClientSession() {
  requestCache.clear();
  clearStoredVault();
  if (!isBrowser()) return;

  clearReadableCookies();
  localStorage.clear();
  sessionStorage.clear();
}

export function clearClientSessionAndRedirect(path = "/login") {
  clearClientSession();
  if (!isBrowser()) return;
  if (window.location.pathname !== path) {
    const event = new CustomEvent("logoutdev:redirect", { cancelable: true, detail: { path } });
    window.dispatchEvent(event);
    if (event.defaultPrevented) return;
    window.location.href = path;
  }
}
