const moment = require('moment');
const XLSX = require('xlsx-style');
const Config = require('../config');
const Utils = require('./index');

const EXCEL_FORMAT_TEXT = "@";
const EXCEL_FORMAT_NUMBER = "#,##0";
const EXCEL_FORMAT_DATE = "yyyy/mm/dd";
const EXCEL_MAX_ROWS = 10000;
const EXCEL_MAX_COLS = 50;

module.exports = {

  /**
   * Hàm này sẽ generate ra 1 file excel ở folder upload/files/tmp và trả về đường dẫn tương đối
   * Lưu ý: các file trong folder upload/files/tmp chỉ là tạm thời để frontend download, sau sẽ xóa đi
   * @param fileName
   * @param data mảng chứa thông tin {headers, listData, sheetName = null}
   * @param data -> headers mảng chứa thông tin các cột {key: 'userCode', value: 'Mã NV', width: 15}
   *                key: để lấy dữ liệu trong mảng listData
   *                value: text hiển thị
   *                width: độ rộng của cột
   * @param data -> listData dữ liệu xuất excel
   * @param data -> sheetName tên sheet
   * @param options
   */
  exportExcel(fileName, data, options) {
    if (fileName.includes('__')) {
      let today = moment().format('YYYYMMDD_HHmmss');
      fileName = `${fileName}${today}.xlsx`;
    } else {
      fileName = `${fileName}.xlsx`
    }

    const fullPath = `${Config.downloadDir}/${fileName}`;
    const relativePath = `${Config.downloadUrl}/${fileName}`;

    // Vấn đề style, nếu dùng đúng thư viện SheetJS official https://github.com/SheetJS/js-xlsx (npm xlsx) thì phải dùng bản Pro mất phí thì mới hỗ trợ style.
    // Nếu vẫn muốn dùng miễn phí thì có 1 bản fork khác ở đây https://github.com/protobi/js-xlsx (npm xlsx-style)
    let styleHeader = {
      fill: {
        patternType: 'solid',
        fgColor: {rgb: "C4D79B"}
      },
      font: {
        sz: 12,
        bold: true,
        color: {rgb: "000000"},
        name: 'Arial'
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true
      },
      numFmt: EXCEL_FORMAT_TEXT,
      border: {
        top: {style: 'thin', color: {rgb: "000000"}},
        bottom: {style: 'thin', color: {rgb: "000000"}},
        left: {style: 'thin', color: {rgb: "000000"}},
        right: {style: 'thin', color: {rgb: "000000"}}
      }
    }

    let wb = {SheetNames: [], Sheets: {}};
    data.forEach((item, index) => {
      let {headers, listData} = item;
      let sheetName = item.sheetName || `Sheet${index + 1}`;
      let ws = {};
      let range = {s: {c: EXCEL_MAX_COLS, r: EXCEL_MAX_ROWS}, e: {c: 0, r: 0}};
      let wscols = [];
      let C = 0, R = 0;
      let DEFAULT_COLUMN_WIDTH = 20;
      for (let i = 0; i < headers.length; i++) {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;
        let cell = {v: headers[i]['value'], t: 's', s: styleHeader, z: EXCEL_FORMAT_TEXT};
        if (headers[i]['fillColor']) {
          cell.s = Utils.cloneObject(styleHeader);
          cell.s.fill.fgColor.rgb = headers[i]['fillColor'];
        }
        let width = headers[i]['width'] || DEFAULT_COLUMN_WIDTH;
        wscols.push({wch: width});
        let cell_ref = XLSX.utils.encode_cell({c: C, r: R});
        ws[cell_ref] = cell;
        C++;
      }
      let styleCell = Utils.cloneObject(styleHeader);
      styleCell.font.bold = false;
      styleCell.font.sz = 12;
      styleCell.fill.patternType = 'none';
      let keys = headers.map(it => it.key);
      for (let i = 0; i < listData.length; i++) {
        C = 0;
        R++;
        for (let key of keys) {
          if (range.s.r > R) range.s.r = R;
          if (range.s.c > C) range.s.c = C;
          if (range.e.r < R) range.e.r = R;
          if (range.e.c < C) range.e.c = C;
          let cellValue = listData[i][key];
          if (cellValue === null || cellValue === undefined) {
            cellValue = '';
          }
          let cell = {v: cellValue, t: 's', s: styleCell, z: EXCEL_FORMAT_TEXT};
          let formatNumber = should_format_number(key, headers);
          if (formatNumber) {
            cell.t = 'n';
            cell.z = cell.s.numFmt = formatNumber;
          } else if (options && options.formatDates && options.formatDates[key]) {
            if (cell.v.length > 0) {
              cell.t = 'd';
            }
            cell.z = cell.s.numFmt = options.formatDates[key];
          }
          let cell_ref = XLSX.utils.encode_cell({c: C, r: R});
          ws[cell_ref] = cell;
          C++;
        }
      }
      ws['!cols'] = wscols;
      if (range.s.c < EXCEL_MAX_COLS) ws['!ref'] = XLSX.utils.encode_range(range);
      wb.SheetNames.push(sheetName);
      wb.Sheets[sheetName] = ws;
    });

    // let wb = {SheetNames: ['Sheet1'], Sheets: {}};
    // wb.Sheets[wb.SheetNames[0]] = ws;
    XLSX.writeFile(wb, fullPath, {bookType: 'xlsx', bookSST: false, type: 'binary'});

    return {fileName: fileName, path: relativePath, fullPath: fullPath};
  }
} // module.exports

function should_format_number(key, headers) {
  for (let h of headers) {
    if (h.key === key) return h.formatNumber;
  }
  return undefined;
}
