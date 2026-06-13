"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface MealSlot {
  id: string;
  name: string;
  percentage: number;
  ingredients: Ingredient[];
}

interface MealPlanData {
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    water: number;
    steps: number;
    tdee?: number;
    bmr?: number;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: MealSlot[];
  notes?: any[];
  personalizationScore?: number;
  explanation?: string;
}

interface EmailGateModalProps {
  onClose: () => void;
  mealPlan: MealPlanData;
  calculatorInput?: any;
}

type FormStatus = "idle" | "loading" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(fullName: string, email: string, isEs: boolean): { fullName?: string; email?: string } {
  const errors: { fullName?: string; email?: string } = {};
  if (!fullName.trim()) errors.fullName = isEs ? "El nombre completo es obligatorio." : "Full name is required.";
  if (!email.trim()) errors.email = isEs ? "El correo electrónico es obligatorio." : "Email address is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = isEs ? "Por favor, introduce un correo electrónico válido." : "Please enter a valid email address.";
  return errors;
}

export default function EmailGateModal({ onClose, mealPlan, calculatorInput }: EmailGateModalProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isEs = i18n.language === 'es';
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState({ fullName: false, email: false });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverError, setServerError] = useState("");

  const errors = validate(fullName, email, isEs);
  const isValid = Object.keys(errors).length === 0;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "loading") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, status]);

  const handleBlur = (field: "fullName" | "email") =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setServerError("");

    try {
      // 1. Map frontend mealPlan to Worker DeliveryPayload
      const workerPayload = {
        userId: localStorage.getItem('mm_uid') || undefined,
        email,
        fullName,
        locale: isEs ? 'es' : 'en',
        tags: ["meal-planner"],
        identity: {
          name: fullName,
          bodyType: calculatorInput?.bodyType || "Default",
          goal: calculatorInput?.goal || "Default",
          age: calculatorInput?.age,
          weightKg: calculatorInput?.weight,
          heightCm: calculatorInput?.height,
          bodyFatPct: calculatorInput?.bodyFatPercent
        },
        metabolicProfile: {
          bmr: mealPlan.targets.bmr || 0,
          tdee: mealPlan.targets.tdee || 0,
          targetKcal: mealPlan.targets.calories,
          proteinGrams: mealPlan.targets.protein,
          carbsGrams: mealPlan.targets.carbs,
          fatsGrams: mealPlan.targets.fats,
          activityLevel: "Moderate",
          surplus: mealPlan.targets.calories - (mealPlan.targets.tdee || 0),
          water: mealPlan.targets.water,
          steps: mealPlan.targets.steps,
          fiber: mealPlan.targets.fiber
        },
        personalization: {
          personalizationScore: mealPlan.personalizationScore || 95
        },
        intelligenceNotes: (mealPlan.notes || []).map((n: any) => ({
          category: n.category,
          layer: 1,
          personalizationScore: 100,
          whyThisMatters: n.whyItMatters || n.text,
          howToApplyToday: n.howToApply || n.text
        })),
        meals: mealPlan.meals.map(m => ({
          name: m.name,
          calories: m.ingredients.reduce((acc, i) => acc + i.calories, 0),
          protein: m.ingredients.reduce((acc, i) => acc + i.protein, 0),
          carbs: m.ingredients.reduce((acc, i) => acc + i.carbs, 0),
          fats: m.ingredients.reduce((acc, i) => acc + i.fats, 0),
          ingredients: m.ingredients.map(i => ({
            name: i.name,
            calories: i.calories,
            protein: i.protein,
            carbs: i.carbs,
            fats: i.fats
          }))
        })),
        delivered: {
          kcal: mealPlan.totals.calories,
          protein: mealPlan.totals.protein,
          carb: mealPlan.totals.carbs,
          fat: mealPlan.totals.fats
        },
        explanation: mealPlan.explanation
      };

      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "https://metamorfit-worker-alpha.metamorfitnet.workers.dev";
      const res = await fetch(`${workerUrl}/api/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_MM_UI_SECRET || 'meta_alpha_sec_a7c2e9f1b3d8k9m_42891_abc'}`
        },
        body: JSON.stringify(workerPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEs ? "Fallo al enviar el PDF." : "Failed to send PDF."));
      }

      setStatus("success");
      // Redirect to thank-you page after small delay
      setTimeout(() => {
        router.push("/thank-you");
      }, 1500);

    } catch (err: any) {
      console.error("[EmailGateModal] Submission error:", err);
      setStatus("error");
      setServerError(err.message || (isEs ? "Ocurrió un error inesperado. Por favor, inténtalo de nuevo." : "An unexpected error occurred. Please try again."));
    }
  };

  const handleBackdropClick = () => {
    if (status !== "loading") onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-[0.96] slide-in-from-bottom-2 duration-250"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-mm-black to-mm-dark shadow-2xl p-6 md:p-8">

          <div className="flex flex-col items-center">
            {/* Heading */}
            <h2
              id="modal-title"
              className="mb-2 font-heading text-[24px] sm:text-[28px] tracking-[1px] text-mm-bone text-center uppercase"
            >
              {isEs ? "Obtén tu Plan en PDF Personalizado" : "Get Your Personalized PDF Plan"}
            </h2>
            <p className="mb-6 text-[14px] font-body text-mm-bone/75 text-center max-w-[320px] mx-auto">
              {isEs ? "Introduce tus datos y te enviaremos tu plan personalizado directamente a tu bandeja de entrada." : "Enter your details and we'll send your custom plan straight to your inbox."}
            </p>

            {/* Server error banner */}
            {status === "error" && serverError && (
              <div
                role="alert"
                className="mb-4 flex w-full items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-400 font-body"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mt-px shrink-0">
                  <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 3.5v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {serverError}
              </div>
            )}

            <div className="w-full">
              {/* Name field */}
              <div className="mb-4 w-full">
                <label
                  htmlFor="gate-name"
                  className="mb-1.5 block text-[12px] font-body uppercase tracking-widest text-mm-bone/75"
                >
                  {isEs ? "Nombre Completo" : "Full Name"}
                </label>
                <input
                  id="gate-name"
                  type="text"
                  placeholder={isEs ? "Ej. Alex Torres" : "e.g. Alex Torres"}
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  disabled={status === "loading"}
                  className={`w-full rounded-lg border bg-mm-dark p-4 text-[14px] font-body text-mm-bone placeholder:text-mm-bone/20 outline-none transition-all disabled:opacity-50 ${touched.fullName && errors.fullName
                    ? "border-red-500/60 focus:border-red-500/60"
                    : "border-white/[0.08] focus:border-mm-gold focus:ring-1 focus:ring-mm-gold/50"
                    }`}
                />
                {touched.fullName && errors.fullName && (
                  <p role="alert" className="mt-1.5 animate-in slide-in-from-top-1 text-[11.5px] font-body text-red-400">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div className="mb-6 w-full">
                <label
                  htmlFor="gate-email"
                  className="mb-1.5 block text-[12px] font-body uppercase tracking-widest text-mm-bone/75"
                >
                  {isEs ? "Correo Electrónico" : "Email Address"}
                </label>
                <input
                  id="gate-email"
                  type="email"
                  placeholder={isEs ? "tu@ejemplo.com" : "you@example.com"}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  disabled={status === "loading"}
                  className={`w-full rounded-lg border bg-mm-dark p-4 text-[14px] font-body text-mm-bone placeholder:text-mm-bone/20 outline-none transition-all disabled:opacity-50 ${touched.email && errors.email
                    ? "border-red-500/60 focus:border-red-500/60"
                    : "border-white/[0.08] focus:border-mm-gold focus:ring-1 focus:ring-mm-gold/50"
                    }`}
                />
                {touched.email && errors.email && (
                  <p role="alert" className="mt-1.5 animate-in slide-in-from-top-1 text-[11.5px] font-body text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Submit */}
              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full h-[52px] items-center justify-center gap-2 rounded-lg bg-mm-gold text-[14px] font-body font-bold text-mm-black transition-all hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-busy={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-mm-black/25 border-t-mm-black" />
                      {isEs ? "Enviando..." : "Sending..."}
                    </>
                  ) : status === "success" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {isEs ? "¡Plan Enviado!" : "Plan Sent!"}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      {isEs ? "Enviar Mi Plan" : "Send My Plan"}
                    </>
                  )}
                </button>
              </form>

              {/* Footer Note */}
              <p className="mt-3 text-center font-body text-[12px] text-[#A3A3A3]">
                {isEs ? "Envío gratis · Sin spam, nunca." : "Free delivery · No spam, ever."}
              </p>
            </div>
          </div>

          {/* Close button - Top Right */}
          <button
            onClick={onClose}
            disabled={status === "loading"}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-mm-bone/40 transition-all hover:text-mm-bone hover:bg-white/5 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Close modal"
          >
            <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

        </div>
      </div>
    </>
  );
}

