# PAIR · 카드 맞추기 게임

Next.js로 만든 4×4 과일 카드 맞추기 게임입니다. 이름을 입력하고 같은 과일 카드 8쌍을 찾아보세요.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## Google Sheets 연동

1. Google Sheets에 `timestamp`, `name`, `score`, `finishtime` 열을 첫 행에 만듭니다.
2. 시트 이름을 `시트1`로 맞춥니다. 이름을 바꾸었다면 `google-apps-script/Code.gs`의 `SHEET_NAME`도 바꿉니다.
3. [확장 프로그램] → [Apps Script]에서 `google-apps-script/Code.gs` 내용을 붙여넣습니다.
4. [배포] → [새 배포] → 유형을 [웹 앱]으로 선택합니다.
5. 실행 주체는 본인, 액세스 권한은 모든 사용자로 설정하고 배포합니다.
6. 발급된 웹 앱 URL을 `.env.local`에 넣습니다.

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/발급된_ID/exec
```

URL이 없을 때도 게임과 로컬 순위는 정상 동작합니다. URL을 설정하면 완료 기록이 시트에 저장되고, 시트의 전체 기록에서 TOP 3를 불러옵니다.
