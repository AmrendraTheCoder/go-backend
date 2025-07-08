import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import socketService from "../services/socketService";

export const useJobsStore = create((set, get) => ({
  jobs: [],
  selectedJob: null,
  loading: false,
  error: null,
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    completedToday: 0,
    rejected: 0,
  },

  // Fetch all jobs
  fetchJobs: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/jobs", { params: filters });
      const jobs = response.data.jobs || [];

      // Calculate stats
      const stats = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === "pending").length,
        approved: jobs.filter((j) => j.status === "approved").length,
        inProgress: jobs.filter((j) => j.status === "in-progress").length,
        completed: jobs.filter((j) => j.status === "completed").length,
        rejected: jobs.filter((j) => j.status === "rejected").length,
        completedToday: jobs.filter(
          (j) =>
            j.status === "completed" &&
            new Date(j.completedAt).toDateString() === new Date().toDateString()
        ).length,
      };

      set({ jobs, stats, loading: false });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch jobs",
        loading: false,
      });
    }
  },

  // Get single job
  fetchJob: async (jobId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/jobs/${jobId}`);
      set({ selectedJob: response.data.job, loading: false });
      return response.data.job;
    } catch (error) {
      console.error("Error fetching job:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch job",
        loading: false,
      });
    }
  },

  // Approve job
  approveJob: async (jobId, comments = "") => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}/approve`, {
        comments,
      });

      // Update local state
      const jobs = get().jobs.map((job) =>
        job._id === jobId
          ? { ...job, status: "approved", approvedAt: new Date().toISOString() }
          : job
      );

      set({ jobs });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error approving job:", error);
      throw error;
    }
  },

  // Reject job
  rejectJob: async (jobId, reason) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}/reject`, { reason });

      // Update local state
      const jobs = get().jobs.map((job) =>
        job._id === jobId
          ? {
              ...job,
              status: "rejected",
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : job
      );

      set({ jobs });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error rejecting job:", error);
      throw error;
    }
  },

  // Update job pricing
  updateJobPricing: async (jobId, pricing) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}/pricing`, pricing);

      // Update local state
      const jobs = get().jobs.map((job) =>
        job._id === jobId ? { ...job, ...response.data.job } : job
      );

      set({ jobs });

      return response.data;
    } catch (error) {
      console.error("Error updating job pricing:", error);
      throw error;
    }
  },

  // Update job status
  updateJobStatus: async (jobId, status, data = {}) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}/status`, {
        status,
        ...data,
      });

      // Update local state
      const jobs = get().jobs.map((job) =>
        job._id === jobId ? { ...job, status, ...data } : job
      );

      set({ jobs });

      // Recalculate stats
      get().calculateStats();

      return response.data;
    } catch (error) {
      console.error("Error updating job status:", error);
      throw error;
    }
  },

  // Assign job to machine
  assignJobToMachine: async (jobId, machineId, operatorId) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}/assign`, {
        machineId,
        operatorId,
      });

      // Update local state
      const jobs = get().jobs.map((job) =>
        job._id === jobId
          ? { ...job, assignedMachine: machineId, assignedOperator: operatorId }
          : job
      );

      set({ jobs });

      return response.data;
    } catch (error) {
      console.error("Error assigning job:", error);
      throw error;
    }
  },

  // Calculate stats from current jobs
  calculateStats: () => {
    const jobs = get().jobs;
    const stats = {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      approved: jobs.filter((j) => j.status === "approved").length,
      inProgress: jobs.filter((j) => j.status === "in-progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      rejected: jobs.filter((j) => j.status === "rejected").length,
      completedToday: jobs.filter(
        (j) =>
          j.status === "completed" &&
          new Date(j.completedAt).toDateString() === new Date().toDateString()
      ).length,
    };

    set({ stats });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      jobs: [],
      selectedJob: null,
      loading: false,
      error: null,
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        inProgress: 0,
        completed: 0,
        completedToday: 0,
        rejected: 0,
      },
    }),

  // Real-time socket event handlers
  initializeSocketListeners: () => {
    // Job created event
    socketService.subscribe("job:created", (job) => {
      const jobs = [...get().jobs, job];
      set({ jobs });
      get().calculateStats();
    });

    // Job updated event
    socketService.subscribe("job:updated", (updatedJob) => {
      const jobs = get().jobs.map((job) =>
        job._id === updatedJob._id ? { ...job, ...updatedJob } : job
      );
      set({ jobs });
      get().calculateStats();

      // Update selected job if it's the one being updated
      if (get().selectedJob?._id === updatedJob._id) {
        set({ selectedJob: { ...get().selectedJob, ...updatedJob } });
      }
    });

    // Job approved event
    socketService.subscribe("job:approved", (jobData) => {
      const jobs = get().jobs.map((job) =>
        job._id === jobData.jobId
          ? { ...job, status: "approved", approvedAt: jobData.approvedAt }
          : job
      );
      set({ jobs });
      get().calculateStats();
    });

    // Job rejected event
    socketService.subscribe("job:rejected", (jobData) => {
      const jobs = get().jobs.map((job) =>
        job._id === jobData.jobId
          ? {
              ...job,
              status: "rejected",
              rejectedAt: jobData.rejectedAt,
              rejectionReason: jobData.reason,
            }
          : job
      );
      set({ jobs });
      get().calculateStats();
    });

    // Job deleted event
    socketService.subscribe("job:deleted", (jobData) => {
      const jobs = get().jobs.filter((job) => job._id !== jobData.jobId);
      set({ jobs });
      get().calculateStats();

      // Clear selected job if it was deleted
      if (get().selectedJob?._id === jobData.jobId) {
        set({ selectedJob: null });
      }
    });
  },

  // Clean up socket listeners
  cleanupSocketListeners: () => {
    // This will be handled by the socketService when it disconnects
  },
}));
