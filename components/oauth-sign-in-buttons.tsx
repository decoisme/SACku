"use client";

import { useState, useTransition } from "react";
import { startOAuthSignIn } from "@/app/masuk/actions";

type OAuthProvider = "google" | "apple";

export function OAuthSignInButtons({ consentAccepted }: { consentAccepted: boolean }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const begin = (provider: OAuthProvider) => startTransition(async () => {
    setError("");
    const result = await startOAuthSignIn(provider, consentAccepted);
    if (result?.error) setError(result.error);
  });

  return <div className="oauth-sign-in">
    <div className="oauth-divider"><span>atau lanjutkan dengan</span></div>
    {error && <div className="form-alert error" role="alert">{error}</div>}
    <button type="button" className="oauth-provider-button" onClick={() => begin("google")} disabled={pending}>
      <svg className="oauth-provider-icon" aria-hidden="true" focusable="false" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11c-.5 2.7-2.1 5-4.4 6.5v5.4h7.1c4.2-3.9 6.6-9.6 6.6-15.9z"/><path fill="#34A853" d="M24 44c5.9 0 10.8-2 14.4-5.5l-7.1-5.4c-2 1.4-4.5 2.3-7.3 2.3-5.6 0-10.3-3.8-12-8.9H4.7v5.6C8.3 39.3 15.5 44 24 44z"/><path fill="#FBBC05" d="M12 26.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5v-5.6H4.7C3.1 15.1 2.2 18.4 2.2 22s.9 6.9 2.5 10.1l7.3-5.6z"/><path fill="#EA4335" d="M24 8.6c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.8 2.1 29.9 0 24 0 15.5 0 8.3 4.7 4.7 11.9l7.3 5.6c1.7-5.1 6.4-8.9 12-8.9z"/></svg>
      {pending ? "Menghubungkan..." : "Lanjutkan dengan Google"}
    </button>
    <button type="button" className="oauth-provider-button" onClick={() => begin("apple")} disabled={pending}>
      <svg className="oauth-provider-icon oauth-apple-icon" aria-hidden="true" focusable="false" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.3 50-84.7-18.8-26.9-47.2-41.7-84.9-44.6-35.7-2.8-74.7 20.8-89.6 20.8-15.7 0-50.1-19.8-77.3-19.8C60.5 141.2 8 181.6 8 259.4c0 23 4.2 46.7 12.6 71.1 11.2 32 51.6 110.4 93.7 109.1 24.7-.6 42.1-17.5 75-17.5 31.9 0 48 17.5 75.5 17.5 42.5-.6 79-71.9 89.6-104-56.9-26.8-55.7-65.3-55.7-66.9zM262.5 105.3c27.5-32.6 25-62.3 24.2-73.3-24.3 1.4-52.4 16.5-68.4 35.2-17.7 20.1-28.1 45-25.8 73.1 26.3 2 50.3-11.5 70-35z"/></svg>
      {pending ? "Menghubungkan..." : "Lanjutkan dengan Apple"}
    </button>
  </div>;
}
