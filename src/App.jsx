import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { installShim } from "./shim";
import SHELL from "./shell.html.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos."); setBusy(false);
  }
  return (
    <div className="login"><form className="pn" onSubmit={submit}>
      <h1>SANDS PLAZA SPA</h1><p>Ingresa con tu cuenta</p>
      <div className="fld"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="fld"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {error && <div className="err">{error}</div>}
      <button className="btn p" style={{ width: "100%" }} disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form></div>
  );
}

function Shell() {
  useEffect(() => {
    installShim();
    import("./legacy/app.js");
    document.getElementById("lo")?.addEventListener("click", async () => {
      await supabase.auth.signOut(); location.reload();
    });
  }, []);
  return <div style={{ height: "100%" }} dangerouslySetInnerHTML={{ __html: SHELL }} />;
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [role, setRole] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setRole(null); return; }
    supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => { window.SPS_ROLE = data?.role || "Operario"; setRole(window.SPS_ROLE); });
  }, [session]);
  if (session === undefined) return null;
  if (!session) return <Login />;
  if (!role) return null;
  return <Shell />;
}
