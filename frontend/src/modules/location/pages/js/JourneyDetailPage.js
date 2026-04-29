import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCompanyContext } from "../../../../contexts/CompanyContext";
import LocationService from "../../services/locationService";
import styles from "../styles/JourneyDetailPage.module.css";
import { ArrowLeft, Clock, MapPin, RefreshCcw } from "lucide-react";

// --- CUSTOM ICONS ---

// Start Point Icon (Green)
const startIcon = L.divIcon({
  className: styles.customMarkerContainer,
  html: `<div class="${styles.markerPin} ${styles.startPin}"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// End Point Icon (Red)
const endIcon = L.divIcon({
  className: styles.customMarkerContainer,
  html: `<div class="${styles.markerPin} ${styles.endPin}"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Mid Point Icon (Small Blue Dot)
const midIcon = L.divIcon({
  className: styles.customMarkerContainer,
  html: `<div class="${styles.markerDot}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// --- HELPER COMPONENTS ---

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

const JourneyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompanyContext();
  
  const [journey, setJourney] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const pollingRef = useRef(null);

  // Sort logs by time for accurate Start/End identification
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }, [logs]);

  useEffect(() => {
    if (id && selectedCompanyId) {
      fetchJourneyData();
    }
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id, selectedCompanyId]);

  const fetchJourneyData = async () => {
    try {
      const response = await LocationService.getJourneyDetail(id, selectedCompanyId);
      if (response.status === "success") {
        setJourney(response.data);
        setLogs(response.data.logs || []);
        setLastSync(new Date());

        if (response.data.status === "ACTIVE" && !pollingRef.current) {
          startPolling();
        } else if (response.data.status === "COMPLETED" && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (error) {
      console.error("Failed to fetch journey details:", error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const response = await LocationService.getJourneyDetail(id, selectedCompanyId);
        if (response.status === "success") {
          setJourney(response.data);
          setLogs(response.data.logs || []);
          setLastSync(new Date());
          
          if (response.data.status === "COMPLETED") {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 30000);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) return <div className={styles.loadingState}>Loading journey points...</div>;
  if (!journey) return <div className={styles.errorState}>Journey not found.</div>;

  const allPositions = sortedLogs.map(log => [log.latitude, log.longitude]);
  const centerPos = allPositions.length > 0 ? allPositions[allPositions.length - 1] : [journey.start_lat, journey.start_lng];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/location")}>
          <ArrowLeft size={20} />
          Back to List
        </button>
        
        <div className={styles.journeyInfo}>
          <h2 className={styles.title}>Location History: {journey.user_name || `Employee #${journey.user_id}`}</h2>
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <Clock size={16} />
              <span>Started: {formatTime(journey.start_time)}</span>
            </div>
            <div className={styles.stat}>
              <Clock size={16} />
              <span>Ended: {journey.status === "ACTIVE" ? "Ongoing" : formatTime(journey.end_time)}</span>
            </div>
            <div className={styles.stat}>
              <MapPin size={16} />
              <span>Journey Points: {sortedLogs.length}</span>
            </div>
            {journey.status === "ACTIVE" && (
              <div className={`${styles.stat} ${styles.liveSync}`}>
                <RefreshCcw size={14} className={styles.spin} />
                <span>Live Syncing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mapCard}>
        <MapContainer 
          center={centerPos} 
          zoom={15} 
          className={styles.map}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {allPositions.length > 0 && <FitBounds positions={allPositions} />}

          {sortedLogs.map((log, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedLogs.length - 1;
            
            // Determine which icon to use
            let icon = midIcon;
            if (isFirst) icon = startIcon;
            else if (isLast) icon = endIcon;

            return (
              <Marker 
                key={log.id || index} 
                position={[log.latitude, log.longitude]} 
                icon={icon}
              >
                <Popup className={styles.pointPopup}>
                  <div className={styles.popupContent}>
                    <strong>{isFirst ? "Start Point" : isLast ? "Current/End Point" : "Way Point"}</strong>
                    <div className={styles.popupTime}>🕒 {formatTime(log.recorded_at)}</div>
                    <div className={styles.popupCoords}>📍 {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default JourneyDetailPage;
