import toast from 'react-hot-toast'

export function useNotifications() {
  const showSuccess = (message) => {
    toast.success(message, {
      icon: '✅',
      duration: 4000,
    })
  }

  const showError = (message) => {
    toast.error(message, {
      icon: '❌',
      duration: 5000,
    })
  }

  const showLoading = (message) => {
    return toast.loading(message)
  }

  const dismiss = (toastId) => {
    toast.dismiss(toastId)
  }

  const showInfo = (message) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 4000,
    })
  }

  return { showSuccess, showError, showLoading, dismiss, showInfo }
}
