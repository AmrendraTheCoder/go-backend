/**
 * Jobs Management Component
 * Handles job creation, approval workflow, queue management, and status tracking
 */
export class JobsComponent {
  constructor(stateManager, apiClient) {
    this.state = stateManager;
    this.api = apiClient;
    this.currentView = "queue"; // queue, create, detail
    this.selectedJob = null;
    this.jobs = [];
    this.filters = {
      status: "all",
      machine: "all",
      priority: "all",
    };
  }

  async render(container) {
    try {
      // Load jobs data
      await this.loadJobs();

      container.innerHTML = `
        <div class="p-4 lg:p-6 max-w-7xl mx-auto">
          <!-- Page Header -->
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Job Management</h1>
              <p class="text-gray-600">Manage printing jobs, approvals, and production queue</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <button 
                id="refresh-jobs" 
                class="btn-touch px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-sync-alt"></i>
                <span>Refresh</span>
              </button>
              <button 
                id="create-job-btn" 
                class="btn-touch px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-plus"></i>
                <span>New Job</span>
              </button>
            </div>
          </div>

          <!-- Filters and Stats -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div class="p-4 border-b border-gray-200">
              <div class="flex flex-col lg:flex-row gap-4">
                <!-- Filters -->
                <div class="flex flex-wrap gap-3">
                  <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Status</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <select id="machine-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Machines</option>
                    <option value="machine-1">Machine 1</option>
                    <option value="machine-2">Machine 2</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                  
                  <select id="priority-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                
                <!-- Search -->
                <div class="flex-1 max-w-md">
                  <input 
                    type="text" 
                    id="job-search" 
                    placeholder="Search jobs by ID, customer, or description..." 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                </div>
              </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="p-4 grid grid-cols-2 lg:grid-cols-5 gap-4" id="job-stats">
              <!-- Stats will be populated dynamically -->
            </div>
          </div>

          <!-- Jobs List -->
          <div class="space-y-4" id="jobs-container">
            <!-- Jobs will be populated here -->
          </div>

          <!-- Empty State -->
          <div id="empty-state" class="hidden text-center py-12">
            <i class="fas fa-clipboard-list text-gray-400 text-6xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p class="text-gray-600 mb-6">Get started by creating your first job</p>
            <button 
              id="create-first-job" 
              class="btn-touch px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
            >
              Create First Job
            </button>
          </div>
        </div>

        <!-- Job Detail Modal -->
        <div id="job-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="job-modal-title" class="text-xl font-semibold text-gray-900">Job Details</h2>
              <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="job-modal-content" class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <!-- Job details will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Job Creation/Edit Form Modal -->
        <div id="job-form-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="job-form-title" class="text-xl font-semibold text-gray-900">Create New Job</h2>
              <button id="close-form-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="job-form-content" class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <!-- Job form will be loaded here -->
            </div>
          </div>
        </div>
      `;

      this.attachEventListeners();
      this.renderJobs();
      this.updateStats();
    } catch (error) {
      console.error("Error rendering jobs component:", error);
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h3>
          <p class="text-gray-600">Please try refreshing the page</p>
        </div>
      `;
    }
  }

  async loadJobs() {
    try {
      const response = await this.api.get("/jobs");
      this.jobs = response.data || [];
      this.state.set("jobs", this.jobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      this.jobs = [];
    }
  }

  renderJobs() {
    const container = document.getElementById("jobs-container");
    const emptyState = document.getElementById("empty-state");

    const filteredJobs = this.filterJobs();

    if (filteredJobs.length === 0) {
      container.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    container.classList.remove("hidden");
    emptyState.classList.add("hidden");

    container.innerHTML = filteredJobs
      .map((job) => this.createJobCard(job))
      .join("");
  }

  createJobCard(job) {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const priorityColors = {
      high: "text-red-600",
      medium: "text-yellow-600",
      low: "text-green-600",
    };

    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer job-card" data-job-id="${
        job._id
      }">
        <div class="p-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">Job #${
                  job.jobId || job._id.slice(-6)
                }</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                  statusColors[job.status] || "bg-gray-100 text-gray-800"
                }">
                  ${job.status || "Unknown"}
                </span>
                <span class="text-sm ${
                  priorityColors[job.priority] || "text-gray-600"
                }">
                  <i class="fas fa-flag"></i> ${
                    job.priority || "Medium"
                  } Priority
                </span>
              </div>
              
              <div class="flex flex-col lg:flex-row lg:items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <i class="fas fa-user"></i>
                  <span>${
                    job.customer?.name || job.customerName || "Unknown Customer"
                  }</span>
                </div>
                <div class="flex items-center gap-1">
                  <i class="fas fa-file-alt"></i>
                  <span>${job.description || "No description"}</span>
                </div>
                <div class="flex items-center gap-1">
                  <i class="fas fa-calendar"></i>
                  <span>${
                    job.dueDate
                      ? new Date(job.dueDate).toLocaleDateString()
                      : "No due date"
                  }</span>
                </div>
                ${
                  job.assignedMachine
                    ? `
                  <div class="flex items-center gap-1">
                    <i class="fas fa-cogs"></i>
                    <span>${job.assignedMachine}</span>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
            
            <div class="flex items-center gap-3 mt-4 lg:mt-0">
              ${
                job.status === "pending"
                  ? `
                <button class="approve-job-btn btn-touch px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium" data-job-id="${job._id}">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button class="reject-job-btn btn-touch px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium" data-job-id="${job._id}">
                  <i class="fas fa-times"></i> Reject
                </button>
              `
                  : ""
              }
              
              <button class="view-job-btn btn-touch px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium" data-job-id="${
                job._id
              }">
                <i class="fas fa-eye"></i> View
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  filterJobs() {
    return this.jobs.filter((job) => {
      const matchesStatus =
        this.filters.status === "all" || job.status === this.filters.status;
      const matchesMachine =
        this.filters.machine === "all" ||
        (this.filters.machine === "unassigned" && !job.assignedMachine) ||
        job.assignedMachine === this.filters.machine;
      const matchesPriority =
        this.filters.priority === "all" ||
        job.priority === this.filters.priority;

      const searchTerm =
        document.getElementById("job-search")?.value.toLowerCase() || "";
      const matchesSearch =
        !searchTerm ||
        job.jobId?.toLowerCase().includes(searchTerm) ||
        job._id?.toLowerCase().includes(searchTerm) ||
        job.customerName?.toLowerCase().includes(searchTerm) ||
        job.customer?.name?.toLowerCase().includes(searchTerm) ||
        job.description?.toLowerCase().includes(searchTerm);

      return (
        matchesStatus && matchesMachine && matchesPriority && matchesSearch
      );
    });
  }

  updateStats() {
    const statsContainer = document.getElementById("job-stats");
    if (!statsContainer) return;

    const stats = {
      total: this.jobs.length,
      pending: this.jobs.filter((j) => j.status === "pending").length,
      approved: this.jobs.filter((j) => j.status === "approved").length,
      inProgress: this.jobs.filter((j) => j.status === "in-progress").length,
      completed: this.jobs.filter((j) => j.status === "completed").length,
    };

    statsContainer.innerHTML = `
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">${stats.total}</div>
        <div class="text-sm text-gray-600">Total Jobs</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-600">${stats.pending}</div>
        <div class="text-sm text-gray-600">Pending</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">${stats.approved}</div>
        <div class="text-sm text-gray-600">Approved</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">${stats.inProgress}</div>
        <div class="text-sm text-gray-600">In Progress</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-600">${stats.completed}</div>
        <div class="text-sm text-gray-600">Completed</div>
      </div>
    `;
  }

  attachEventListeners() {
    // Filter change handlers
    document
      .getElementById("status-filter")
      ?.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.renderJobs();
      });

