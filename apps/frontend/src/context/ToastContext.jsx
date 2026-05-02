import { useState, createContext, useContext } from "react";

const ToastContext = createContext();

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within an AuthProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toastsList, setToastsList] = useState([]);

  const addToast = (msg = "", color = "", time = 3) => {
    const toastId = Date.now() + Math.random();
    setToastsList((prevToasts) => [
      ...prevToasts,
      {
        id: toastId,
        text: msg,
        color: color,
        time: time,
      },
    ]);
  };

  const removeToast = (toastId) => {
    setToastsList((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
  };

  const contextData = {
    toastsList: toastsList,
    addToast: addToast,
    removeToast: removeToast,
  };

  return <ToastContext.Provider value={contextData}>{children}</ToastContext.Provider>;
};

export default ToastContext;
