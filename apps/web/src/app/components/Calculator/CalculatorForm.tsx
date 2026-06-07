"use client";

import React from "react";
import { InputField } from "./InputField";
import { ActivitySelector } from "./ActivitySelector";
import { ObjectiveSelector } from "./ObjectiveSelector";
import { CalculatorInput, CalculatorError, Sex } from "@/types/calculator";

interface CalculatorFormProps {
  input: CalculatorInput;
  errors: CalculatorError[];
  loading: boolean;
  updateField: <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => void;
  submit: () => Promise<void>;
}

export function CalculatorForm({
  input,
  errors,
  loading,
  updateField,
  submit,
}: CalculatorFormProps) {
  const [weightUnit, setWeightUnit] = React.useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = React.useState<"cm" | "ft">("cm");

  const [lbsValue, setLbsValue] = React.useState(input.weight ? (input.weight / 0.45359237).toFixed(1) : "");
  const [ftValue, setFtValue] = React.useState(input.height ? Math.floor((input.height / 2.54) / 12).toString() : "");
  const [inValue, setInValue] = React.useState(input.height ? Math.round((input.height / 2.54) % 12).toString() : "");

  // Update converters when external input changes (if metric)
  React.useEffect(() => {
    if (weightUnit === "kg" || !input.weight) {
      setLbsValue(input.weight ? (input.weight / 0.45359237).toFixed(1) : "");
    }
  }, [input.weight, weightUnit]);

  React.useEffect(() => {
    if (heightUnit === "cm" || !input.height) {
      const totalInches = input.height / 2.54;
      setFtValue(input.height ? Math.floor(totalInches / 12).toString() : "");
      setInValue(input.height ? Math.round(totalInches % 12).toString() : "");
    }
  }, [input.height, heightUnit]);

  const handleLbsChange = (val: string) => {
    setLbsValue(val);
    const lbs = parseFloat(val);
    if (!isNaN(lbs)) {
      updateField("weight", lbs * 0.45359237);
    } else {
      updateField("weight", 0);
    }
  };

  const handleFtInChange = (ft: string, inch: string) => {
    setFtValue(ft);
    setInValue(inch);
    const f = parseInt(ft) || 0;
    const i = parseInt(inch) || 0;
    const cm = (f * 12 + i) * 2.54;
    updateField("height", cm);
  };

  const showGoalWeight = (input.bodyType === "hardgainer" || input.bodyType === "ectomorph") && input.goal === "bulk";

  React.useEffect(() => {
    if (!showGoalWeight && input.goalWeight !== undefined) {
      updateField("goalWeight", undefined as any);
    }
  }, [showGoalWeight, input.goalWeight, updateField]);

  return (
    <div className="bg-mm-dark border border-mm-offblack rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden h-fit transition-all duration-700 hover:border-mm-dark/60 w-full">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-mm-gold/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-8 w-full">
        <div className="flex justify-between items-center w-full border-b border-white/5 pb-4">
          <h2 className="text-mm-gold font-heading text-3xl uppercase tracking-tighter flex items-center gap-4 m-0">
            Your Information 
            <span className="text-mm-bone/20 font-body font-light">—</span> 
            <span className="text-mm-bone/60 font-heading tracking-[0.2em] text-xl uppercase">{input.bodyType}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 w-full">
          {/* COLUMN 1: Biometrics & Precision (left) */}
          <div className="space-y-8">
            {/* PERSONAL BIO METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* FIRST ROW: SEX & AGE */}
              <div className="flex flex-col group/input">
                <label htmlFor="sex-select" className="h-10 flex items-end pb-2 text-[15px] font-medium text-mm-bone/60 uppercase tracking-[0.15em] group-focus-within/input:text-mm-gold transition-colors duration-500">
                  Sex
                </label>
                <div className="relative">
                  <select
                    id="sex-select"
                    value={input.sex}
                    onChange={(e) => updateField("sex", e.target.value as Sex)}
                    className="bg-mm-black border border-mm-dark rounded-xl px-4 py-3.5 text-mm-bone text-base focus:border-mm-gold transition-all duration-300 outline-none w-full appearance-none cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within/input:text-mm-gold transition-all" aria-hidden="true">▼</div>
                </div>
              </div>

              <InputField
                label="Age"
                type="number"
                value={input.age}
                onChange={(v) => updateField("age", Number(v))}
                error={errors.find(e => e.field === "age")?.message}
                suffix="yrs"
              />

              {/* SECOND ROW: WEIGHT & HEIGHT */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="weight-input" className="text-[15px] font-medium text-mm-bone/60 uppercase tracking-[0.15em] transition-colors duration-500">
                    Weight
                  </label>
                  <div className="flex items-center bg-mm-black rounded-lg border border-mm-dark p-0.5">
                    <button 
                      onClick={() => setWeightUnit("kg")}
                      aria-label="Set weight to kilograms"
                      className={`px-3 py-1 text-[10px] uppercase font-heading tracking-widest rounded transition-all ${weightUnit === "kg" ? "bg-mm-gold text-mm-black shadow-sm scale-105" : "text-mm-bone/30 hover:text-mm-bone/60"}`}
                    >
                      kg
                    </button>
                    <button 
                      onClick={() => setWeightUnit("lbs")}
                      aria-label="Set weight to pounds"
                      className={`px-3 py-1 text-[10px] uppercase font-heading tracking-widest rounded transition-all ${weightUnit === "lbs" ? "bg-mm-gold text-mm-black shadow-sm scale-105" : "text-mm-bone/30 hover:text-mm-bone/60"}`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
                <div className="relative group/input">
                  <input
                    id="weight-input"
                    type="number"
                    value={weightUnit === "kg" ? (input.weight || "") : lbsValue}
                    onChange={(e) => weightUnit === "kg" ? updateField("weight", Number(e.target.value)) : handleLbsChange(e.target.value)}
                    placeholder={weightUnit === "kg" ? "kg" : "lbs"}
                    className={`
                      bg-mm-black border rounded-xl px-4 py-3.5 text-mm-bone text-base 
                      focus:border-mm-gold outline-none w-full transition-all duration-500
                      placeholder:opacity-20 shadow-inner
                      ${errors.find(e => e.field === "weight") ? "border-red-500/50" : "border-mm-dark group-hover/input:border-mm-dark/80"}
                    `}
                  />
                  {errors.find(e => e.field === "weight") && <span className="text-[10px] text-red-400 mt-1.5 uppercase tracking-wider animate-fadeIn">{errors.find(e => e.field === "weight")?.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="height-cm-input" className="text-[15px] font-medium text-mm-bone/60 uppercase tracking-[0.15em] transition-colors duration-500">
                    Height
                  </label>
                  <div className="flex items-center bg-mm-black rounded-lg border border-mm-dark p-0.5">
                    <button 
                      onClick={() => setHeightUnit("cm")}
                      aria-label="Set height to centimeters"
                      className={`px-3 py-1 text-[10px] uppercase font-heading tracking-widest rounded transition-all ${heightUnit === "cm" ? "bg-mm-gold text-mm-black shadow-sm scale-105" : "text-mm-bone/30 hover:text-mm-bone/60"}`}
                    >
                      cm
                    </button>
                    <button 
                      onClick={() => setHeightUnit("ft")}
                      aria-label="Set height to feet and inches"
                      className={`px-3 py-1 text-[10px] uppercase font-heading tracking-widest rounded transition-all ${heightUnit === "ft" ? "bg-mm-gold text-mm-black shadow-sm scale-105" : "text-mm-bone/30 hover:text-mm-bone/60"}`}
                    >
                      ft/in
                    </button>
                  </div>
                </div>
                <div className="relative group/input">
                  {heightUnit === "cm" ? (
                    <input
                      id="height-cm-input"
                      type="number"
                      value={input.height || ""}
                      onChange={(e) => updateField("height", Number(e.target.value))}
                      placeholder="cm"
                      className={`
                        bg-mm-black border rounded-xl px-4 py-3.5 text-mm-bone text-base 
                        focus:border-mm-gold outline-none w-full transition-all duration-500
                        placeholder:opacity-20 shadow-inner
                        ${errors.find(e => e.field === "height") ? "border-red-500/50" : "border-mm-dark group-hover/input:border-mm-dark/80"}
                      `}
                    />
                  ) : (
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          id="height-ft-input"
                          type="number"
                          value={ftValue}
                          onChange={(e) => handleFtInChange(e.target.value, inValue)}
                          placeholder="ft"
                          className="bg-mm-black border border-mm-dark rounded-xl px-4 py-3.5 text-mm-bone text-base focus:border-mm-gold outline-none w-full transition-all duration-500 shadow-inner"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-mm-bone/20 uppercase tracking-widest pointer-events-none" aria-hidden="true">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={inValue}
                          onChange={(e) => handleFtInChange(ftValue, e.target.value)}
                          placeholder="in"
                          className="bg-mm-black border border-mm-dark rounded-xl px-4 py-3.5 text-mm-bone text-base focus:border-mm-gold outline-none w-full transition-all duration-500 shadow-inner"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-mm-bone/20 uppercase tracking-widest pointer-events-none" aria-hidden="true">in</span>
                      </div>
                    </div>
                  )}
                  {errors.find(e => e.field === "height") && <span className="text-[10px] text-red-400 mt-1.5 uppercase tracking-wider animate-fadeIn">{errors.find(e => e.field === "height")?.message}</span>}
                </div>
              </div>
            </div>
   
            {/* ENHANCER METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-6 border-t border-white/[0.03]">
              <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <InputField
                  label="Body Fat %"
                  type="number"
                  value={input.bodyFatPercent || ""}
                  onChange={(v) => updateField("bodyFatPercent", Number(v))}
                  error={errors.find(e => e.field === "bodyFatPercent")?.message}
                  suffix="%"
                  placeholder={input.precisionMode ? "Optional (5–45)" : "Locked"}
                  disabled={!input.precisionMode}
                />
                <span className="text-[10px] text-mm-bone/30 uppercase tracking-widest italic">
                  {!input.precisionMode 
                    ? "Enable Precision Mode if you know your body fat %." 
                    : !input.bodyFatPercent 
                      ? "Optional: Add your body fat % for more accurate results."
                      : "Using Body Fat % for Katch-McArdle calculation."
                  }
                </span>
              </div>
                
                {showGoalWeight && (
                  <div className="flex flex-col gap-2 animate-fadeIn transition-all duration-500">
                    <InputField
                      label="Goal Weight"
                      type="number"
                      value={input.goalWeight || ""}
                      onChange={(v) => updateField("goalWeight", Number(v))}
                      error={errors.find(e => e.field === "goalWeight")?.message}
                      placeholder="e.g., 145 lbs"
                    />
                    <span className="text-[10px] text-mm-bone/40 italic leading-relaxed">
                      The weight you want to reach. Used to calculate optimal protein for muscle gain.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 justify-end pb-1">
                <div className="flex items-center justify-between group/toggle cursor-pointer py-2" onClick={() => updateField("precisionMode", !input.precisionMode)} role="switch" aria-checked={input.precisionMode ? "true" : "false"} aria-label="Precision Mode">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-mm-bone/60 uppercase tracking-[0.1em] group-hover:text-mm-gold transition-colors">Precision Mode</span>
                    <span className="text-[10px] text-mm-bone/30 uppercase tracking-widest italic">g/lb calculation</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${input.precisionMode ? "bg-mm-gold" : "bg-mm-black border border-mm-dark"}`}>
                    <div className={`w-4 h-4 rounded-full transition-all duration-500 ${input.precisionMode ? "bg-mm-black translate-x-6" : "bg-mm-bone/20 translate-x-0"}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between group/toggle cursor-pointer py-2" onClick={() => updateField("somatotypeTweak", !input.somatotypeTweak)} role="switch" aria-checked={input.somatotypeTweak ? "true" : "false"} aria-label="Somatotype Tweak">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-mm-bone/60 uppercase tracking-[0.1em] group-hover:text-mm-gold transition-colors">Somatotype Tweak</span>
                    <span className="text-[10px] text-mm-bone/30 uppercase tracking-widest italic">Metabolic baseline adjust</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${input.somatotypeTweak ? "bg-mm-gold" : "bg-mm-black border border-mm-dark"}`}>
                    <div className={`w-4 h-4 rounded-full transition-all duration-500 ${input.somatotypeTweak ? "bg-mm-black translate-x-6" : "bg-mm-bone/20 translate-x-0"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Activity, Goal & Trigger (right) */}
          <div className="flex flex-col gap-6">
            <ActivitySelector
              value={input.activityLevel}
              onChange={(v) => updateField("activityLevel", v)}
              error={errors.find(e => e.field === "activityLevel")?.message}
            />

            <ObjectiveSelector
              value={input.goal}
              onChange={(v) => updateField("goal", v)}
            />

            {/* CALCULATION TRIGGER */}
            <div className="pt-4 space-y-4 mt-auto">
              <button
                onClick={submit}
                disabled={loading}
                aria-busy={loading ? "true" : "false"}
                aria-label="Calibrate metabolic engine"
                className={`
                  w-full h-14 md:h-16 flex items-center justify-center bg-mm-gold text-mm-black font-heading tracking-[0.1em] uppercase text-xl md:text-2xl rounded-xl 
                  hover:bg-mm-bone active:scale-95 transition-all duration-500 shadow-2xl shadow-mm-gold/20
                  disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden
                `}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" aria-hidden="true" />
                <span className="relative z-10">{loading ? "Synchronizing Engine..." : "Calibrate Metabolic Engine →"}</span>
              </button>

              {/* General system errors */}
              {errors.find(e => e.field === "general") && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fadeIn">
                   <p className="text-red-400 text-sm font-medium flex items-center gap-2 italic">
                     <span className="w-1.5 h-1.5 bg-red-400 rounded-full" aria-hidden="true" />
                     {errors.find(e => e.field === "general")?.message}
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
