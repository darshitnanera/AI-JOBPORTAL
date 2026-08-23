import React, { useEffect, useRef, useState } from "react";

const OTPInput = ({
  value = "",
  onChange,
  length = 6,
  className = "",
  disabled = false,
  onComplete,
}) => {
  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(() =>
    Array.from({ length }, (_, i) => value[i] || "")
  );

  // Keep internal boxes in sync when the parent resets/replaces the value.
  useEffect(() => {
    if (value !== otp.join("")) {
      setOtp(Array.from({ length }, (_, i) => value[i] || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const commit = (next) => {
    setOtp(next);
    const otpString = next.join("");
    onChange(otpString);
    if (otpString.length === length && next.every((d) => d) && onComplete) {
      onComplete(otpString);
    }
  };

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    const next = [...otp];
    next[index] = val.slice(-1);
    commit(next);

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...otp];
        next[index - 1] = "";
        commit(next);
      } else {
        const next = [...otp];
        next[index] = "";
        commit(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .split("")
      .slice(0, length);

    if (!pasted.length) return;

    const next = Array.from({ length }, (_, i) => pasted[i] ?? "");
    commit(next);

    if (pasted.length === length) {
      inputRefs.current[length - 1]?.blur();
    } else {
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength="1"
          value={otp[index] || ""}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={`h-14 w-12 rounded-xl border text-center text-xl font-bold shadow-sm
                      transition focus:outline-none
                      ${
                        disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      }`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
