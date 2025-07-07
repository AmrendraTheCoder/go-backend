/**
 * Machine Operator Component for Ganpathi Manufacturing Operations
 * Tablet-optimized interface for machine operators on the shop floor
 */

export class MachineOperatorComponent {
  constructor(state, apiClient, socketManager) {
    this.state = state;
    this.apiClient = apiClient;
    this.socketManager = socketManager;
    this.container = null;
    this.currentJob = null;
    this.machineId = null;
    this.refreshInterval = null;
    this.camera = null;
  }

  async render(container, machineId) {
    this.container = container;
    this.machineId = machineId;

    // Enable factory mode for better visibility
    this.enableFactoryMode();

    // Show loading state
    this.renderLoading();

    try {
      // Load current job and machine data
      await this.loadOperatorData();

      // Render main interface
      this.renderOperatorInterface();

      // Setup real-time updates
      this.setupRealtimeUpdates();

      // Start auto-refresh
      this.startAutoRefresh();
    } catch (error) {
      console.error("Failed to load operator data:", error);
      this.renderError(error.message);
    }
  }

  renderLoading() {
    this.container.innerHTML = `
            <div class="min-h-screen bg-blue-50 flex items-center justify-center">
                <div class="text-center">
                    <div class="spinner mx-auto mb-6" style="width: 40px; height: 40px;"></div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Loading Machine Interface...</h2>
                    <p class="text-gray-600">Setting up your workspace</p>
                </div>
            </div>
        `;
  }

  renderError(message) {
    this.container.innerHTML = `
            <div class="min-h-screen bg-red-50 flex items-center justify-center p-6">
                <div class="text-center max-w-md">
                    <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-6"></i>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Machine Interface Error</h2>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <button onclick="location.reload()" 
                            class="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-red-700 btn-touch">
                        <i class="fas fa-refresh mr-3"></i>
                        Retry Loading
                    </button>
                </div>
            </div>
        `;
  }

  async loadOperatorData() {
    try {
      // Get current job assigned to this machine
      const jobs = await this.apiClient.getJobs({
        machineId: this.machineId,
        status: "in-progress",
      });

      this.currentJob = jobs.length > 0 ? jobs[0] : null;
    } catch (error) {
      console.error("Operator data loading error:", error);
      throw error;
    }
  }

