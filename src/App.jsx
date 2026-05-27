import React, { useRef } from 'react';
import MapViewer from './components/MapViewer';
import { useMapData } from './hooks/useMapData';

function App() {
  const { data, loading, error, updateDataFromCSV } = useMapData();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 파일 형식이 모두 csv인지 확인
    const nonCsvFiles = files.filter(f => f.name.slice(-4).toLowerCase() !== '.csv');
    if (nonCsvFiles.length > 0) {
      alert('CSV 파일만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }

    try {
      const readPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsText(file, 'utf-8');
        });
      });

      const csvTexts = await Promise.all(readPromises);
      await updateDataFromCSV(csvTexts);
    } catch (err) {
      console.error("파일 읽기 오류:", err);
      alert("파일을 읽는 도중 오류가 발생했습니다.");
    } finally {
      // 업로드 성공 후 입력값 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1>가맹 희망 지역 현황</h1>
            <p>실시간 가맹 문의 및 설명회 신청 현황</p>
          </div>
          <div className="header-upload-section">
            <label htmlFor="csv-upload" className="custom-file-upload">
              {loading ? '데이터 로딩 및 변환 중...' : 'CSV 파일 업로드'}
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={loading}
            />
            {error && <span className="upload-error-msg">{error}</span>}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="map-section">
          <MapViewer data={data} loading={loading} />
        </div>
      </main>
    </div>
  );
}

export default App;

