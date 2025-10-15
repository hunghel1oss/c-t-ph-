import toast from 'react-hot-toast';

export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    toast.error(message, {
      duration: 4000,
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        border: '1px solid #d97706',
      },
      duration: 4000,
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
      duration: 3000,
      ...options,
    });
  },
  
  loading: (message) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};
