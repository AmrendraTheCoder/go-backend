/**
 * Navigation Component for Ganpathi Manufacturing Operations
 * Handles the main navigation bar and user menu
 */

export class NavigationComponent {
  constructor(state, authManager) {
    this.state = state;
    this.authManager = authManager;
    this.container = null;
    this.activeRoute = "/dashboard";
    this.mobileMenuOpen = false;
  }

  render(container) {
    this.container = container;
    const user = this.state.getCurrentUser();

    const navigationHTML = `
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <!-- Left side - Logo and Navigation -->
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-bold text-gray-900">
                                <i class="fas fa-industry text-blue-600 mr-2"></i>
                                Ganpathi Operations
                            </h1>
                        </div>
                        
                        <!-- Desktop Navigation -->
                        <div class="hidden md:ml-8 md:flex md:space-x-8">
                            ${this.renderNavigationLinks()}
                        </div>
                    </div>

                    <!-- Right side - User menu and mobile menu button -->
                    <div class="flex items-center">
                        <!-- Connection Status -->
                        <div id="connection-status" class="mr-4 hidden sm:block">
                            ${this.renderConnectionStatus()}
                        </div>
                        
                        <!-- Notifications -->
                        <div class="mr-4">
                            ${this.renderNotificationButton()}
                        </div>
                        
                        <!-- User Menu -->
                        <div class="relative">
                            <button id="user-menu-button" 
                                    class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 btn-touch"
                                    aria-expanded="false" aria-haspopup="true">
                                <span class="sr-only">Open user menu</span>
                                <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span class="text-sm font-medium text-white">
                                        ${
                                          user?.name?.charAt(0).toUpperCase() ||
                                          "U"
                                        }
                                    </span>
                                </div>
                                <span class="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                                    ${user?.name || "User"}
                                </span>
                                <i class="fas fa-chevron-down ml-1 text-xs text-gray-400 hidden sm:block"></i>
                            </button>
                            
                            <!-- User Menu Dropdown -->
                            <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                                ${this.renderUserMenu(user)}
                            </div>
                        </div>

                        <!-- Mobile menu button -->
                        <div class="md:hidden ml-4">
                            <button id="mobile-menu-button" 
                                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 btn-touch"
                                    aria-expanded="false">
                                <span class="sr-only">Open main menu</span>
                                <i id="mobile-menu-icon" class="fas fa-bars"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="md:hidden hidden">
                <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                    ${this.renderMobileNavigationLinks()}
                </div>
            </div>
        `;

    container.innerHTML = navigationHTML;
    this.setupEventListeners();
  }

  renderNavigationLinks() {
    const user = this.state.getCurrentUser();
    const links = this.getNavigationLinks(user);

    return links
      .map(
        (link) => `
            <a href="#${link.href}" 
               class="nav-link inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium btn-touch
                      ${
                        this.isActiveRoute(link.href)
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }"
               data-route="${link.href}">
                <i class="${link.icon} mr-2"></i>
                ${link.text}
            </a>
        `
      )
      .join("");
  }

  renderMobileNavigationLinks() {
    const user = this.state.getCurrentUser();
    const links = this.getNavigationLinks(user);

    return links
      .map(
        (link) => `
            <a href="#${link.href}" 
               class="mobile-nav-link block px-3 py-2 rounded-md text-base font-medium btn-touch
                      ${
                        this.isActiveRoute(link.href)
                          ? "text-blue-700 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }"
               data-route="${link.href}">
                <i class="${link.icon} mr-3"></i>
                ${link.text}
            </a>
        `
      )
      .join("");
  }

  getNavigationLinks(user) {
    const baseLinks = [
      { href: "/dashboard", text: "Dashboard", icon: "fas fa-tachometer-alt" },
      { href: "/jobs", text: "Jobs", icon: "fas fa-tasks" },
    ];

    // Add role-specific links
    if (user?.role === "admin") {
      baseLinks.push(
        { href: "/customers", text: "Customers", icon: "fas fa-users" },
        { href: "/inventory", text: "Inventory", icon: "fas fa-boxes" }
      );
    } else if (user?.role === "machine_operator") {
      baseLinks.push({
        href: "/inventory",
        text: "Materials",
        icon: "fas fa-boxes",
      });
    }

    return baseLinks;
  }

  renderConnectionStatus() {
    const socketManager = window.manufacturingApp?.socketManager;
    const status = socketManager?.getConnectionStatus() || "disconnected";

    const statusConfig = {
      connected: { color: "green", icon: "fa-wifi", text: "Online" },
      connecting: {
        color: "yellow",
        icon: "fa-spinner fa-spin",
        text: "Connecting",
      },
      disconnected: { color: "red", icon: "fa-wifi-slash", text: "Offline" },
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    return `
            <div class="flex items-center text-xs">
                <div class="w-2 h-2 rounded-full bg-${config.color}-500 mr-2"></div>
                <i class="fas ${config.icon} text-${config.color}-500 mr-1"></i>
                <span class="text-gray-600">${config.text}</span>
            </div>
        `;
  }

  renderNotificationButton() {
    const notifications = this.state.getUnreadNotifications();
    const count = notifications.length;

    return `
            <button id="notifications-button" 
                    class="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 btn-touch"
                    title="Notifications">
                <i class="fas fa-bell text-lg"></i>
                ${
                  count > 0
                    ? `
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        ${count > 9 ? "9+" : count}
                    </span>
                `
                    : ""
                }
            </button>
        `;
  }

  renderUserMenu(user) {
    const menuItems = [
      { text: "Profile", icon: "fas fa-user", action: "profile" },
      { text: "Settings", icon: "fas fa-cog", action: "settings" },
    ];

    if (user?.role === "admin") {
      menuItems.push(
        { divider: true },
        { text: "User Management", icon: "fas fa-users-cog", action: "users" },
        { text: "System Settings", icon: "fas fa-server", action: "system" }
      );
    }

    menuItems.push(
      { divider: true },
      {
        text: "Sign Out",
        icon: "fas fa-sign-out-alt",
        action: "logout",
        class: "text-red-600",
      }
    );

    return menuItems
      .map((item) => {
        if (item.divider) {
          return '<div class="border-t border-gray-100 my-1"></div>';
        }

        return `
                <button class="user-menu-item block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  item.class || "text-gray-700"
                }"
                        data-action="${item.action}">
                    <i class="${item.icon} mr-2"></i>
                    ${item.text}
                </button>
            `;
      })
      .join("");
  }

  setupEventListeners() {
    // User menu toggle
    const userMenuButton = document.getElementById("user-menu-button");
    const userMenu = document.getElementById("user-menu");

    userMenuButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    // Close user menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!userMenu.contains(e.target) && !userMenuButton.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
    });

