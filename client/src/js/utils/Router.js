/**
 * Router for Ganpathi Manufacturing Operations
 * Handles client-side routing with hash-based navigation
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.middlewares = [];
    this.currentRoute = null;
    this.currentParams = null;
    this.history = [];
    this.routeChangeCallbacks = [];
  }

  // Route registration
  addRoute(path, handler, middleware = []) {
    const routePattern = this.pathToRegex(path);
    this.routes.set(path, {
      pattern: routePattern,
      handler,
      middleware: Array.isArray(middleware) ? middleware : [middleware],
      originalPath: path,
    });
  }

  // Middleware registration
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Convert path pattern to regex
  pathToRegex(path) {
    const parameterNames = [];
    const regexString = path
      .replace(/\//g, "\\/")
      .replace(/:([^\/]+)/g, (match, paramName) => {
        parameterNames.push(paramName);
        return "([^/]+)";
      })
      .replace(/\*/g, ".*");

    return {
      regex: new RegExp(`^${regexString}$`),
      parameterNames,
    };
  }

  // Extract parameters from URL
  extractParams(path, routeInfo) {
    const match = path.match(routeInfo.pattern.regex);
    if (!match) return {};

    const params = {};
    routeInfo.pattern.parameterNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }

  // Navigation
  navigate(path, replace = false) {
    if (replace) {
      window.location.replace(`#${path}`);
    } else {
      window.location.hash = `#${path}`;
    }
  }

  // Go back in history
  back() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current
      const previous = this.history[this.history.length - 1];
      this.navigate(previous, true);
    } else {
      this.navigate("/", true);
    }
  }

  // Get current path
  getCurrentPath() {
    const hash = window.location.hash;
    return hash.startsWith("#") ? hash.slice(1) : "/";
  }

  // Route matching
  findMatchingRoute(path) {
    for (const [routePath, routeInfo] of this.routes) {
      const params = this.extractParams(path, routeInfo);
      if (routeInfo.pattern.regex.test(path)) {
        return {
          route: routeInfo,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  // Execute middleware chain
  async executeMiddleware(middlewares, context) {
    for (const middleware of middlewares) {
      try {
        const result = await middleware(context);
        if (result === false) {
          return false; // Stop execution
        }
      } catch (error) {
        console.error("Middleware error:", error);
        return false;
      }
    }
    return true;
  }

  // Route handler execution
  async handleRoute(path) {
    console.log(`🧭 Navigating to: ${path}`);

    const match = this.findMatchingRoute(path);
    if (!match) {
      console.warn(`❌ No route found for: ${path}`);
      this.handle404(path);
      return;
    }

    const context = {
      path,
      params: match.params,
      route: match.route,
      router: this,
    };

    try {
      // Execute global middleware
      const globalMiddlewareSuccess = await this.executeMiddleware(
        this.middlewares,
        context
      );
      if (!globalMiddlewareSuccess) {
        console.log("🚫 Global middleware blocked navigation");
        return;
      }

      // Execute route-specific middleware
      const routeMiddlewareSuccess = await this.executeMiddleware(
        match.route.middleware,
        context
      );
      if (!routeMiddlewareSuccess) {
        console.log("🚫 Route middleware blocked navigation");
        return;
      }

      // Execute route handler
      await match.route.handler(match.params, context);

      // Update current route info
      this.currentRoute = path;
      this.currentParams = match.params;

      // Add to history
      if (this.history[this.history.length - 1] !== path) {
        this.history.push(path);

        // Limit history size
        if (this.history.length > 50) {
          this.history.shift();
        }
      }

      // Notify route change callbacks
      this.notifyRouteChange(path, match.params);
    } catch (error) {
      console.error("❌ Route handler error:", error);
      this.handleError(error, context);
    }
  }

  // 404 handler
  handle404(path) {
    console.log(`🔍 404: ${path} - redirecting to dashboard`);
    this.navigate("/dashboard", true);
  }

  // Error handler
  handleError(error, context) {
    console.error("Router error:", error);

    // Try to show error page or redirect to safe route
    if (context.path !== "/dashboard") {
      this.navigate("/dashboard", true);
    }

    // Show error notification if available
    if (window.manufacturingApp) {
      window.manufacturingApp.showToast("Navigation error occurred", "error");
    }
  }

  // Route change listeners
  onRouteChange(callback) {
    this.routeChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.routeChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.routeChangeCallbacks.splice(index, 1);
      }
    };
  }

  notifyRouteChange(path, params) {
    this.routeChangeCallbacks.forEach((callback) => {
      try {
        callback(path, params);
      } catch (error) {
        console.error("Route change callback error:", error);
      }
    });
  }

  // Initialize router
  init() {
    console.log("🧭 Initializing Router...");

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      const path = this.getCurrentPath();
      this.handleRoute(path);
    });

    // Listen for popstate (back/forward buttons)
    window.addEventListener("popstate", () => {
      const path = this.getCurrentPath();
      this.handleRoute(path);
    });

    // Handle initial route
    this.handleCurrentRoute();
  }

  // Handle current route on page load
  handleCurrentRoute() {
    const path = this.getCurrentPath();
    if (!path || path === "" || path === "/") {
      this.navigate("/dashboard", true);
    } else {
      this.handleRoute(path);
    }
  }

  // Utility methods
  isCurrentRoute(path) {
    return this.currentRoute === path;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getCurrentParams() {
    return this.currentParams || {};
  }

  getHistory() {
    return [...this.history];
  }

  // Query parameters
  getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  }

  setQueryParams(params) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlParams.set(key, value);
      }
    });

    const queryString = urlParams.toString();
    const currentPath = this.getCurrentPath();
    const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;

    window.history.replaceState(null, "", `#${newUrl}`);
  }

  // Route guards/middleware
  requireAuth() {
    return (context) => {
      const isAuthenticated = localStorage.getItem("authToken");
      if (!isAuthenticated) {
        console.log("🔒 Authentication required - redirecting to login");
        this.navigate("/login", true);
        return false;
      }
      return true;
    };
  }

  requireRole(role) {
    return (context) => {
      const currentUser = window.manufacturingApp?.getState().getCurrentUser();
      if (!currentUser || currentUser.role !== role) {
        console.log(`🔒 Role ${role} required - access denied`);
        this.navigate("/dashboard", true);
        return false;
      }
      return true;
    };
  }

  requireAdmin() {
    return this.requireRole("admin");
  }

  // Debug methods
  debug() {
    console.log("Router Debug Info:");
    console.log("Current Route:", this.currentRoute);
    console.log("Current Params:", this.currentParams);
    console.log("Registered Routes:", Array.from(this.routes.keys()));
    console.log("History:", this.history);
    console.log("Middlewares:", this.middlewares.length);
  }
}
