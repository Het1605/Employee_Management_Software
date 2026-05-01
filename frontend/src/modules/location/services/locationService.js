import API from "../../../core/api/apiClient";

const LocationService = {
  /**
   * Fetch all journeys for a company with pagination and optional user filtering
   */
  getJourneys: async (companyId, page = 1, size = 20, filters = {}) => {
    const params = {
      company_id: companyId,
      page,
      size,
      ...filters
    };

    const response = await API.get("/location/journeys", { params });
    return response.data; // Standardized ResponseEnvelope: { status, message, data: { items, total, ... } }
  },

  /**
   * Fetch a single journey's metadata and all location points
   */
  getJourneyDetail: async (journeyId, companyId) => {
    const response = await API.get(`/location/journey/${journeyId}`, {
      params: { company_id: companyId },
    });
    return response.data; // Standardized ResponseEnvelope: { status, message, data: { ...journey, logs: [] } }
  },

  /**
   * Delete a journey and its logs (Only for COMPLETED journeys)
   */
  deleteJourney: async (journeyId, companyId) => {
    const response = await API.delete(`/location/journey/${journeyId}`, {
      params: { company_id: companyId },
    });
    return response.data;
  }
};

export default LocationService;
