/**
 * Toast Manager for Ganpathi Manufacturing Operations
 * Handles user notifications and feedback messages
 */

export class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.autoRemoveDelay = 5000; // 5 seconds
    this.maxToasts = 5;
    this.init();
  }

  init() {
    // Find or create toast container
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "fixed top-4 right-4 z-50 space-y-2 max-w-sm";
      document.body.appendChild(this.container);
    }

    // Setup styles if not already present
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById("toast-styles")) return;

    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
            .toast {
                transform: translateX(100%);
                transition: all 0.3s ease-in-out;
                opacity: 0;
            }
            
            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .toast.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .toast-progress {
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                transform-origin: left;
                animation: progress linear;
            }
            
            @keyframes progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
            
            @media (max-width: 640px) {
                #toast-container {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                    max-width: none;
                }
            }
        `;
    document.head.appendChild(style);
  }

  show(message, type = "info", options = {}) {
    const toastId = Date.now() + Math.random();
    const toast = this.createToast(toastId, message, type, options);

    // Add to container
    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto remove (unless persistent)
    if (!options.persistent) {
      const delay = options.duration || this.autoRemoveDelay;
      setTimeout(() => {
        this.hide(toastId);
      }, delay);
    }

    // Limit number of toasts
    this.limitToasts();

    return toastId;
  }

  createToast(id, message, type, options) {
    const toast = document.createElement("div");
    toast.id = `toast-${id}`;
    toast.className = `toast bg-white rounded-lg shadow-lg border-l-4 p-4 ${this.getTypeClasses(
      type
    )}`;

    const icon = this.getTypeIcon(type);
    const canClose = options.closable !== false;
    const showProgress = !options.persistent && !options.hideProgress;
    const duration = options.duration || this.autoRemoveDelay;

    toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="${icon} text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                    ${
                      options.subtitle
                        ? `<p class="text-xs text-gray-600 mt-1">${options.subtitle}</p>`
                        : ""
                    }
                </div>
                ${
                  canClose
                    ? `
                    <div class="ml-4 flex-shrink-0">
                        <button class="toast-close text-gray-400 hover:text-gray-600 focus:outline-none" 
                                onclick="window.manufacturingApp?.toastManager.hide('${id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
            ${
              showProgress
                ? `
                <div class="toast-progress mt-2" style="animation-duration: ${duration}ms;"></div>
            `
                : ""
            }
        `;

    // Add click handler for actions
    if (options.action) {
      toast.style.cursor = "pointer";
      toast.addEventListener("click", () => {
        if (typeof options.action === "function") {
          options.action();
        }
        if (options.closeOnAction !== false) {
          this.hide(id);
        }
      });
    }

    return toast;
  }

  getTypeClasses(type) {
    const classes = {
      success: "border-green-400 bg-green-50",
      error: "border-red-400 bg-red-50",
      warning: "border-yellow-400 bg-yellow-50",
      info: "border-blue-400 bg-blue-50",
    };
    return classes[type] || classes.info;
  }

  getTypeIcon(type) {
    const icons = {
      success: "fas fa-check-circle text-green-400",
      error: "fas fa-exclamation-circle text-red-400",
      warning: "fas fa-exclamation-triangle text-yellow-400",
      info: "fas fa-info-circle text-blue-400",
    };
    return icons[type] || icons.info;
  }

  hide(toastId) {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    toast.classList.remove("show");
    toast.classList.add("hide");

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  limitToasts() {
    if (this.toasts.size > this.maxToasts) {
      const oldestId = this.toasts.keys().next().value;
      this.hide(oldestId);
    }
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  error(message, options = {}) {
    return this.show(message, "error", {
      duration: 8000, // Errors stay longer
      ...options,
    });
  }

  warning(message, options = {}) {
    return this.show(message, "warning", {
      duration: 6000,
      ...options,
    });
  }

  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  // Special toast types for manufacturing context
  jobUpdate(jobId, status, options = {}) {
    return this.info(`Job ${jobId} status updated to ${status}`, {
      subtitle: "Click to view job details",
      action: () => {
        if (window.manufacturingApp) {
          window.manufacturingApp.navigate(`/jobs/${jobId}`);
        }
      },
      ...options,
    });
  }

  inventoryAlert(itemName, quantity, options = {}) {
    return this.warning(`Low stock: ${itemName}`, {
      subtitle: `Only ${quantity} remaining`,
      action: () => {
        if (window.manufacturingApp) {
          window.manufacturingApp.navigate("/inventory");
        }
      },
      ...options,
    });
  }

  machineAlert(machineId, status, options = {}) {
    const type = status === "error" ? "error" : "warning";
    return this.show(`Machine ${machineId}: ${status}`, type, {
      subtitle: "Click to view machine details",
      action: () => {
        if (window.manufacturingApp) {
          window.manufacturingApp.navigate(`/machine/${machineId}`);
        }
      },
      ...options,
    });
  }

  systemNotification(message, type = "info", options = {}) {
    return this.show(message, type, {
      duration: 10000, // System notifications stay longer
      persistent: options.persistent || false,
      ...options,
    });
  }

  // Loading toast with progress
  loading(message, options = {}) {
    const toastId = this.show(message, "info", {
      persistent: true,
      closable: false,
      hideProgress: true,
      ...options,
    });

    // Add spinner to the toast
    const toast = this.toasts.get(toastId);
    if (toast) {
      const iconElement = toast.querySelector("i");
      iconElement.className = "fas fa-spinner fa-spin text-blue-400";
    }

    return toastId;
  }

  updateLoading(toastId, message) {
    const toast = this.toasts.get(toastId);
    if (toast) {
      const messageElement = toast.querySelector(".text-sm");
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }

  // Batch operations
  clear() {
    Array.from(this.toasts.keys()).forEach((id) => {
      this.hide(id);
    });
  }

  hideType(type) {
    this.toasts.forEach((toast, id) => {
      if (toast.classList.contains(this.getTypeClasses(type).split(" ")[0])) {
        this.hide(id);
      }
    });
  }

  // Configuration
  setMaxToasts(max) {
    this.maxToasts = max;
    this.limitToasts();
  }

  setAutoRemoveDelay(delay) {
    this.autoRemoveDelay = delay;
  }

  // Factory mode - high visibility toasts for shop floor
  enableFactoryMode() {
    this.container.classList.add("factory-mode");
    this.container.style.fontSize = "1.1em";
    this.container.style.fontWeight = "bold";
    this.maxToasts = 3; // Fewer toasts to avoid clutter
    this.autoRemoveDelay = 7000; // Longer display time
  }

  disableFactoryMode() {
    this.container.classList.remove("factory-mode");
    this.container.style.fontSize = "";
    this.container.style.fontWeight = "";
    this.maxToasts = 5;
    this.autoRemoveDelay = 5000;
  }

  // Debug
  debug() {
    console.log("ToastManager Debug:");
    console.log("Active toasts:", this.toasts.size);
    console.log("Max toasts:", this.maxToasts);
    console.log("Auto remove delay:", this.autoRemoveDelay);
    console.log("Container:", this.container);
  }
}
