import React, { useState } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';

const MapViewer = ({ data, loading }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // 지도의 초기 중심 좌표 (대한민국 중심부 근처 - 대전)
  const [center] = useState({
    lat: 36.3504119,
    lng: 127.3845475,
  });

  // 커스텀 클러스터 마커 스타일 (빨간색 -> 주황색 계열)
  const clusterStyles = [
    { // 소규모 뭉침 (기존 녹색 대체)
      width: '40px', height: '40px',
      background: 'rgba(239, 68, 68, 0.9)', // 빨간색
      borderRadius: '20px',
      color: '#fff',
      textAlign: 'center',
      fontWeight: 'bold',
      lineHeight: '40px',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    { // 중규모 뭉침 (기존 노란색 대체)
      width: '50px', height: '50px',
      background: 'rgba(249, 115, 22, 0.9)', // 주황색
      borderRadius: '25px',
      color: '#fff',
      textAlign: 'center',
      fontWeight: 'bold',
      lineHeight: '50px',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    { // 대규모 뭉침
      width: '60px', height: '60px',
      background: 'rgba(220, 38, 38, 0.9)', // 짙은 빨간색
      borderRadius: '30px',
      color: '#fff',
      textAlign: 'center',
      fontWeight: 'bold',
      lineHeight: '60px',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }
  ];

  // 커스텀 빨간색 마커 이미지 (SVG)
  const redMarkerImage = {
    src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
    size: {
      width: 36,
      height: 36,
    },
    options: {
      offset: {
        x: 18,
        y: 36,
      },
    },
  };

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
        styles={clusterStyles}
      >
        {data.map((item) => (
          <MapMarker
            key={item.id}
            position={{ lat: item.lat, lng: item.lng }}
            onClick={() => setSelectedMarker(item)}
            image={redMarkerImage}
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

