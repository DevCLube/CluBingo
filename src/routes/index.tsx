import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { FullscreenButton } from "@/components/FullscreenButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clube Pirassununga" },
      { name: "description", content: "Clube Pirassununga — sistema oficial." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@500;700;800&display=swap",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background:
          "radial-gradient(1200px 600px at 50% 0%, rgba(198,40,40,0.08), transparent 60%), radial-gradient(800px 500px at 50% 100%, rgba(198,40,40,0.06), transparent 60%), #ffffff",
      }}
    >
      <div
        className="absolute inset-6 rounded-[2rem] pointer-events-none"
        style={{
          border: "1px solid rgba(198,40,40,0.18)",
          boxShadow: "0 30px 80px rgba(198,40,40,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      />

      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <FullscreenButton />
        </div>
      </div>

      <img
        src={logo}
        alt=""
        className="absolute inset-0 m-auto w-[62vw] max-w-[750px] opacity-[0.08] pointer-events-none select-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full">
        <img
          src={logo}
          alt="Clube Pirassununga"
          className="w-28 h-28 mb-8 select-none"
          style={{
            borderRadius: "50%",
            background: "transparent",
            objectFit: "cover",
            boxShadow: "0 4px 15px rgba(198,40,40,0.12)",
          }}
        />

        <h1
          className="text-5xl md:text-7xl"
          style={{
            fontFamily: "Oswald, Inter, sans-serif",
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          <span
            style={{
              color: "#000000",
              WebkitTextStroke: "2px #FFFFFF",
              textShadow: "0 3px 8px rgba(0,0,0,0.25)",
              letterSpacing: "1px",
              marginRight: "0.4em",
              display: "inline-block",
            }}
          >
            Clube
          </span>
          <span
            style={{
              color: "#FFFFFF",
              WebkitTextStroke: "2.5px #C62828",
              textShadow: "0 3px 10px rgba(0,0,0,0.28)",
              letterSpacing: "1.2px",
              display: "inline-block",
            }}
          >
            Pirassununga
          </span>
        </h1>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <CardLink to="/sorteador" title="Tela do Sorteador" />
          <CardLink to="/conferente" title="Tela do Conferente" />
        </div>

        <InstallPWAButton />
      </div>
    </div>
  );
}

function CardLink({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="group relative rounded-2xl bg-white px-8 py-10 transition-all duration-300 hover:-translate-y-1"
      style={{
        border: "1px solid rgba(198,40,40,0.25)",
        boxShadow: "0 10px 30px rgba(198,40,40,0.10)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 18px 48px rgba(198,40,40,0.22)";
        e.currentTarget.style.borderColor = "#C62828";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(198,40,40,0.10)";
        e.currentTarget.style.borderColor = "rgba(198,40,40,0.25)";
      }}
    >
      <div
        className="text-2xl md:text-3xl font-extrabold tracking-tight"
        style={{ color: "#1F1F1F", fontFamily: "Inter, sans-serif" }}
      >
        {title.split(" ").slice(0, -1).join(" ")}{" "}
        <span style={{ color: "#C62828" }}>{title.split(" ").slice(-1)}</span>
      </div>
      <div
        className="mt-4 h-1 w-12 mx-auto rounded-full"
        style={{ background: "linear-gradient(90deg, #C62828, #E53935)" }}
      />
    </Link>
  );
}
