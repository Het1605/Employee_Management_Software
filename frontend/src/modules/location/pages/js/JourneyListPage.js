import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanyContext } from "../../../../contexts/CompanyContext";
import LocationService from "../../services/locationService";
import styles from "../styles/JourneyListPage.module.css";
import { MapPin, Clock, Calendar, ChevronRight, User } from "lucide-react";

const JourneyListPage = () => {
  const { selectedCompanyId } = useCompanyContext();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedCompanyId) {
      fetchJourneys();
    }
  }, [selectedCompanyId, page]);

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const response = await LocationService.getJourneys(selectedCompanyId, page);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Employee Journeys</h2>
        <p className={styles.subtitle}>Track and visualize field visit history</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading journeys...</div>
      ) : journeys.length === 0 ? (
        <div className={styles.noData}>
          <MapPin size={48} className={styles.noDataIcon} />
          <p>No journeys found for this company.</p>
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
                    <h3 className={styles.userName}>{journey.user_name || `Employee #${journey.user_id}`}</h3>
                    <span className={styles.userId}>Employee ID: {journey.user_id}</span>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${journey.status === 'ACTIVE' ? styles.active : styles.completed}`}>
                  {journey.status === 'ACTIVE' && <span className={styles.pulse}></span>}
                  {journey.status}
                </span>
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
