import { useState, useEffect } from "react";

const LOGO_KEY = "pisal_logo";
const DEFAULT_LOGO = "/pisal-logo-transparent.png";

export function useLogo(): string {
  const [logoUrl, setLogoUrl] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO : DEFAULT_LOGO)
  );

  useEffect(() => {
    const handler = () => {
      setLogoUrl(localStorage.getItem(LOGO_KEY) || DEFAULT_LOGO);
    };
    window.addEventListener("pisal:logo_updated", handler);
    return () => window.removeEventListener("pisal:logo_updated", handler);
  }, []);

  return logoUrl;
}

export function saveLogo(dataUrl: string): void {
  localStorage.setItem(LOGO_KEY, dataUrl);
  window.dispatchEvent(new Event("pisal:logo_updated"));
}

export function resetLogo(): void {
  localStorage.removeItem(LOGO_KEY);
  window.dispatchEvent(new Event("pisal:logo_updated"));
}
