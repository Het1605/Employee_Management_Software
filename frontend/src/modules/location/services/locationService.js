import API from "../../../core/api/apiClient";

const LocationService = {
  /**
   * Fetch all journeys for a company with pagination and optional user filtering
   */
  getJourneys: async (companyId, page = 1, size = 20, userId = null) => {
    const params = {
      company_id: companyId,
      page,
      size,
    };
    if (userId) params.user_id = userId;

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
  }
};

export default LocationService;
