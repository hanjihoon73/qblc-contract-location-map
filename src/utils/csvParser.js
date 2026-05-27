import Papa from 'papaparse';

/**
 * CSV 문자열을 JSON 배열로 변환합니다.
 * @param {string} csvString 
 * @returns {Promise<Array>}
 */
export const parseCSV = (csvString) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
