/**
 * Customer Management Component
 * Handles customer CRUD operations, job history, balance tracking, and contact management
 */
export class CustomersComponent {
  constructor(stateManager, apiClient) {
    this.state = stateManager;
    this.api = apiClient;
    this.customers = [];
    this.selectedCustomer = null;
    this.filters = {
      status: "all",
      balance: "all",
    };
    this.sortBy = "name";
    this.sortOrder = "asc";
  }

  async render(container) {
    try {
      // Load customers data
      await this.loadCustomers();

      container.innerHTML = `
        <div class="p-4 lg:p-6 max-w-7xl mx-auto">
          <!-- Page Header -->
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p class="text-gray-600">Manage customer information, contacts, and business relationships</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <button 
                id="refresh-customers" 
                class="btn-touch px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-sync-alt"></i>
                <span>Refresh</span>
              </button>
              <button 
                id="add-customer-btn" 
                class="btn-touch px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <i class="fas fa-plus"></i>
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-blue-100 rounded-lg">
                  <i class="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Total Customers</p>
                  <p id="total-customers" class="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-green-100 rounded-lg">
                  <i class="fas fa-user-check text-green-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Active Customers</p>
                  <p id="active-customers" class="text-2xl font-bold text-green-600">0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <i class="fas fa-rupee-sign text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">Total Outstanding</p>
                  <p id="total-outstanding" class="text-2xl font-bold text-yellow-600">₹0</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-purple-100 rounded-lg">
                  <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm text-gray-600">This Month</p>
                  <p id="monthly-revenue" class="text-2xl font-bold text-purple-600">₹0</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters and Controls -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div class="p-4 border-b border-gray-200">
              <div class="flex flex-col lg:flex-row gap-4">
                <!-- Filters -->
                <div class="flex flex-wrap gap-3">
                  <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Customers</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  
                  <select id="balance-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Balances</option>
                    <option value="positive">Positive Balance</option>
                    <option value="negative">Outstanding Amount</option>
                    <option value="zero">Zero Balance</option>
                  </select>

                  <select id="sort-by" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="name">Sort by Name</option>
                    <option value="balance">Sort by Balance</option>
                    <option value="lastJob">Sort by Last Job</option>
                    <option value="created">Sort by Created Date</option>
                  </select>
                </div>
                
                <!-- Search -->
                <div class="flex-1 max-w-md">
                  <input 
                    type="text" 
                    id="customer-search" 
                    placeholder="Search customers by name, contact, or company..." 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Customers List -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Customer Directory</h3>
            </div>
            
            <!-- Customers Grid -->
            <div id="customers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              <!-- Customer cards will be populated here -->
            </div>

            <!-- Empty State -->
            <div id="customers-empty-state" class="hidden text-center py-12">
              <i class="fas fa-users text-gray-400 text-6xl mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p class="text-gray-600 mb-6">Add your first customer to get started</p>
              <button 
                id="add-first-customer" 
                class="btn-touch px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
              >
                Add First Customer
              </button>
            </div>
          </div>
        </div>

        <!-- Customer Detail Modal -->
        <div id="customer-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="customer-modal-title" class="text-xl font-semibold text-gray-900">Customer Details</h2>
              <button id="close-customer-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="customer-modal-content" class="overflow-y-auto max-h-[calc(90vh-140px)]">
              <!-- Customer details will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Customer Form Modal -->
        <div id="customer-form-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="customer-form-title" class="text-xl font-semibold text-gray-900">Add Customer</h2>
              <button id="close-customer-form-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="customer-form-content" class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <!-- Customer form will be loaded here -->
            </div>
          </div>
        </div>
      `;

      this.attachEventListeners();
      this.renderCustomers();
      this.updateStats();
    } catch (error) {
      console.error("Error rendering customers component:", error);
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Customers</h3>
          <p class="text-gray-600">Please try refreshing the page</p>
        </div>
      `;
    }
  }

  async loadCustomers() {
    try {
      const response = await this.api.get("/customers");
      this.customers = response.data || [];
      this.state.set("customers", this.customers);
    } catch (error) {
      console.error("Error loading customers:", error);
      this.customers = [];
    }
  }

  renderCustomers() {
    const gridContainer = document.getElementById("customers-grid");
    const emptyState = document.getElementById("customers-empty-state");

    const filteredCustomers = this.filterCustomers();

    if (filteredCustomers.length === 0) {
      gridContainer.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    gridContainer.innerHTML = filteredCustomers
      .map((customer) => this.createCustomerCard(customer))
      .join("");
  }

  createCustomerCard(customer) {
    const balance = customer.balance || 0;
    const balanceColor =
      balance > 0
        ? "text-green-600"
        : balance < 0
        ? "text-red-600"
        : "text-gray-600";
    const statusColor =
      customer.status === "active"
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-800";

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer customer-card" data-customer-id="${
        customer._id
      }">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${
              customer.name
            }</h3>
            ${
              customer.company
                ? `<p class="text-sm text-gray-600 mb-2">${customer.company}</p>`
                : ""
            }
            <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
              ${customer.status || "Active"}
            </span>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Balance</p>
            <p class="text-lg font-semibold ${balanceColor}">₹${Math.abs(
      balance
    ).toLocaleString()}</p>
            ${
              balance < 0
                ? '<p class="text-xs text-red-600">Outstanding</p>'
                : ""
            }
          </div>
        </div>

        <div class="space-y-2 text-sm text-gray-600 mb-4">
          ${
            customer.contact
              ? `
            <div class="flex items-center">
              <i class="fas fa-phone w-4 text-gray-400 mr-2"></i>
              <span>${customer.contact}</span>
            </div>
          `
              : ""
          }
          
          ${
            customer.email
              ? `
            <div class="flex items-center">
              <i class="fas fa-envelope w-4 text-gray-400 mr-2"></i>
              <span>${customer.email}</span>
            </div>
          `
              : ""
          }
          
          ${
            customer.address
              ? `
            <div class="flex items-start">
              <i class="fas fa-map-marker-alt w-4 text-gray-400 mr-2 mt-0.5"></i>
              <span class="line-clamp-2">${customer.address}</span>
            </div>
          `
              : ""
          }
        </div>

        <div class="flex items-center justify-between text-sm">
          <div class="text-gray-600">
            <span class="font-medium">${customer.totalJobs || 0}</span> jobs
          </div>
          <div class="text-gray-600">
            Last: ${
              customer.lastJobDate
                ? new Date(customer.lastJobDate).toLocaleDateString()
                : "Never"
            }
          </div>
        </div>

        <div class="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          <button class="edit-customer-btn flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors" data-customer-id="${
            customer._id
          }">
            <i class="fas fa-edit mr-1"></i> Edit
          </button>
          <button class="view-customer-btn flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors" data-customer-id="${
            customer._id
          }">
            <i class="fas fa-eye mr-1"></i> View
          </button>
        </div>
      </div>
    `;
  }

  filterCustomers() {
    return this.customers
      .filter((customer) => {
        const matchesStatus =
          this.filters.status === "all" ||
          customer.status === this.filters.status;

        const balance = customer.balance || 0;
        let matchesBalance = true;
        if (this.filters.balance === "positive") matchesBalance = balance > 0;
        else if (this.filters.balance === "negative")
          matchesBalance = balance < 0;
        else if (this.filters.balance === "zero")
          matchesBalance = balance === 0;

        const searchTerm =
          document.getElementById("customer-search")?.value.toLowerCase() || "";
        const matchesSearch =
          !searchTerm ||
          customer.name?.toLowerCase().includes(searchTerm) ||
          customer.company?.toLowerCase().includes(searchTerm) ||
          customer.contact?.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesBalance && matchesSearch;
      })
      .sort((a, b) => {
        const getValue = (customer, field) => {
          switch (field) {
            case "name":
              return customer.name || "";
            case "balance":
              return customer.balance || 0;
            case "lastJob":
              return new Date(customer.lastJobDate || 0);
            case "created":
              return new Date(customer.createdAt || 0);
            default:
              return "";
          }
        };

        const aVal = getValue(a, this.sortBy);
        const bVal = getValue(b, this.sortBy);

        if (this.sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
  }

  updateStats() {
    const totalCustomers = this.customers.length;
    const activeCustomers = this.customers.filter(
      (c) => c.status === "active"
    ).length;
    const totalOutstanding = this.customers.reduce(
      (sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0),
      0
    );

    // Calculate monthly revenue (mock data for now)
    const monthlyRevenue = this.customers.reduce(
      (sum, c) => sum + (c.monthlyRevenue || 0),
      0
    );

    document.getElementById("total-customers").textContent = totalCustomers;
    document.getElementById("active-customers").textContent = activeCustomers;
    document.getElementById(
      "total-outstanding"
    ).textContent = `₹${totalOutstanding.toLocaleString()}`;
    document.getElementById(
      "monthly-revenue"
    ).textContent = `₹${monthlyRevenue.toLocaleString()}`;
  }

  attachEventListeners() {
    // Filter change handlers
    document
      .getElementById("status-filter")
      ?.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.renderCustomers();
      });

    document
      .getElementById("balance-filter")
      ?.addEventListener("change", (e) => {
        this.filters.balance = e.target.value;
        this.renderCustomers();
      });

    document.getElementById("sort-by")?.addEventListener("change", (e) => {
      this.sortBy = e.target.value;
      this.renderCustomers();
    });

    // Search handler
    document
      .getElementById("customer-search")
      ?.addEventListener("input", () => {
        this.renderCustomers();
      });

    // Refresh button
    document
      .getElementById("refresh-customers")
      ?.addEventListener("click", async () => {
        await this.loadCustomers();
        this.renderCustomers();
        this.updateStats();
      });

    // Add customer buttons
    document
      .getElementById("add-customer-btn")
      ?.addEventListener("click", () => {
        this.showCustomerForm();
      });

    document
      .getElementById("add-first-customer")
      ?.addEventListener("click", () => {
        this.showCustomerForm();
      });

    // Modal close buttons
    document
      .getElementById("close-customer-modal")
      ?.addEventListener("click", () => {
        this.hideCustomerModal();
      });

    document
      .getElementById("close-customer-form-modal")
      ?.addEventListener("click", () => {
        this.hideCustomerForm();
      });

    // Customer action buttons (delegated events)
    document.addEventListener("click", (e) => {
      if (e.target.closest(".customer-card") && !e.target.closest("button")) {
        const customerId =
          e.target.closest(".customer-card").dataset.customerId;
        this.showCustomerDetail(customerId);
      } else if (e.target.closest(".edit-customer-btn")) {
        e.stopPropagation();
        const customerId =
          e.target.closest(".edit-customer-btn").dataset.customerId;
        this.editCustomer(customerId);
      } else if (e.target.closest(".view-customer-btn")) {
        e.stopPropagation();
        const customerId =
          e.target.closest(".view-customer-btn").dataset.customerId;
        this.showCustomerDetail(customerId);
      }
    });
  }

  showCustomerDetail(customerId) {
    const customer = this.customers.find((c) => c._id === customerId);
    if (!customer) return;

    const modal = document.getElementById("customer-modal");
    const content = document.getElementById("customer-modal-content");

    content.innerHTML = this.createCustomerDetailView(customer);
    modal.classList.remove("hidden");
  }

  createCustomerDetailView(customer) {
    const balance = customer.balance || 0;
    const balanceColor =
      balance > 0
        ? "text-green-600"
        : balance < 0
        ? "text-red-600"
        : "text-gray-600";

    return `
      <div class="p-6 space-y-6">
        <!-- Customer Header -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">${
              customer.name
            }</h3>
            ${
              customer.company
                ? `<p class="text-lg text-gray-600 mb-2">${customer.company}</p>`
                : ""
            }
            <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              customer.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }">
              ${customer.status || "Active"}
            </span>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Current Balance</p>
            <p class="text-3xl font-bold ${balanceColor}">₹${Math.abs(
      balance
    ).toLocaleString()}</p>
            ${
              balance < 0
                ? '<p class="text-sm text-red-600 font-medium">Outstanding Amount</p>'
                : ""
            }
          </div>
        </div>

        <!-- Customer Information Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Contact Information -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <i class="fas fa-address-card text-gray-600 mr-2"></i>
              Contact Information
            </h4>
            <div class="space-y-3 text-sm">
              ${
                customer.contact
                  ? `
                <div class="flex items-center">
                  <i class="fas fa-phone text-gray-400 w-5 mr-2"></i>
                  <span>${customer.contact}</span>
                </div>
              `
                  : ""
              }
              
              ${
                customer.email
                  ? `
                <div class="flex items-center">
                  <i class="fas fa-envelope text-gray-400 w-5 mr-2"></i>
                  <span>${customer.email}</span>
                </div>
              `
                  : ""
              }
              
              ${
                customer.address
                  ? `
                <div class="flex items-start">
                  <i class="fas fa-map-marker-alt text-gray-400 w-5 mr-2 mt-0.5"></i>
                  <span>${customer.address}</span>
                </div>
              `
                  : ""
              }
              
              ${
                customer.gst
                  ? `
                <div class="flex items-center">
                  <i class="fas fa-file-invoice text-gray-400 w-5 mr-2"></i>
                  <span>GST: ${customer.gst}</span>
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Business Statistics -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
              <i class="fas fa-chart-bar text-gray-600 mr-2"></i>
              Business Statistics
            </h4>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Jobs:</span>
                <span class="font-medium">${customer.totalJobs || 0}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">First Job:</span>
                <span class="font-medium">${
                  customer.firstJobDate
                    ? new Date(customer.firstJobDate).toLocaleDateString()
                    : "N/A"
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Last Job:</span>
                <span class="font-medium">${
                  customer.lastJobDate
                    ? new Date(customer.lastJobDate).toLocaleDateString()
                    : "N/A"
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Revenue:</span>
                <span class="font-medium">₹${(
                  customer.totalRevenue || 0
                ).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Jobs -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
            <i class="fas fa-briefcase text-gray-600 mr-2"></i>
            Recent Jobs
          </h4>
          <div id="customer-jobs" class="bg-gray-50 rounded-lg p-4 min-h-[100px]">
            <p class="text-gray-600 text-sm">Loading job history...</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button class="edit-customer-btn px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium" data-customer-id="${
            customer._id
          }">
            <i class="fas fa-edit mr-2"></i>Edit Customer
          </button>
          <button class="view-jobs-btn px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium" data-customer-id="${
            customer._id
          }">
            <i class="fas fa-briefcase mr-2"></i>View All Jobs
          </button>
          ${
            balance < 0
              ? `
            <button class="record-payment-btn px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium" data-customer-id="${customer._id}">
              <i class="fas fa-money-bill mr-2"></i>Record Payment
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  showCustomerForm(customer = null) {
    const modal = document.getElementById("customer-form-modal");
    const title = document.getElementById("customer-form-title");
    const content = document.getElementById("customer-form-content");

    title.textContent = customer ? "Edit Customer" : "Add Customer";
    content.innerHTML = this.createCustomerFormView(customer);
    modal.classList.remove("hidden");
  }

  createCustomerFormView(customer = null) {
    return `
      <form id="customer-form" class="space-y-6">
        ${
          customer
            ? `<input type="hidden" id="customer-id" value="${customer._id}">`
            : ""
        }
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input type="text" id="customer-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${customer?.name || ""}" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Company/Business</label>
            <input type="text" id="company" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${customer?.company || ""}">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
            <input type="tel" id="contact" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${customer?.contact || ""}" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${customer?.email || ""}">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea id="address" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">${
            customer?.address || ""
          }</textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
            <input type="text" id="gst" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                   value="${
                     customer?.gst || ""
                   }" placeholder="GST registration number">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select id="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="active" ${
                customer?.status === "active" || !customer?.status
                  ? "selected"
                  : ""
              }>Active</option>
              <option value="inactive" ${
                customer?.status === "inactive" ? "selected" : ""
              }>Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea id="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                    placeholder="Any additional notes about the customer">${
                      customer?.notes || ""
                    }</textarea>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" id="cancel-customer-form" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
            ${customer ? "Update Customer" : "Add Customer"}
          </button>
        </div>
      </form>
    `;
  }

  editCustomer(customerId) {
    const customer = this.customers.find((c) => c._id === customerId);
    if (!customer) return;

    this.hideCustomerModal();
    this.showCustomerForm(customer);
  }

  hideCustomerModal() {
    document.getElementById("customer-modal")?.classList.add("hidden");
  }

  hideCustomerForm() {
    document.getElementById("customer-form-modal")?.classList.add("hidden");
  }

  // Public method to refresh component
  async refresh() {
    await this.loadCustomers();
    this.renderCustomers();
    this.updateStats();
  }
}