    // User menu actions
    document.querySelectorAll(".user-menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const action = e.target.closest(".user-menu-item").dataset.action;
        this.handleUserMenuAction(action);
        userMenu.classList.add("hidden");
      });
    });

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileMenuIcon = document.getElementById("mobile-menu-icon");

    mobileMenuButton?.addEventListener("click", () => {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      mobileMenu.classList.toggle("hidden");

      if (this.mobileMenuOpen) {
        mobileMenuIcon.className = "fas fa-times";
      } else {
        mobileMenuIcon.className = "fas fa-bars";
      }
    });

    // Navigation links
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = e.target.closest("a").dataset.route;
        if (window.manufacturingApp) {
          window.manufacturingApp.navigate(route);
        }

        // Close mobile menu if open
        if (this.mobileMenuOpen) {
          mobileMenu.classList.add("hidden");
          mobileMenuIcon.className = "fas fa-bars";
          this.mobileMenuOpen = false;
        }
      });
    });

    // Notifications button
    const notificationsButton = document.getElementById("notifications-button");
    notificationsButton?.addEventListener("click", () => {
      this.showNotificationsPanel();
    });

    // Listen for state changes
    this.state.subscribe("notifications", () => {
      this.updateNotificationButton();
    });

    // Listen for socket connection changes
    if (window.manufacturingApp?.socketManager) {
      window.manufacturingApp.socketManager.on("connected", () => {
        this.updateConnectionStatus();
      });

      window.manufacturingApp.socketManager.on("disconnected", () => {
        this.updateConnectionStatus();
      });
    }
  }

  handleUserMenuAction(action) {
    switch (action) {
      case "profile":
        this.showProfileModal();
        break;
      case "settings":
        this.showSettingsModal();
        break;
      case "users":
        if (window.manufacturingApp) {
          window.manufacturingApp.navigate("/admin/users");
        }
        break;
      case "system":
        this.showSystemSettingsModal();
        break;
      case "logout":
        this.authManager.logout();
        break;
    }
  }

  showProfileModal() {
    // TODO: Implement profile modal
    console.log("Profile modal not implemented yet");
  }

  showSettingsModal() {
    // TODO: Implement settings modal
    console.log("Settings modal not implemented yet");
  }

  showSystemSettingsModal() {
    // TODO: Implement system settings modal
    console.log("System settings modal not implemented yet");
  }

  showNotificationsPanel() {
    // TODO: Implement notifications panel
    console.log("Notifications panel not implemented yet");
  }

  // Update methods
  updateActiveRoute(route) {
    this.activeRoute = route;

    // Update active states
    document.querySelectorAll(".nav-link").forEach((link) => {
      const linkRoute = link.dataset.route;
      if (this.isActiveRoute(linkRoute)) {
        link.className = link.className.replace(
          "border-transparent text-gray-500",
          "border-blue-500 text-gray-900"
        );
      } else {
        link.className = link.className.replace(
          "border-blue-500 text-gray-900",
          "border-transparent text-gray-500"
        );
      }
    });

    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
      const linkRoute = link.dataset.route;
      if (this.isActiveRoute(linkRoute)) {
        link.className = link.className.replace(
          "text-gray-600",
          "text-blue-700 bg-blue-50"
        );
      } else {
        link.className = link.className.replace(
          "text-blue-700 bg-blue-50",
          "text-gray-600"
        );
      }
    });
  }

  updateNotificationButton() {
    const button = document.getElementById("notifications-button");
    if (button) {
      button.innerHTML = this.renderNotificationButton();
    }
  }

  updateConnectionStatus() {
    const statusElement = document.getElementById("connection-status");
    if (statusElement) {
      statusElement.innerHTML = this.renderConnectionStatus();
    }
  }

  isActiveRoute(route) {
    return (
      this.activeRoute === route ||
      (route === "/dashboard" && this.activeRoute === "/") ||
      this.activeRoute.startsWith(route + "/")
    );
  }

  // Factory mode optimizations
  enableFactoryMode() {
    if (this.container) {
      this.container.classList.add("factory-mode");
      // Increase touch targets
      this.container.querySelectorAll(".btn-touch").forEach((btn) => {
        btn.style.minHeight = "52px";
        btn.style.fontSize = "1.1em";
      });
    }
  }

  disableFactoryMode() {
    if (this.container) {
      this.container.classList.remove("factory-mode");
      // Reset touch targets
      this.container.querySelectorAll(".btn-touch").forEach((btn) => {
        btn.style.minHeight = "";
        btn.style.fontSize = "";
      });
    }
  }
}
