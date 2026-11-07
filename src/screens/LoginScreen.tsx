import { useState, type FormEvent, type SVGProps } from "react";
import { Button } from "@/components/base/Button";
import { Field } from "@/components/base/Field";
import BlurText from "@/components/reactbits/BlurText/BlurText";
import { API_BASE_URL, apiUrl } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, api } from "@/services/api";
import { ADM_EMAIL_DOMAIN, isAdmEmail } from "@/services/email";

const inputClass =
  "h-12 w-full rounded-[var(--radius-field)] border border-line-soft bg-paper text-[15px] text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-tint focus:bg-card focus:ring-4 focus:ring-tint/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
      <path d="M12 14.5v2" />
    </svg>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}

function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7" />
      <path d="M6.2 6.6A17.9 17.9 0 0 0 2.5 12S6 18 12 18c1.6 0 3-.5 4.2-1.2" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold tracking-[0.08em] ${
          dark
            ? "border border-line bg-card text-ink"
            : "border border-line bg-card-2 text-ink"
        }`}
      >
        CIT
      </div>
      <div>
        <p
          className={`font-display text-lg leading-none tracking-tight ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          CIT
        </p>
        <p
          className={`mt-1 text-[10px] tracking-[0.18em] uppercase ${
            dark ? "text-white/50" : "text-ink-faint"
          }`}
        >
          Centre d'information trafic
        </p>
      </div>
    </div>
  );
}

function RoadBackdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 640 900"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="2">
        <path d="M320 90 L-80 900" />
        <path d="M320 90 L720 900" />
      </g>
      <g stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeDasharray="16 26">
        <path d="M320 90 L90 900" />
        <path d="M320 90 L320 900" />
        <path d="M320 90 L550 900" />
      </g>
      <g stroke="rgba(225,48,108,0.14)" strokeWidth="1.5">
        <circle cx="320" cy="90" r="200" />
        <circle cx="320" cy="90" r="320" />
        <circle cx="320" cy="90" r="460" />
      </g>
    </svg>
  );
}

