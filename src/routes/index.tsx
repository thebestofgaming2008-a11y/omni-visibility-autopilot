import { createFileRoute } from "@tanstack/react-router";
import capturedCSS from "../styles/site.css?raw";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "OmniVisibility Autopilot — Development" }] }),
  staticData: { importedDocument: { html: { "lang": "en" }, body: {  } } },
  component: Index,
});

function Index() {
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
              <button className={"active flex-1 py-[10px] px-[14px] [&:disabled]:opacity-[0.55]"}>Sign in</button>
              <button className={"flex-1 py-[10px] px-[14px] [&:disabled]:opacity-[0.55]"}>Create account</button>
            </div>
            <form className="grid gap-[16px]">
              <label className="block">Email<input autoComplete="email" required type="email" name="email" /></label>
              <label className="block">Password<input autoComplete="current-password" minLength={8} required type="password" name="password" /></label>
              <input type="hidden" defaultValue="signIn" name="flow" />
              <button className={"primary py-[10px] px-[14px] w-full [&:disabled]:opacity-[0.55]"}>Sign in</button>
            </form>
            <button className={"py-[10px] px-[14px] [&:disabled]:opacity-[0.55] [width:100%] mt-[12px]"}>Continue with Google</button>
            <p className="notice leading-normal pt-[18px] [border-top:1px_solid_rgb(52,65,90)]">Google sign in is available for approved development test accounts. Email verification and password reset are not configured yet.</p>
          </div>
        </main>
      </div>
    </>
  );
}
