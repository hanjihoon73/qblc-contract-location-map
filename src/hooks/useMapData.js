import { useState, useEffect } from 'react';
import { parseCSV } from '../utils/csvParser';
// Vite의 ?raw 속성을 사용해 외부 CSV 파일을 텍스트로 바로 불러옵니다.
import briefingRaw from '../../docs/briefing-applications-2026-05-26.csv?raw';
import inquiryRaw from '../../docs/franchise-inquiries-2026-05-26.csv?raw';

// Row 데이터를 공통 규격으로 변환하는 헬퍼 함수
const transformRow = (item, index, prefix = 'data') => {
  const id = item['신청ID'] || item['문의ID'] || `${prefix}-${index}`;
  const type = item['신청ID'] ? '설명회 신청' : (item['문의ID'] ? '가맹 문의' : '업로드 데이터');
  const name = item['이름'] || '이름 없음';
  const sido = item['시도'] || '';
  const sigungu = item['시군구'] || '';
  const address = `${sido} ${sigungu}`.trim();
  const date = item['신청일시'] || item['문의일시'] || '';
  const franchiseType = item['가맹유형'] || '미지정';

  return {
    id,
    type,
    name,
    sido,
    sigungu,
    address,
    date,
    franchiseType
  };
};

export const useMapData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 주소 리스트를 받아와 카카오 로컬 API 지오코딩 수행 후 데이터에 좌표 추가
  const geocodeAndSetData = async (combinedItems) => {
    setLoading(true);
    setError(null);
    try {
      const uniqueAddresses = [...new Set(combinedItems.map(item => item.address))].filter(Boolean);
      
      const geocoder = new window.kakao.maps.services.Geocoder();
      const coordsMap = {};

      // 카카오 API 호출 제한(Rate Limit)을 피하기 위해 순차적으로 호출합니다.
      for (const addr of uniqueAddresses) {
        await new Promise((resolve) => {
          geocoder.addressSearch(addr, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              coordsMap[addr] = {
                lat: parseFloat(result[0].y),
                lng: parseFloat(result[0].x)
              };
            } else {
              console.warn(`좌표 변환 실패: ${addr}`);
            }
            // 짧은 딜레이
            setTimeout(resolve, 50); 
          });
        });
      }

      // 원본 데이터에 변환된 좌표값을 매핑
      const finalData = combinedItems.map(item => ({
        ...item,
        lat: coordsMap[item.address]?.lat,
        lng: coordsMap[item.address]?.lng,
      })).filter(item => item.lat && item.lng); // 좌표가 유효한 데이터만 필터링

      setData(finalData);
    } catch (err) {
      console.error("좌표 변환 중 오류 발생:", err);
      setError("주소를 좌표로 변환하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 외부에서 여러 CSV 텍스트 배열(또는 단일 스트링)을 받아서 파싱 및 지오코딩 후 데이터 통합 업데이트
  const updateDataFromCSV = async (csvInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const csvStrings = Array.isArray(csvInput) ? csvInput : [csvInput];
      let allFormatted = [];

      for (let i = 0; i < csvStrings.length; i++) {
        const csvString = csvStrings[i];
        const rawData = await parseCSV(csvString);
        
        if (!rawData || rawData.length === 0) continue;

        const firstRow = rawData[0];
        if (!('시도' in firstRow) || !('시군구' in firstRow)) {
          throw new Error(`업로드된 파일 중 '시도' 및 '시군구' 열이 없는 파일이 있습니다.`);
        }

        const formatted = rawData
          .map((item, index) => transformRow(item, index, `uploaded-${i}`))
          .filter(item => item.sido && item.sigungu);

        allFormatted = [...allFormatted, ...formatted];
      }

      if (allFormatted.length === 0) {
        throw new Error("유효한 시도/시군구 주소 정보가 포함된 데이터가 없습니다.");
      }

      await geocodeAndSetData(allFormatted);
    } catch (err) {
      console.error("CSV 업로드 처리 중 오류:", err);
      setError(err.message || "CSV 파일을 처리하는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        // 1. CSV 파싱
        const briefingData = await parseCSV(briefingRaw);
        const inquiryData = await parseCSV(inquiryRaw);

        // 2. 데이터 구조 통일 및 병합
        const combined = [
          ...briefingData.map((item, index) => transformRow(item, index, 'briefing')),
          ...inquiryData.map((item, index) => transformRow(item, index, 'inquiry'))
        ].filter(item => item.sido && item.sigungu);

        await geocodeAndSetData(combined);
      } catch (err) {
        console.error("초기 데이터 로딩 중 오류 발생:", err);
        setError("초기 데이터를 로드하는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    // 카카오맵 스크립트 동적 로드
    const initKakaoMap = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        window.kakao.maps.load(() => {
          loadDefaultData();
        });
        return;
      }

      const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
      if (!appKey) {
        console.error("VITE_KAKAO_APP_KEY가 설정되지 않았습니다.");
        setError("카카오맵 API 키(VITE_KAKAO_APP_KEY)가 설정되지 않았습니다. 프로젝트 최상위 경로에 .env 파일을 만들고 앱키를 넣어주세요.");
        setLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          loadDefaultData();
        });
      };
      script.onerror = () => {
        setError("카카오맵 스크립트를 불러오는데 실패했습니다. 네트워크 연결 상태, 카카오 API 키, 또는 보안 정책(CSP)을 확인해주세요.");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    initKakaoMap();
  }, []);

  return { data, loading, error, updateDataFromCSV };
};