export function LoginScreen() {
  const { login, error: authError } = useAuth();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      const loginUrl = apiUrl("/api/auth/login");
      const networkError =
        (err instanceof ApiError && err.status === 0) ||
        err instanceof TypeError ||
        (err instanceof Error &&
          /failed to fetch|networkerror|load failed|network request failed/i.test(
            err.message,
          ));

      if (networkError) {
        const contactedUrl = err instanceof ApiError && err.url ? err.url : loginUrl;
        console.error(
          `[Login] Serveur inaccessible — URL contactée : ${contactedUrl}`,
          err,
        );
        setError(
          `Serveur inaccessible (${API_BASE_URL}). Le service est peut-être en veille : réessayez dans quelques instants.`,
        );
      } else {
        setError(err instanceof Error ? err.message : "Connexion impossible.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);
    if (!isAdmEmail(resetEmail)) {
      setResetError(`L'adresse doit se terminer par ${ADM_EMAIL_DOMAIN}.`);
      return;
    }

    setResetSubmitting(true);
    try {
      await api.forgotPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(
        err instanceof Error
          ? err.message
          : "Demande de réinitialisation impossible.",
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setError(null);
    setResetError(null);
    setResetSent(false);
  }

  const visibleError = error ?? authError;

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <RoadBackdrop />

        <div className="relative">
          <Brand dark />
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-bold tracking-[0.22em] text-adm-200 uppercase">
            Exploitation autoroutière · ADM
          </p>
          <div
            role="heading"
            aria-level={2}
            className="mt-5 font-display text-5xl leading-[0.95] tracking-tight xl:text-6xl"
          >
            <BlurText
              text="Localiser."
              animateBy="letters"
              direction="bottom"
              delay={70}
              stepDuration={0.3}
              className="justify-start"
            />
            <BlurText
              text="DǸcider."
              animateBy="letters"
              direction="bottom"
              delay={70}
              stepDuration={0.3}
              className="justify-start"
            />
            <BlurText
              text="Tracer."
              animateBy="letters"
              direction="bottom"
              delay={70}
              stepDuration={0.3}
              className="justify-start"
            />
          </div>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">
            Un poste de commandement unique pour situer un événement au PK,
            coordonner les équipes et conserver la mémoire de chaque
            intervention.
          </p>

          <div className="mt-9 flex flex-wrap gap-2">
            {["Axes", "Historique", "Répertoire", "Comptes rendus"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-tight text-white/70"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative flex items-start gap-2.5 text-[11px] leading-relaxed text-white/40">
          <ShieldIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            Accès réservé aux personnels habilités.
            <br />
            Toute action est rattachée à un compte nominatif.
          </p>
        </div>
      </section>

      <section className="flex flex-col bg-card lg:border-l lg:border-line-soft">
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-9 lg:hidden">
              <Brand />
            </div>

            {mode === "forgot" ? (
              resetSent ? (
                <div>
                  <div className="flex size-12 items-center justify-center  bg-ok/10 text-ok">
                    <CheckIcon className="size-6" />
                  </div>
                  <h1 className="mt-6 font-display text-3xl tracking-tight text-ink">
                    Demande envoyée
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Si un compte actif correspond à{" "}
                    <strong className="font-semibold text-ink">
                      {resetEmail.trim()}
                    </strong>
                    , un nouveau mot de passe vient d'être envoyé. Vérifiez aussi
                    les courriers indésirables.
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    fullWidth
                    className="mt-8"
                    onClick={backToLogin}
                  >
                    Retour à la connexion
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-bold tracking-[0.18em] text-adm-700 uppercase">
                    Récupération d'accès
                  </p>
                  <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
                    Mot de passe oublié
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Indiquez votre adresse professionnelle pour recevoir un
                    nouveau mot de passe.
                  </p>

                  <form
                    onSubmit={handleForgotPassword}
                    className="mt-8 space-y-4"
                    noValidate
                  >
                    <Field
                      label="Adresse email professionnelle"
                      htmlFor="login-email"
                    >
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-faint">
                          <MailIcon className="size-5" />
                        </span>
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          required
                          autoFocus
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          disabled={resetSubmitting}
                          className={`${inputClass} pl-11`}
                          placeholder={`prenom.nom${ADM_EMAIL_DOMAIN}`}
                        />
                      </div>
                    </Field>

                    {resetError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5  border border-red/25 bg-red/5 px-3.5 py-3 text-sm font-medium text-red-deep"
                      >
                        <AlertIcon className="mt-0.5 size-4 shrink-0" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      disabled={resetSubmitting || !resetEmail.trim()}
                    >
                      {resetSubmitting
                        ? "Envoi en cours…"
                        : "Recevoir un nouveau mot de passe"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={backToLogin}
                      disabled={resetSubmitting}
                    >
                      <ArrowLeftIcon className="size-4" />
                      Retour à la connexion
                    </Button>
                  </form>
                </div>
              )
            ) : (
              <>
                <p className="text-[11px] font-bold tracking-[0.18em] text-adm-700 uppercase">
                  Espace sécurisé
                </p>
                <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
                  Connexion
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Identifiez-vous avec le compte fourni par votre Manager
                  principal.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-4"
                  noValidate
                >
                  <Field label="Identifiant" htmlFor="login-identifier">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-faint">
                        <UserIcon className="size-5" />
                      </span>
                      <input
                        id="login-identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        autoFocus
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={submitting}
                        className={`${inputClass} pl-11`}
                        placeholder="prenom.nom"
                      />
                    </div>
                  </Field>

                  <Field label="Mot de passe" htmlFor="login-password">
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-faint">
                        <LockIcon className="size-5" />
                      </span>
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        className={`${inputClass} pr-12 pl-11`}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-ink-faint transition-colors hover:text-adm-700"
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-5" />
                        ) : (
                          <EyeIcon className="size-5" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                        setResetSent(false);
                      }}
                      className="cursor-pointer text-xs font-semibold text-ig-blue underline-offset-2 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {visibleError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5  border border-red/25 bg-red/5 px-3.5 py-3 text-sm font-medium text-red-deep"
                    >
                      <AlertIcon className="mt-0.5 size-4 shrink-0" />
                      <span>{visibleError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={submitting || !identifier.trim() || !password}
                  >
                    {submitting ? "Connexion…" : "Se connecter"}
                  </Button>
                </form>

                <div className="mt-8 flex items-start gap-2.5  bg-paper px-3.5 py-3 text-[11px] leading-relaxed text-ink-faint">
                  <ShieldIcon className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Accès réservé aux personnels habilités. Ne partagez jamais
                    vos identifiants.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="px-5 pb-6 text-center text-[11px] tracking-tight text-ink-faint sm:px-8">
          © {new Date().getFullYear()} ADM · Centre d'information trafic
        </p>
      </section>
    </main>
  );
}
