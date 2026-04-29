import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCompanyContext } from "../../../../contexts/CompanyContext";
import LocationService from "../../services/locationService";
import styles from "../styles/JourneyDetailPage.module.css";
import { ArrowLeft, Clock, MapPin, Navigation, RefreshCcw } from "lucide-react";

// Fix Leaflet marker icon issue in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to auto-fit map bounds to the polyline
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

        // Start polling if journey is ACTIVE
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
    }, 30000); // 30 seconds
  };

  if (loading) return <div className={styles.loadingState}>Initializing map and loading points...</div>;
  if (!journey) return <div className={styles.errorState}>Journey not found or access denied.</div>;

  const positions = logs.map(log => [log.latitude, log.longitude]);
  const startPos = [journey.start_lat, journey.start_lng];
  const endPos = journey.status === "COMPLETED" ? [journey.end_lat, journey.end_lng] : null;
  const latestPos = logs.length > 0 ? [logs[logs.length-1].latitude, logs[logs.length-1].longitude] : startPos;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/location")}>
          <ArrowLeft size={20} />
          Back to List
        </button>
        
        <div className={styles.journeyInfo}>
          <h2 className={styles.title}>Journey Report: Employee #{journey.user_id}</h2>
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <Clock size={16} />
              <span>Started: {new Date(journey.start_time).toLocaleTimeString()}</span>
            </div>
            <div className={styles.stat}>
              <MapPin size={16} />
              <span>Points: {journey.total_points}</span>
            </div>
            {journey.status === "ACTIVE" && (
              <div className={`${styles.stat} ${styles.liveSync}`}>
                <RefreshCcw size={14} className={styles.spin} />
                <span>Live Tracking Active (Synced {lastSync?.toLocaleTimeString()})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mapCard}>
        <MapContainer 
          center={latestPos} 
          zoom={15} 
          className={styles.map}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {positions.length > 0 && (
            <>
              <Polyline positions={positions} color="#3b82f6" weight={4} opacity={0.7} />
              <FitBounds positions={positions} />
            </>
          )}

          {/* Start Marker */}
          <Marker position={startPos}>
            <Popup>
              <strong>Start Point</strong><br />
              {new Date(journey.start_time).toLocaleString()}
            </Popup>
          </Marker>

          {/* End Marker (if completed) */}
          {endPos && (
            <Marker position={endPos}>
              <Popup>
                <strong>End Point</strong><br />
                {new Date(journey.end_time).toLocaleString()}
              </Popup>
            </Marker>
          )}

          {/* Current Location Marker (if active) */}
          {journey.status === "ACTIVE" && logs.length > 0 && (
            <Marker 
              position={latestPos}
              icon={L.divIcon({
                className: styles.customPulseIcon,
                html: `<div class="${styles.pulseMarker}"></div>`
              })}
            >
              <Popup>Last known location: {lastSync?.toLocaleTimeString()}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default JourneyDetailPage;
