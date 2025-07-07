/**
 * Dashboard Component for Ganpathi Manufacturing Operations
 * Displays key metrics, recent activity, and system overview
 */

export class DashboardComponent {
  constructor(state, apiClient) {
    this.state = state;
    this.apiClient = apiClient;
    this.container = null;
    this.refreshInterval = null;
    this.charts = {};
  }

  async render(container) {
    this.container = container;

    // Show loading state
    this.renderLoading();

    try {
      // Load dashboard data
      await this.loadDashboardData();

      // Render main dashboard
      this.renderDashboard();

      // Setup refresh interval
      this.startAutoRefresh();
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      this.renderError(error.message);
    }
  }

  renderLoading() {
    this.container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="spinner mx-auto mb-4"></div>
                    <h2 class="text-lg font-semibold text-gray-700">Loading Dashboard...</h2>
                </div>
            </div>
        `;
  }

  renderError(message) {
    this.container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <h2 class="text-lg font-semibold text-gray-700 mb-2">Failed to Load Dashboard</h2>
                    <p class="text-gray-500 mb-4">${message}</p>
                    <button onclick="location.reload()" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 btn-touch">
                        <i class="fas fa-refresh mr-2"></i>
                        Retry
                    </button>
                </div>
            </div>
        `;
  }

  async loadDashboardData() {
    try {
      // Load data in parallel
      const [stats, recentJobs, inventoryAlerts] = await Promise.all([
        this.apiClient.getDashboardStats(),
        this.apiClient.getJobs({ limit: 5, sort: "-createdAt" }),
        this.apiClient
          .getInventoryItems()
          .then((items) =>
            items.filter((item) => item.currentQuantity <= item.minimumQuantity)
          ),
      ]);

      // Update state
      this.state.setDashboardStats(stats);

      return { stats, recentJobs, inventoryAlerts };
    } catch (error) {
      console.error("Dashboard data loading error:", error);
      throw error;
    }
  }

  renderDashboard() {
    const stats = this.state.getDashboardStats();
    const user = this.state.getCurrentUser();

    this.container.innerHTML = `
            <div class="py-6">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Header -->
                    <div class="md:flex md:items-center md:justify-between mb-8">
                        <div class="flex-1 min-w-0">
                            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                <i class="fas fa-tachometer-alt text-blue-600 mr-3"></i>
                                Dashboard
                            </h2>
                            <p class="mt-1 text-sm text-gray-500">
                                Welcome back, ${
                                  user?.name || "User"
                                }! Here's what's happening today.
                            </p>
                        </div>
                        <div class="mt-4 flex md:mt-0 md:ml-4">
                            <button id="refresh-dashboard" 
                                    class="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50 btn-touch">
                                <i class="fas fa-sync-alt mr-2"></i>
                                Refresh
                            </button>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        ${this.renderStatsCards(stats)}
                    </div>

                    <!-- Main Content Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Recent Activity -->
                        <div class="lg:col-span-2">
                            ${this.renderRecentActivity()}
                        </div>
                        
                        <!-- Sidebar -->
                        <div class="space-y-6">
                            ${this.renderInventoryAlerts()}
                            ${this.renderQuickActions()}
                        </div>
                    </div>

                    <!-- Charts Section -->
                    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${this.renderProductionChart()}
                        ${this.renderJobStatusChart()}
                    </div>
                </div>
            </div>
        `;

    this.setupEventListeners();
    this.renderCharts();
  }

