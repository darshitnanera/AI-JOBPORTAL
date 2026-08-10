import React, { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { toastStyles as s } from "../../assets/dummyStyles";

const Toast = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      ...s.variants.success,
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      ...s.variants.error,
    },
  };

  const { icon, bg, border, text } = config[type] || config.success;

  return (
    <div className={`${s.container} ${bg} ${border} ${text}`}>
      <div className={s.iconWrapper}>{icon}</div>
      <p className={s.message}>{message}</p>
      <button onClick={onClose} className={s.closeButton}>
        <X className={s.closeIcon} />
      </button>

      <style>{s.animations}</style>
    </div>
  );
};

export default Toast;
