import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { Link } from 'react-router-dom';
import StageBadge from '@/components/shared/StageBadge';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';

const US_CENTER = [39.8283, -98.5795];

function getColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export default function BusinessMap({ businesses, height = '400px' }) {
  const geoBusinesses = useMemo(() => businesses.filter(b => b.latitude != null && b.longitude != null), [businesses]);
  const needGeocoding = businesses.filter(b => (b.city || b.state) && (b.latitude == null || b.longitude == null));

  return (
    <div className="space-y-3">
      {needGeocoding.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
          {needGeocoding.length} businesses need geocoding
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer center={US_CENTER} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {geoBusinesses.map(biz => {
            const score = biz.health_score || 0;
            const color = getColor(score);
            return (
              <CircleMarker
                key={biz.id}
                center={[biz.latitude, biz.longitude]}
                radius={8}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <Link to={`/businesses/${biz.id}`} className="font-semibold text-sm hover:underline">
                      {biz.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{biz.industry}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StageBadge stage={biz.stage} />
                    </div>
                    <div className="mt-1">
                      <HealthScoreBadge score={score} />
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}