    document
      .getElementById("machine-filter")
      ?.addEventListener("change", (e) => {
        this.filters.machine = e.target.value;
        this.renderJobs();
      });

    document
      .getElementById("priority-filter")
      ?.addEventListener("change", (e) => {
        this.filters.priority = e.target.value;
        this.renderJobs();
      });

    // Search handler
    document.getElementById("job-search")?.addEventListener("input", () => {
      this.renderJobs();
    });

    // Refresh button
    document
      .getElementById("refresh-jobs")
      ?.addEventListener("click", async () => {
        await this.loadJobs();
        this.renderJobs();
        this.updateStats();
      });

    // Create job buttons
    document.getElementById("create-job-btn")?.addEventListener("click", () => {
      this.showJobForm();
    });

    document
      .getElementById("create-first-job")
      ?.addEventListener("click", () => {
        this.showJobForm();
      });

    // Modal close buttons
    document.getElementById("close-modal")?.addEventListener("click", () => {
      this.hideJobModal();
    });

    document
      .getElementById("close-form-modal")
      ?.addEventListener("click", () => {
        this.hideJobForm();
      });

    // Job action buttons (delegated events)
    document.addEventListener("click", (e) => {
      if (e.target.closest(".job-card")) {
        const jobId = e.target.closest(".job-card").dataset.jobId;
        this.showJobDetail(jobId);
      } else if (e.target.closest(".view-job-btn")) {
        e.stopPropagation();
        const jobId = e.target.closest(".view-job-btn").dataset.jobId;
        this.showJobDetail(jobId);
      } else if (e.target.closest(".approve-job-btn")) {
        e.stopPropagation();
        const jobId = e.target.closest(".approve-job-btn").dataset.jobId;
        this.approveJob(jobId);
      } else if (e.target.closest(".reject-job-btn")) {
        e.stopPropagation();
        const jobId = e.target.closest(".reject-job-btn").dataset.jobId;
        this.rejectJob(jobId);
      }
    });
  }

  showJobDetail(jobId) {
    const job = this.jobs.find((j) => j._id === jobId);
    if (!job) return;

    const modal = document.getElementById("job-modal");
    const content = document.getElementById("job-modal-content");

    content.innerHTML = this.createJobDetailView(job);
    modal.classList.remove("hidden");
  }

  createJobDetailView(job) {
    return `
      <div class="space-y-6">
        <!-- Job Header -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Job #${
              job.jobId || job._id.slice(-6)
            }</h3>
            <p class="text-gray-600">${job.description || "No description"}</p>
          </div>
          <span class="px-3 py-1 text-sm font-medium rounded-full ${this.getStatusColor(
            job.status
          )}">
            ${job.status || "Unknown"}
          </span>
        </div>

        <!-- Job Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Customer Information</h4>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-600">Name:</span> ${
                job.customer?.name || job.customerName || "Unknown"
              }</div>
              <div><span class="text-gray-600">Contact:</span> ${
                job.customer?.contact || job.customerContact || "N/A"
              }</div>
              <div><span class="text-gray-600">Address:</span> ${
                job.customer?.address || job.customerAddress || "N/A"
              }</div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 mb-3">Job Details</h4>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-600">Priority:</span> ${
                job.priority || "Medium"
              }</div>
              <div><span class="text-gray-600">Due Date:</span> ${
                job.dueDate
                  ? new Date(job.dueDate).toLocaleDateString()
                  : "Not set"
              }</div>
              <div><span class="text-gray-600">Machine:</span> ${
                job.assignedMachine || "Not assigned"
              }</div>
              <div><span class="text-gray-600">Quantity:</span> ${
                job.quantity || "N/A"
              }</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          ${
            job.status === "pending"
              ? `
            <button class="approve-job-btn px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium" data-job-id="${job._id}">
              <i class="fas fa-check mr-2"></i>Approve Job
            </button>
            <button class="reject-job-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium" data-job-id="${job._id}">
              <i class="fas fa-times mr-2"></i>Reject Job
            </button>
          `
              : ""
          }
          <button class="edit-job-btn px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium" data-job-id="${
            job._id
          }">
            <i class="fas fa-edit mr-2"></i>Edit Job
          </button>
        </div>
      </div>
    `;
  }

  showJobForm(job = null) {
    const modal = document.getElementById("job-form-modal");
    const title = document.getElementById("job-form-title");
    const content = document.getElementById("job-form-content");

    title.textContent = job ? "Edit Job" : "Create New Job";
    content.innerHTML = this.createJobFormView(job);
    modal.classList.remove("hidden");
  }

  createJobFormView(job = null) {
    return `
      <form id="job-form" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input type="text" id="customer-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${job?.customerName || ""}" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select id="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="low" ${
                job?.priority === "low" ? "selected" : ""
              }>Low</option>
              <option value="medium" ${
                job?.priority === "medium" || !job?.priority ? "selected" : ""
              }>Medium</option>
              <option value="high" ${
                job?.priority === "high" ? "selected" : ""
              }>High</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea id="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                    required>${job?.description || ""}</textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input type="number" id="quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${job?.quantity || ""}" min="1">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input type="date" id="due-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${
                     job?.dueDate
                       ? new Date(job.dueDate).toISOString().split("T")[0]
                       : ""
                   }">
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" id="cancel-job-form" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
            ${job ? "Update Job" : "Create Job"}
          </button>
        </div>
      </form>
    `;
  }

  async approveJob(jobId) {
    try {
      await this.api.put(`/jobs/${jobId}/approve`);
      await this.loadJobs();
      this.renderJobs();
      this.updateStats();
      this.hideJobModal();
    } catch (error) {
      console.error("Error approving job:", error);
    }
  }

  async rejectJob(jobId) {
    try {
      await this.api.put(`/jobs/${jobId}/reject`);
      await this.loadJobs();
      this.renderJobs();
      this.updateStats();
      this.hideJobModal();
    } catch (error) {
      console.error("Error rejecting job:", error);
    }
  }

  hideJobModal() {
    document.getElementById("job-modal")?.classList.add("hidden");
  }

  hideJobForm() {
    document.getElementById("job-form-modal")?.classList.add("hidden");
  }

  getStatusColor(status) {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  // Public method to refresh component
  async refresh() {
    await this.loadJobs();
    this.renderJobs();
    this.updateStats();
  }
}
