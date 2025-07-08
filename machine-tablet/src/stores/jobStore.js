import { create } from "zustand";
import {
  getMachineJobs,
  updateJobStatus,
  uploadJobPhotos,
} from "../services/apiClient";
import socketService from "../services/socketService";

export const useJobStore = create((set, get) => ({
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,
  filters: {
    status: "all",
    priority: "all",
  },
  stats: {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    completedToday: 0,
  },

  // Fetch jobs for the current machine
  fetchMachineJobs: async (machineId, filters = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await getMachineJobs(machineId, {
        ...get().filters,
        ...filters,
      });

      const jobs = response.jobs || [];
      const stats = response.stats || get().stats;

      set({
        jobs,
        stats,
        loading: false,
        error: null,
      });

      return { success: true, jobs };
    } catch (error) {
      const errorMessage = error.message || "Failed to fetch machine jobs";
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Start working on a job
  startJob: async (jobId) => {
    set({ loading: true, error: null });

    try {
      const response = await updateJobStatus(
        jobId,
        "in_progress",
        "Job started by machine operator"
      );

      // Update the job in the local state
      const jobs = get().jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "in_progress",
              startedAt: new Date().toISOString(),
            }
          : job
      );

      // Set as current job
      const currentJob = jobs.find((job) => job.id === jobId);

      set({
        jobs,
        currentJob,
        loading: false,
        error: null,
      });

      // Emit socket event
      socketService.emitJobStatusUpdate(
        jobId,
        "in_progress",
        "Job started by machine operator"
      );

      return { success: true, job: response.job };
    } catch (error) {
      const errorMessage = error.message || "Failed to start job";
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Update job progress
  updateJobProgress: async (jobId, status, notes = "") => {
    set({ loading: true, error: null });

    try {
      const response = await updateJobStatus(jobId, status, notes);

      // Update the job in the local state
      const jobs = get().jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status,
              notes: [
                ...(job.notes || []),
                {
                  text: notes,
                  timestamp: new Date().toISOString(),
                  author: "machine_operator",
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : job
      );

      // Update current job if it's the same
      const currentJob =
        get().currentJob?.id === jobId
          ? jobs.find((job) => job.id === jobId)
          : get().currentJob;

      set({
        jobs,
        currentJob,
        loading: false,
        error: null,
      });

      // Emit socket event
      socketService.emitJobStatusUpdate(jobId, status, notes);

      return { success: true, job: response.job };
    } catch (error) {
      const errorMessage = error.message || "Failed to update job status";
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Complete a job
  completeJob: async (jobId, completionNotes = "") => {
    return get().updateJobProgress(jobId, "completed", completionNotes);
  },

  // Upload job photos
  uploadJobPhotos: async (jobId, photos) => {
    set({ loading: true, error: null });

    try {
      const response = await uploadJobPhotos(jobId, photos);

      // Update the job with new photos
      const jobs = get().jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              photos: [...(job.photos || []), ...response.photos],
              updatedAt: new Date().toISOString(),
            }
          : job
      );

      // Update current job if it's the same
      const currentJob =
        get().currentJob?.id === jobId
          ? jobs.find((job) => job.id === jobId)
          : get().currentJob;

      set({
        jobs,
        currentJob,
        loading: false,
        error: null,
      });

      // Emit socket event
      socketService.emitJobPhotoUpload(jobId, response.photos);

      return { success: true, photos: response.photos };
    } catch (error) {
      const errorMessage = error.message || "Failed to upload photos";
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Set current job (for detailed view)
  setCurrentJob: (job) => {
    set({ currentJob: job });
  },

  // Update filters
  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });

    // Refresh jobs with new filters if we have a machine ID
    const authData = JSON.parse(
      localStorage.getItem("machine-tablet-auth") || "{}"
    );
    const machineId = authData.state?.machineId;

    if (machineId) {
      get().fetchMachineJobs(machineId, filters);
    }
  },

  // Get filtered jobs
  getFilteredJobs: () => {
    const { jobs, filters } = get();

    return jobs.filter((job) => {
      // Status filter
      if (filters.status !== "all" && job.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "all" && job.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      jobs: [],
      currentJob: null,
      loading: false,
      error: null,
      filters: {
        status: "all",
        priority: "all",
      },
      stats: {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        completedToday: 0,
      },
    }),

  // Real-time socket event handlers
  initializeSocketListeners: () => {
    // Job assigned to this machine
    const unsubscribeAssigned = socketService.subscribe(
      "job:assigned",
      (data) => {
        const { job } = data;
        set((state) => ({
          jobs: [...state.jobs, job],
          stats: {
            ...state.stats,
            total: state.stats.total + 1,
            pending: state.stats.pending + 1,
          },
        }));
      }
    );

    // Job updated
    const unsubscribeUpdated = socketService.subscribe(
      "job:updated",
      (data) => {
        const { job } = data;
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === job.id ? { ...j, ...job } : j)),
          currentJob:
            state.currentJob?.id === job.id
              ? { ...state.currentJob, ...job }
              : state.currentJob,
        }));
      }
    );

    // Job cancelled
    const unsubscribeCancelled = socketService.subscribe(
      "job:cancelled",
      (data) => {
        const { jobId } = data;
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== jobId),
          currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
          stats: {
            ...state.stats,
            total: Math.max(0, state.stats.total - 1),
          },
        }));
      }
    );

    // Job priority changed
    const unsubscribePriority = socketService.subscribe(
      "job:priority_changed",
      (data) => {
        const { jobId, priority } = data;
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, priority } : j
          ),
          currentJob:
            state.currentJob?.id === jobId
              ? { ...state.currentJob, priority }
              : state.currentJob,
        }));
      }
    );

    // Job queue updated (batch update)
    const unsubscribeQueue = socketService.subscribe(
      "queue:updated",
      (data) => {
        const { jobs, stats } = data;
        if (jobs) {
          set({ jobs, stats: stats || get().stats });
        }
      }
    );

    // Store unsubscribe functions for cleanup
    set((state) => ({
      ...state,
      _unsubscribeFunctions: [
        unsubscribeAssigned,
        unsubscribeUpdated,
        unsubscribeCancelled,
        unsubscribePriority,
        unsubscribeQueue,
      ],
    }));
  },

  // Cleanup socket listeners
  cleanupSocketListeners: () => {
    const { _unsubscribeFunctions } = get();
    if (_unsubscribeFunctions) {
      _unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      set({ _unsubscribeFunctions: [] });
    }
  },
}));
