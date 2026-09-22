import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { signInSorteador } from "@/lib/auth-sorteador";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login Sorteador — Clube Pirassununga" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signInSorteador(user.trim(), pass.trim())) {
      nav({ to: "/sorteador" });
    } else {
      setErr("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl shadow-lg p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="" className="w-16 h-16 mb-2" />
          <h1 className="text-xl font-bold text-neutral-800">Acesso do Sorteador</h1>
          <p className="text-sm text-neutral-500">Entre com suas credenciais</p>
        </div>
        <label className="block text-sm font-semibold text-neutral-700 mb-1">Usuário</label>
        <input
          autoFocus
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-[#e63946] mb-4"
        />
        <label className="block text-sm font-semibold text-neutral-700 mb-1">Senha</label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-[#e63946] mb-4"
        />
        {err && <div className="text-sm font-semibold text-[#e63946] mb-3">{err}</div>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg font-bold text-white bg-[#e63946] hover:bg-[#d12f3c] active:scale-95 transition"
        >
          Entrar
        </button>
        <Link
          to="/"
          className="block text-center text-sm text-neutral-500 mt-4 hover:text-neutral-700"
        >
          ← Voltar
        </Link>
      </form>
    </div>
  );
}
