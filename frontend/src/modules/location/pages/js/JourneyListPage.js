import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanyContext } from "../../../../contexts/CompanyContext";
import LocationService from "../../services/locationService";
import { fetchUsers } from "../../../user/services/userService";
import styles from "../styles/JourneyListPage.module.css";
import { MapPin, Clock, Calendar, ChevronRight, User, Search, Filter, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const JourneyListPage = () => {
  const { selectedCompanyId } = useCompanyContext();
  const [journeys, setJourneys] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  // Filter States
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    userId: "",
    status: ""
  });

  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    if (selectedCompanyId) {
      fetchJourneys();
      loadCompanyUsers();
    }
  }, [selectedCompanyId, page, activeFilters]);

  const loadCompanyUsers = async () => {
    try {
      const response = await fetchUsers(selectedCompanyId);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load users for this company:", error);
      setUsers([]);
    }
  };

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const apiFilters = {};
      if (activeFilters.startDate) apiFilters.start_date = activeFilters.startDate;
      if (activeFilters.endDate) apiFilters.end_date = activeFilters.endDate;
      if (activeFilters.userId) apiFilters.user_id = activeFilters.userId;
      if (activeFilters.status) apiFilters.status = activeFilters.status;

      const response = await LocationService.getJourneys(selectedCompanyId, page, 20, apiFilters);
      if (response.status === "success") {
        setJourneys(response.data.items);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch journeys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setPage(1);
  };

  const resetFilters = () => {
    const defaultFilters = {
      startDate: "",
      endDate: "",
      userId: "",
      status: ""
    };
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setPage(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleViewMap = (journeyId) => {
    navigate(`/location/journey/${journeyId}`);
  };

  const handleDelete = async (e, journeyId) => {
    e.stopPropagation(); // Prevent card click
    
    if (!window.confirm("Are you sure you want to delete this journey? All location history for this trip will be permanently removed.")) {
      return;
    }

    try {
      const response = await LocationService.deleteJourney(journeyId, selectedCompanyId);
      if (response.status === "success") {
        // Remove from local state
        setJourneys(journeys.filter(j => j.id !== journeyId));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete journey:", error);
      alert(error.response?.data?.detail || "Failed to delete journey");
    }
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== "");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div>
            <h2 className={styles.title}>User Journeys</h2>
            <p className={styles.subtitle}>Track and visualize field visit history</p>
          </div>
          <button 
            className={`${styles.filterToggleBtn} ${showFilters ? styles.active : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && <span className={styles.filterDot}></span>}
          </button>
        </div>

        {/* Compact Filter Bar */}
        <div className={`${styles.filterBar} ${showFilters ? styles.expanded : ""}`}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <div className={styles.inputWrapper}>
                <Calendar size={14} className={styles.inputIcon} />
                <input 
                  type="date" 
                  name="startDate"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.inputWrapper}>
                <Calendar size={14} className={styles.inputIcon} />
                <input 
                  type="date" 
                  name="endDate"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.inputWrapper}>
                <User size={14} className={styles.inputIcon} />
                <select 
                  name="userId"
                  value={filters.userId}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name || ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.inputWrapper}>
                <Filter size={14} className={styles.inputIcon} />
                <select 
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <div className={styles.filterActions}>
              <button className={styles.applyBtn} onClick={applyFilters}>
                Apply
              </button>
              <button className={styles.resetBtn} onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading journeys...</div>
      ) : journeys.length === 0 ? (
        <div className={styles.noData}>
          <MapPin size={48} className={styles.noDataIcon} />
          <div className={styles.noDataText}>
            <p>No journeys found matching your filters.</p>
            <span>Try adjusting filters or clear them.</span>
          </div>
          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={resetFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {journeys.map((journey) => (
            <div key={journey.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className={styles.userName}>{journey.user_name || `User #${journey.user_id}`}</h3>
                    <span className={styles.userId}>User ID: {journey.user_id}</span>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${journey.status === 'ACTIVE' ? styles.active : styles.completed}`}>
                  {journey.status === 'ACTIVE' && <span className={styles.pulse}></span>}
                  {journey.status}
                </span>
                {journey.status === 'COMPLETED' && (
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, journey.id)}
                    title="Delete Journey"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.detailRow}>
                  <Calendar size={16} />
                  <span>Start: {formatDateTime(journey.start_time)}</span>
                </div>
                <div className={styles.detailRow}>
                  <Clock size={16} />
                  <span>
                    End: {journey.status === "ACTIVE" ? "Ongoing" : formatDateTime(journey.end_time)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <MapPin size={16} />
                  <span>Points Captured: {journey.total_points}</span>
                </div>
              </div>

              <button 
                className={styles.viewButton}
                onClick={() => handleViewMap(journey.id)}
              >
                Track on Map
                <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JourneyListPage;
