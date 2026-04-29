import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCompanyContext } from "../../../../contexts/CompanyContext";
import LocationService from "../../services/locationService";
import styles from "../styles/JourneyDetailPage.module.css";
import { ArrowLeft, Clock, MapPin, RefreshCcw } from "lucide-react";

// --- BALANCED DYNAMIC ICON CREATORS ---

const createStartIcon = (zoom) => {
  // Min 24px, Max 36px. Gentler growth: 1px per zoom level above 14
  const size = Math.max(24, Math.min(36, 24 + (zoom - 14) * 1.2));
  return L.divIcon({
    className: styles.customMarkerContainer,
    html: `<div class="${styles.markerPin} ${styles.startPin}" style="width: ${size}px; height: ${size}px; margin-left: -${size/2}px; margin-top: -${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
  });
};

const createEndIcon = (zoom) => {
  const size = Math.max(24, Math.min(36, 24 + (zoom - 14) * 1.2));
  return L.divIcon({
    className: styles.customMarkerContainer,
    html: `<div class="${styles.markerPin} ${styles.endPin}" style="width: ${size}px; height: ${size}px; margin-left: -${size/2}px; margin-top: -${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
  });
};

const createMidIcon = (zoom) => {
  // Min 10px (clearly visible), Max 18px. Gentle growth from zoom 12
  const size = Math.max(10, Math.min(18, 10 + (zoom - 13) * 1.0));
  const border = zoom > 16 ? 2 : 1.5;
  return L.divIcon({
    className: styles.customMarkerContainer,
    html: `<div class="${styles.markerDot}" style="width: ${size}px; height: ${size}px; border-width: ${border}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// --- HELPER COMPONENTS ---

const FitBounds = ({ positions }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (positions && positions.length > 0 && !hasFitted.current) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFitted.current = true;
    }
  }, [positions, map]);
  
  return null;
};

const ZoomHandler = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
};

const JourneyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompanyContext();
  
  const [journey, setJourney] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [lastSync, setLastSync] = useState(null);
  const pollingRef = useRef(null);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }, [logs]);

  const allPositions = useMemo(() => {
    return sortedLogs.map(log => [log.latitude, log.longitude]);
  }, [sortedLogs]);

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

  const centerPos = allPositions.length > 0 ? allPositions[allPositions.length - 1] : [journey.start_lat, journey.start_lng];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/location")}>
          <ArrowLeft size={20} />
          Back to List
        </button>
        
        <div className={styles.journeyInfo}>
          <h2 className={styles.title}>Location History: {journey.user_name || `User #${journey.user_id}`}</h2>
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
          
          <ZoomHandler onZoomChange={setZoomLevel} />
          {allPositions.length > 0 && <FitBounds positions={allPositions} />}

          {sortedLogs.map((log, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedLogs.length - 1;
            
            let icon;
            if (isFirst) icon = createStartIcon(zoomLevel);
            else if (isLast) icon = createEndIcon(zoomLevel);
            else icon = createMidIcon(zoomLevel);

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