  renderStatsCards(stats) {
    const cards = [
      {
        title: "Active Jobs",
        value: stats?.activeJobs || 0,
        change: stats?.jobsChange || 0,
        icon: "fas fa-tasks",
        color: "blue",
        href: "/jobs",
      },
      {
        title: "Pending Orders",
        value: stats?.pendingJobs || 0,
        change: stats?.pendingChange || 0,
        icon: "fas fa-clock",
        color: "yellow",
        href: "/jobs?status=pending",
      },
      {
        title: "Completed Today",
        value: stats?.completedToday || 0,
        change: stats?.completedChange || 0,
        icon: "fas fa-check-circle",
        color: "green",
        href: "/jobs?status=completed",
      },
      {
        title: "Low Stock Items",
        value: stats?.lowStockItems || 0,
        change: stats?.stockChange || 0,
        icon: "fas fa-exclamation-triangle",
        color: "red",
        href: "/inventory",
      },
    ];

    return cards
      .map(
        (card) => `
            <div class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                 onclick="window.manufacturingApp?.navigate('${card.href}')">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-${
                              card.color
                            }-100 rounded-md flex items-center justify-center">
                                <i class="${card.icon} text-${
          card.color
        }-600"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">
                                    ${card.title}
                                </dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">
                                        ${card.value}
                                    </div>
                                    ${
                                      card.change !== 0
                                        ? `
                                        <div class="ml-2 flex items-baseline text-sm font-semibold ${
                                          card.change > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }">
                                            <i class="fas fa-${
                                              card.change > 0
                                                ? "arrow-up"
                                                : "arrow-down"
                                            } mr-1"></i>
                                            ${Math.abs(card.change)}%
                                        </div>
                                    `
                                        : ""
                                    }
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderRecentActivity() {
    const recentJobs = this.state.getJobs().slice(0, 5);

    return `
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        <i class="fas fa-history text-gray-400 mr-2"></i>
                        Recent Activity
                    </h3>
                </div>
                <div class="divide-y divide-gray-200">
                    ${
                      recentJobs.length > 0
                        ? recentJobs
                            .map(
                              (job) => `
                        <div class="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                             onclick="window.manufacturingApp?.navigate('/jobs/${
                               job._id
                             }')">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClasses(
                                          job.status
                                        )}">
                                            ${job.status}
                                        </span>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-900">
                                            Job #${job.jobNumber}
                                        </p>
                                        <p class="text-sm text-gray-500">
                                            ${
                                              job.customer?.name ||
                                              "Unknown Customer"
                                            } • ${job.description}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex-shrink-0 text-sm text-gray-400">
                                    ${this.formatTimeAgo(job.createdAt)}
                                </div>
                            </div>
                        </div>
                    `
                            )
                            .join("")
                        : `
                        <div class="px-6 py-8 text-center">
                            <i class="fas fa-inbox text-gray-300 text-3xl mb-3"></i>
                            <p class="text-gray-500">No recent activity</p>
                        </div>
                    `
                    }
                </div>
                <div class="px-6 py-3 bg-gray-50">
                    <button onclick="window.manufacturingApp?.navigate('/jobs')"
                            class="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All Jobs
                        <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        `;
  }

  renderInventoryAlerts() {
    const lowStockItems = this.state.getLowStockItems();

    return `
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                        Inventory Alerts
                    </h3>
                </div>
                <div class="divide-y divide-gray-200">
                    ${
                      lowStockItems.length > 0
                        ? lowStockItems
                            .slice(0, 5)
                            .map(
                              (item) => `
                        <div class="px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">
                                        ${item.name}
                                    </p>
                                    <p class="text-sm text-red-600">
                                        Only ${item.currentQuantity} ${item.unit} left
                                    </p>
                                </div>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Low Stock
                                </span>
                            </div>
                        </div>
                    `
                            )
                            .join("")
                        : `
                        <div class="px-6 py-8 text-center">
                            <i class="fas fa-check-circle text-green-400 text-3xl mb-3"></i>
                            <p class="text-gray-500">All items in stock</p>
                        </div>
                    `
                    }
                </div>
                <div class="px-6 py-3 bg-gray-50">
                    <button onclick="window.manufacturingApp?.navigate('/inventory')"
                            class="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Manage Inventory
                        <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        `;
  }

  renderQuickActions() {
    const user = this.state.getCurrentUser();
    const actions = [];

    if (user?.role === "admin") {
      actions.push(
        {
          title: "Create New Job",
          icon: "fas fa-plus",
          action: "create-job",
          color: "blue",
        },
        {
          title: "Add Customer",
          icon: "fas fa-user-plus",
          action: "add-customer",
          color: "green",
        },
        {
          title: "Update Inventory",
          icon: "fas fa-box",
          action: "update-inventory",
          color: "purple",
        }
      );
    } else {
      actions.push(
        {
          title: "View My Tasks",
          icon: "fas fa-tasks",
          action: "my-tasks",
          color: "blue",
        },
        {
          title: "Report Issue",
          icon: "fas fa-exclamation-circle",
          action: "report-issue",
          color: "red",
        }
      );
    }

    return `
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        <i class="fas fa-bolt text-yellow-500 mr-2"></i>
                        Quick Actions
                    </h3>
                </div>
                <div class="p-6 space-y-3">
                    ${actions
                      .map(
                        (action) => `
                        <button class="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors btn-touch"
                                data-action="${action.action}">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-${action.color}-100 rounded-md flex items-center justify-center">
                                    <i class="${action.icon} text-${action.color}-600"></i>
                                </div>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-900">${action.title}</p>
                            </div>
                            <div class="ml-auto">
                                <i class="fas fa-chevron-right text-gray-400"></i>
                            </div>
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  renderProductionChart() {
    return `
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                        Production Trend (7 Days)
                    </h3>
                </div>
                <div class="p-6">
                    <div id="production-chart" class="h-64">
                        <div class="flex items-center justify-center h-full text-gray-500">
                            <i class="fas fa-chart-line text-3xl mb-2"></i>
                            <p>Production chart will be rendered here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderJobStatusChart() {
    return `
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        <i class="fas fa-chart-pie text-green-500 mr-2"></i>
                        Job Status Distribution
                    </h3>
                </div>
                <div class="p-6">
                    <div id="job-status-chart" class="h-64">
                        <div class="flex items-center justify-center h-full text-gray-500">
                            <i class="fas fa-chart-pie text-3xl mb-2"></i>
                            <p>Job status chart will be rendered here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    // Refresh button
    const refreshButton = document.getElementById("refresh-dashboard");
    refreshButton?.addEventListener("click", () => {
      this.refresh();
    });

    // Quick actions
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", (e) => {
        const action = e.target.closest("[data-action]").dataset.action;
        this.handleQuickAction(action);
      });
    });
  }

  handleQuickAction(action) {
    switch (action) {
      case "create-job":
        this.showCreateJobModal();
        break;
      case "add-customer":
        this.showAddCustomerModal();
        break;
      case "update-inventory":
        window.manufacturingApp?.navigate("/inventory");
        break;
      case "my-tasks":
        window.manufacturingApp?.navigate("/jobs?assignedTo=me");
        break;
      case "report-issue":
        this.showReportIssueModal();
        break;
    }
  }

  showCreateJobModal() {
    // TODO: Implement create job modal
    console.log("Create job modal not implemented yet");
    window.manufacturingApp?.navigate("/jobs/new");
  }

  showAddCustomerModal() {
    // TODO: Implement add customer modal
    console.log("Add customer modal not implemented yet");
    window.manufacturingApp?.navigate("/customers/new");
  }

  showReportIssueModal() {
    // TODO: Implement report issue modal
    console.log("Report issue modal not implemented yet");
  }

  renderCharts() {
    // Simple chart rendering using CSS - in production you'd use Chart.js or similar
    this.renderSimpleProductionChart();
    this.renderSimpleJobStatusChart();
  }

  renderSimpleProductionChart() {
    const chartContainer = document.getElementById("production-chart");
    if (!chartContainer) return;

    // Sample data for demonstration
    const data = [65, 75, 80, 85, 90, 85, 95];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    chartContainer.innerHTML = `
            <div class="flex items-end justify-between h-full space-x-2">
                ${data
                  .map(
                    (value, index) => `
                    <div class="flex flex-col items-center flex-1">
                        <div class="w-full bg-blue-500 rounded-t" style="height: ${value}%;"></div>
                        <span class="text-xs text-gray-500 mt-2">${days[index]}</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  renderSimpleJobStatusChart() {
    const chartContainer = document.getElementById("job-status-chart");
    if (!chartContainer) return;

    const stats = this.state.getDashboardStats();
    const data = [
      { label: "Pending", value: stats?.pendingJobs || 5, color: "yellow" },
      { label: "In Progress", value: stats?.activeJobs || 8, color: "blue" },
      { label: "Completed", value: stats?.completedJobs || 12, color: "green" },
      { label: "On Hold", value: stats?.onHoldJobs || 2, color: "gray" },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    chartContainer.innerHTML = `
            <div class="space-y-4">
                ${data
                  .map(
                    (item) => `
                    <div class="flex items-center">
                        <div class="w-4 h-4 bg-${
                          item.color
                        }-500 rounded mr-3"></div>
                        <span class="text-sm text-gray-700 flex-1">${
                          item.label
                        }</span>
                        <span class="text-sm font-medium text-gray-900">${
                          item.value
                        }</span>
                        <span class="text-xs text-gray-500 ml-2">(${Math.round(
                          (item.value / total) * 100
                        )}%)</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  // Utility methods
  getStatusBadgeClasses(status) {
    const classes = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      "on-hold": "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return classes[status] || classes["pending"];
  }

  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  // Auto refresh
  startAutoRefresh() {
    // Refresh dashboard every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 5 * 60 * 1000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async refresh() {
    try {
      const refreshButton = document.getElementById("refresh-dashboard");
      if (refreshButton) {
        refreshButton.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-2"></i>Refreshing...';
        refreshButton.disabled = true;
      }

      await this.loadDashboardData();
      this.renderDashboard();

      if (window.manufacturingApp) {
        window.manufacturingApp.showToast("Dashboard refreshed", "success");
      }
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
      if (window.manufacturingApp) {
        window.manufacturingApp.showToast(
          "Failed to refresh dashboard",
          "error"
        );
      }
    }
  }

  // Cleanup
  destroy() {
    this.stopAutoRefresh();
  }
}
