const SHEET_NAME = "시트1";

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`시트를 찾을 수 없습니다: ${SHEET_NAME}`);
  return sheet;
}

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    if (!data.name || typeof data.score !== "number" || !data.finishtime) {
      throw new Error("필수 게임 데이터가 없습니다.");
    }
    getSheet_().appendRow([
      data.timestamp || new Date().toISOString(),
      String(data.name).slice(0, 40),
      data.score,
      data.finishtime,
    ]);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doGet(event) {
  try {
    const values = getSheet_().getDataRange().getValues();
    const scores = values.slice(1)
      .filter((row) => row[1] && row[3])
      .map((row) => ({
        name: String(row[1]),
        moves: Number(row[2]) || 0,
        seconds: durationToSeconds_(String(row[3])),
        finishedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      }))
      .sort((a, b) => a.seconds - b.seconds || a.moves - b.moves)
      .slice(0, 3);
    return json_({ scores });
  } catch (error) {
    return json_({ scores: [], error: String(error) });
  }
}

function durationToSeconds_(value) {
  const parts = value.split(":").map(Number);
  if (parts.length === 2 && parts.every((part) => Number.isFinite(part))) return parts[0] * 60 + parts[1];
  return Number.MAX_SAFE_INTEGER;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
