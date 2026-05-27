import React, { useState } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';

const MapViewer = ({ data, loading }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // 지도의 초기 중심 좌표 (대한민국 중심부 근처 - 대전)
  const [center] = useState({
    lat: 36.3504119,
    lng: 127.3845475,
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '600px' }}>
        <h2>데이터를 불러오고 좌표를 변환하는 중입니다...</h2>
      </div>
    );
  }

  return (
    <Map
      center={center}
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
      level={12} // 초기 확대 레벨 (전국이 보이도록 약간 축소)
      onClick={() => setSelectedMarker(null)} // 바탕 클릭 시 열려있는 정보창 닫기
    >
      <MarkerClusterer
        averageCenter={true} // 클러스터 내 마커들의 평균 위치를 클러스터 마커 위치로 설정
        minLevel={10} // 클러스터링할 최소 지도 레벨
      >
        {data.map((item) => (
          <MapMarker
            key={item.id}
            position={{ lat: item.lat, lng: item.lng }}
            onClick={() => setSelectedMarker(item)}
          />
        ))}
      </MarkerClusterer>

      {/* 마커 클릭 시 정보창 표시 */}
      {selectedMarker && (
        <CustomOverlayMap
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          yAnchor={1.3} // 마커 위쪽으로 띄우기
        >
          <div className="marker-info-window">
            <h4>{selectedMarker.address}</h4>
            <p><strong>유형:</strong> {selectedMarker.type}</p>
            <p><strong>가맹유형:</strong> {selectedMarker.franchiseType}</p>
            <p><strong>이름:</strong> {selectedMarker.name}</p>
            {selectedMarker.date && <p><strong>신청일:</strong> {selectedMarker.date.split(' ')[0]}</p>}
            <button onClick={() => setSelectedMarker(null)}>닫기</button>
          </div>
        </CustomOverlayMap>
      )}
    </Map>
  );
};

export default MapViewer;

