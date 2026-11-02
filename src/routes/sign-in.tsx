import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import capturedCSS from "../styles/site.css?raw";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — OmniVisibility Autopilot" }, { name: "description", content: "Operator sign in for OmniVisibility Autopilot." }, { property: "og:title", content: "Sign in — OmniVisibility Autopilot" }, { property: "og:description", content: "Operator sign in for OmniVisibility Autopilot." }] }),
  staticData: { importedDocument: { html: { "lang": "en" }, body: {  } } },
  component: Index,
});

function Index() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  return (
    <>
      <style>{capturedCSS}</style>
      <div id="root">
        <main className="auth-shell">
          <div className="auth-card border border-solid border-site-import-border rounded-[20px] [box-shadow:rgba(0,0,0,0.4)_0px_25px_80px] p-[32px] w-[min(430px,100%)]">
            <div className="brand-mark">◎</div>
            <p className="eyebrow tracking-[0.15em] leading-normal">DEVELOPMENT PREVIEW</p>
            <h1>OmniVisibility Autopilot</h1>
            <p className="muted leading-normal">Your workspace for evidence based organic visibility.</p>
            <div className="auth-switch rounded-[10px] flex gap-[7px] mt-[26px] mr-0 mb-[20px] ml-0 p-[5px]">
              <button type="button" onClick={() => setFlow("signIn")} className={(flow === "signIn" ? "active " : "") + "flex-1 py-[10px] px-[14px] [&:disabled]:opacity-[0.55]"}>Sign in</button>
              <button type="button" onClick={() => setFlow("signUp")} className={(flow === "signUp" ? "active " : "") + "flex-1 py-[10px] px-[14px] [&:disabled]:opacity-[0.55]"}>Create account</button>
            </div>
            <form className="grid gap-[16px]" onSubmit={(e) => e.preventDefault()}>
              <label className="block">Email<input autoComplete="email" required type="email" name="email" /></label>
              <label className="block">Password<input autoComplete={flow === "signIn" ? "current-password" : "new-password"} minLength={8} required type="password" name="password" /></label>
              <input type="hidden" value={flow} name="flow" />
              <button className={"primary py-[10px] px-[14px] w-full [&:disabled]:opacity-[0.55]"}>{flow === "signIn" ? "Sign in" : "Create workspace"}</button>
            </form>
            <button className={"py-[10px] px-[14px] [&:disabled]:opacity-[0.55] [width:100%] mt-[12px]"}>Continue with Google</button>
            <p className="notice leading-normal pt-[18px] [border-top:1px_solid_rgb(52,65,90)]">Google sign in is available for approved development test accounts. Email verification and password reset are not configured yet.</p>
          </div>
        </main>
      </div>
    </>
  );
}
