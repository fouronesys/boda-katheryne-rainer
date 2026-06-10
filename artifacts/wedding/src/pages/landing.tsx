import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Landing() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if we have a token in URL query string or path, but Wouter doesn't give us query string easily without parsing.
    // The spec says: if no token, redirect to /admin; if token in URL, redirect to /invitation/:token.
    // However, the router handles /invitation/:token directly.
    // If they hit /, we just redirect to /admin.
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setLocation(`/invitation/${token}`);
    } else {
      setLocation("/admin");
    }
  }, [setLocation]);

  return null;
}