  renderOperatorInterface() {
    const user = this.state.getCurrentUser();

    this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b-4 border-blue-500">
                    <div class="px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="bg-blue-600 p-3 rounded-lg mr-4">
                                    <i class="fas fa-cogs text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h1 class="text-2xl font-bold text-gray-900">Machine ${
                                      this.machineId
                                    }</h1>
                                    <p class="text-gray-600">Operator: ${
                                      user?.name || "Unknown"
                                    }</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-4">
                                <div id="connection-indicator" class="flex items-center">
                                    ${this.renderConnectionIndicator()}
                                </div>
                                <button id="emergency-stop" 
                                        class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-700 btn-touch">
                                    <i class="fas fa-stop mr-2"></i>
                                    EMERGENCY STOP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="p-6 space-y-6">
                    ${
                      this.currentJob
                        ? this.renderCurrentJob()
                        : this.renderNoJob()
                    }
                </div>
            </div>
        `;

    this.setupEventListeners();
  }

  renderConnectionIndicator() {
    const isConnected = this.socketManager?.isConnected() || false;

    return `
            <div class="flex items-center ${
              isConnected ? "text-green-600" : "text-red-600"
            }">
                <div class="w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                } mr-2"></div>
                <span class="font-medium">${
                  isConnected ? "ONLINE" : "OFFLINE"
                }</span>
            </div>
        `;
  }

  renderCurrentJob() {
    const job = this.currentJob;

    return `
            <!-- Current Job Card -->
            <div class="bg-white rounded-2xl shadow-lg p-8">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900">Job #${
                          job.jobNumber
                        }</h2>
                        <p class="text-xl text-gray-600">${
                          job.customer?.name || "Unknown Customer"
                        }</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-blue-100 text-blue-800">
                            <i class="fas fa-play mr-2"></i>
                            IN PROGRESS
                        </span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Job Details</h3>
                        <div class="space-y-2">
                            <p><span class="font-medium">Description:</span> ${
                              job.description
                            }</p>
                            <p><span class="font-medium">Quantity:</span> ${
                              job.quantity
                            }</p>
                            <p><span class="font-medium">Paper Type:</span> ${
                              job.paperType?.name || "Not specified"
                            }</p>
                            <p><span class="font-medium">Due Date:</span> ${this.formatDate(
                              job.dueDate
                            )}</p>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Progress</h3>
                        <div class="space-y-4">
                            ${this.renderJobProgress(job)}
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-4">
                    <button id="update-status" 
                            class="flex-1 bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-green-700 btn-touch">
                        <i class="fas fa-check mr-3"></i>
                        Update Status
                    </button>
                    <button id="add-photo" 
                            class="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-blue-700 btn-touch">
                        <i class="fas fa-camera mr-3"></i>
                        Add Photo
                    </button>
                    <button id="report-issue" 
                            class="flex-1 bg-yellow-600 text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-yellow-700 btn-touch">
                        <i class="fas fa-exclamation-triangle mr-3"></i>
                        Report Issue
                    </button>
                </div>
            </div>

            <!-- Process Sections -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${this.renderProcessSections(job)}
            </div>
        `;
  }

  renderNoJob() {
    return `
            <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div class="mb-8">
                    <i class="fas fa-inbox text-gray-300 text-8xl mb-6"></i>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">No Active Job</h2>
                    <p class="text-xl text-gray-600 mb-8">This machine is currently not assigned to any job.</p>
                </div>
                
                <div class="flex justify-center space-x-6">
                    <button id="check-jobs" 
                            class="bg-blue-600 text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-blue-700 btn-touch">
                        <i class="fas fa-search mr-3"></i>
                        Check for Jobs
                    </button>
                    <button id="machine-maintenance" 
                            class="bg-gray-600 text-white py-4 px-8 rounded-xl text-lg font-medium hover:bg-gray-700 btn-touch">
                        <i class="fas fa-tools mr-3"></i>
                        Maintenance Mode
                    </button>
                </div>
            </div>
        `;
  }

  renderJobProgress(job) {
    const sections = ["pre_press", "printing", "finishing", "quality_check"];
    const sectionNames = {
      pre_press: "Pre-Press",
      printing: "Printing",
      finishing: "Finishing",
      quality_check: "Quality Check",
    };

    return sections
      .map((section) => {
        const sectionData = job.sections?.[section] || {};
        const isCompleted = sectionData.completed || false;
        const isActive = job.currentSection === section;

        return `
                <div class="flex items-center">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500"
                        : isActive
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }">
                        <i class="fas ${
                          isCompleted
                            ? "fa-check"
                            : isActive
                            ? "fa-play"
                            : "fa-circle"
                        } text-white"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium ${
                          isCompleted
                            ? "text-green-800"
                            : isActive
                            ? "text-blue-800"
                            : "text-gray-600"
                        }">
                            ${sectionNames[section]}
                        </p>
                        <p class="text-xs text-gray-500">
                            ${
                              isCompleted
                                ? "Completed"
                                : isActive
                                ? "In Progress"
                                : "Pending"
                            }
                        </p>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderProcessSections(job) {
    const sections = [
      {
        id: "pre_press",
        title: "Pre-Press Setup",
        icon: "fas fa-cog",
        color: "purple",
        items: ["File Preparation", "Color Matching", "Plate Setup"],
      },
      {
        id: "printing",
        title: "Printing Process",
        icon: "fas fa-print",
        color: "blue",
        items: ["Press Setup", "Quality Monitoring", "Color Consistency"],
      },
      {
        id: "finishing",
        title: "Finishing Work",
        icon: "fas fa-cut",
        color: "green",
        items: ["Cutting", "Binding", "Packaging"],
      },
      {
        id: "quality_check",
        title: "Quality Control",
        icon: "fas fa-search",
        color: "red",
        items: ["Visual Inspection", "Measurements", "Final Approval"],
      },
    ];

    return sections
      .map((section) => {
        const sectionData = job.sections?.[section.id] || {};
        const isActive = job.currentSection === section.id;
        const isCompleted = sectionData.completed || false;

        return `
                <div class="bg-white rounded-xl shadow p-6 ${
                  isActive ? "ring-2 ring-blue-500" : ""
                }">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 bg-${
                          section.color
                        }-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="${section.icon} text-${
          section.color
        }-600"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">${
                              section.title
                            }</h3>
                            <p class="text-sm ${
                              isCompleted
                                ? "text-green-600"
                                : isActive
                                ? "text-blue-600"
                                : "text-gray-500"
                            }">
                                ${
                                  isCompleted
                                    ? "Completed"
                                    : isActive
                                    ? "Current Step"
                                    : "Pending"
                                }
                            </p>
                        </div>
                        ${
                          isCompleted
                            ? '<i class="fas fa-check-circle text-green-500 text-xl"></i>'
                            : ""
                        }
                    </div>
                    
                    <ul class="space-y-2 mb-4">
                        ${section.items
                          .map(
                            (item) => `
                            <li class="flex items-center text-sm">
                                <i class="fas fa-circle text-gray-300 text-xs mr-2"></i>
                                ${item}
                            </li>
                        `
                          )
                          .join("")}
                    </ul>
                    
                    ${
                      isActive && !isCompleted
                        ? `
                        <button class="section-complete w-full bg-${section.color}-600 text-white py-3 rounded-lg font-medium hover:bg-${section.color}-700 btn-touch"
                                data-section="${section.id}">
                            <i class="fas fa-check mr-2"></i>
                            Complete ${section.title}
                        </button>
                    `
                        : ""
                    }
                </div>
            `;
      })
      .join("");
  }

  setupEventListeners() {
    // Emergency stop
    const emergencyStop = document.getElementById("emergency-stop");
    emergencyStop?.addEventListener("click", () => {
      this.handleEmergencyStop();
    });

    // Job actions
    const updateStatus = document.getElementById("update-status");
    updateStatus?.addEventListener("click", () => {
      this.showUpdateStatusModal();
    });

    const addPhoto = document.getElementById("add-photo");
    addPhoto?.addEventListener("click", () => {
      this.showPhotoCapture();
    });

    const reportIssue = document.getElementById("report-issue");
    reportIssue?.addEventListener("click", () => {
      this.showReportIssueModal();
    });

    // No job actions
    const checkJobs = document.getElementById("check-jobs");
    checkJobs?.addEventListener("click", () => {
      this.checkForNewJobs();
    });

    const maintenance = document.getElementById("machine-maintenance");
    maintenance?.addEventListener("click", () => {
      this.enterMaintenanceMode();
    });

    // Section completion
    document.querySelectorAll(".section-complete").forEach((button) => {
      button.addEventListener("click", (e) => {
        const section = e.target.closest(".section-complete").dataset.section;
        this.completeSection(section);
      });
    });
  }

  setupRealtimeUpdates() {
    if (this.socketManager) {
      // Join machine-specific room
      this.socketManager.joinRoom(`machine_${this.machineId}`);

      // Listen for job updates
      this.socketManager.on("job_assignment", (data) => {
        if (data.machineId === this.machineId) {
          this.currentJob = data.job;
          this.renderOperatorInterface();
          this.showNotification("New job assigned!", "info");
        }
      });

      this.socketManager.on("job_status_update", (data) => {
        if (this.currentJob && data.jobId === this.currentJob._id) {
          this.loadOperatorData().then(() => {
            this.renderOperatorInterface();
          });
        }
      });
    }
  }

  // Action handlers
  async handleEmergencyStop() {
    const confirmed = confirm(
      "⚠️ EMERGENCY STOP\n\nThis will immediately halt all operations on this machine.\n\nAre you sure?"
    );

    if (confirmed) {
      try {
        await this.socketManager?.updateMachineStatus(
          this.machineId,
          "emergency_stop",
          this.state.getCurrentUser()._id
        );
        this.showNotification("Emergency stop activated", "error");

        // Disable all controls
        this.container
          .querySelectorAll("button:not(#emergency-stop)")
          .forEach((btn) => {
            btn.disabled = true;
            btn.classList.add("opacity-50");
          });
      } catch (error) {
        this.showNotification("Failed to activate emergency stop", "error");
      }
    }
  }

  showUpdateStatusModal() {
    // Simple status update modal
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">Update Job Status</h3>
                <div class="space-y-4">
                    <button class="status-option w-full p-4 text-left border rounded-lg hover:bg-gray-50" data-status="in-progress">
                        <i class="fas fa-play text-blue-600 mr-3"></i>
                        Continue Progress
                    </button>
                    <button class="status-option w-full p-4 text-left border rounded-lg hover:bg-gray-50" data-status="on-hold">
                        <i class="fas fa-pause text-yellow-600 mr-3"></i>
                        Put On Hold
                    </button>
                    <button class="status-option w-full p-4 text-left border rounded-lg hover:bg-gray-50" data-status="completed">
                        <i class="fas fa-check text-green-600 mr-3"></i>
                        Mark Complete
                    </button>
                </div>
                <div class="flex space-x-4 mt-6">
                    <button id="cancel-status" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg">Cancel</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Event listeners
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "cancel-status") {
        document.body.removeChild(modal);
      }
    });

    modal.querySelectorAll(".status-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const status = e.target.closest(".status-option").dataset.status;
        this.updateJobStatus(status);
        document.body.removeChild(modal);
      });
    });
  }

  async showPhotoCapture() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50";
      modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                    <div class="text-center mb-4">
                        <h3 class="text-xl font-bold text-gray-900">Capture Photo</h3>
                        <p class="text-gray-600">Take a photo of current work progress</p>
                    </div>
                    <video id="camera-video" class="w-full rounded-lg mb-4" autoplay playsinline></video>
                    <canvas id="photo-canvas" class="hidden"></canvas>
                    <div class="flex space-x-4">
                        <button id="capture-photo" class="flex-1 bg-blue-600 text-white py-3 rounded-lg">
                            <i class="fas fa-camera mr-2"></i>Capture
                        </button>
                        <button id="close-camera" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg">Cancel</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      const video = modal.querySelector("#camera-video");
      video.srcObject = stream;

      // Close camera
      modal.querySelector("#close-camera").addEventListener("click", () => {
        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(modal);
      });

      // Capture photo
      modal.querySelector("#capture-photo").addEventListener("click", () => {
        this.capturePhoto(video, stream);
        document.body.removeChild(modal);
      });
    } catch (error) {
      console.error("Camera access denied:", error);
      this.showNotification(
        "Camera access denied. Please check permissions.",
        "error"
      );
    }
  }

  capturePhoto(video, stream) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Convert to blob and upload
    canvas.toBlob(
      async (blob) => {
        try {
          const file = new File(
            [blob],
            `job_${this.currentJob._id}_${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );
          await this.apiClient.uploadJobPhoto(
            this.currentJob._id,
            this.currentJob.currentSection,
            file
          );
          this.showNotification("Photo uploaded successfully", "success");
        } catch (error) {
          console.error("Photo upload failed:", error);
          this.showNotification("Failed to upload photo", "error");
        }
      },
      "image/jpeg",
      0.8
    );

    // Stop camera
    stream.getTracks().forEach((track) => track.stop());
  }

  async updateJobStatus(status) {
    try {
      await this.apiClient.updateJobStatus(this.currentJob._id, status);
      this.showNotification(`Job status updated to ${status}`, "success");

      // Refresh interface
      await this.loadOperatorData();
      this.renderOperatorInterface();
    } catch (error) {
      console.error("Status update failed:", error);
      this.showNotification("Failed to update job status", "error");
    }
  }

  async completeSection(sectionId) {
    try {
      const sectionData = {
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await this.apiClient.updateJobStatus(this.currentJob._id, "in-progress", {
        [sectionId]: sectionData,
      });

      this.showNotification(
        `${sectionId.replace("_", " ")} section completed`,
        "success"
      );

      // Refresh interface
      await this.loadOperatorData();
      this.renderOperatorInterface();
    } catch (error) {
      console.error("Section completion failed:", error);
      this.showNotification("Failed to complete section", "error");
    }
  }

  // Utility methods
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  showNotification(message, type) {
    if (window.manufacturingApp) {
      window.manufacturingApp.showToast(message, type);
    }
  }

  enableFactoryMode() {
    if (this.container) {
      this.container.classList.add("factory-mode");
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadOperatorData().then(() => {
        this.renderOperatorInterface();
      });
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  destroy() {
    this.stopAutoRefresh();
    if (this.socketManager) {
      this.socketManager.leaveRoom(`machine_${this.machineId}`);
    }
  }
}
