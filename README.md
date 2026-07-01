# 관물대

육군·해군·해병대·공군 입대 준비물 체크리스트와 Q&A를 제공하는 정적 웹사이트입니다.

## 실행

JSON을 불러오는 구조가 아니라, JSON을 기준으로 HTML을 미리 생성한 구조입니다. 브라우저에서 `index.html`을 직접 열어도 기본 콘텐츠는 보이지만, 실제 배포 환경과 동일하게 확인하려면 로컬 서버를 권장합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열면 됩니다.

## 데이터 수정

준비물과 Q&A의 원본 데이터는 `data` 폴더에 있습니다.

```text
data/army.json
data/navy.json
data/marine.json
data/airforce.json
data/qna.json
```

준비물 항목을 추가하려면 해당 군의 JSON 파일에서 원하는 카테고리의 `items` 배열에 항목을 추가합니다.

```json
{
  "id": "army-daily-example",
  "title": "예시 준비물",
  "description": "설명 문구를 적습니다."
}
```

`id`는 체크 상태 저장에 사용되므로 고유하게 유지하는 것이 좋습니다.

## HTML 자동 생성

JSON을 수정한 뒤 아래 명령어를 실행하면 HTML, `sitemap.xml`, `robots.txt`가 다시 생성됩니다.

```bash
node build.js
```

생성 대상:

```text
index.html
army.html
navy.html
marine.html
airforce.html
qna.html
qna-2.html 이상
sitemap.xml
robots.txt
```

Q&A는 `data/qna.json`의 `pageSize` 기준으로 자동 분할됩니다. 기본은 8개씩이며, 질문이 9개 이상이면 `qna-2.html`이 생성됩니다.

## 배포

도메인 기준 URL은 다음으로 설정되어 있습니다.

```text
https://gwanmuldae.kr/
```

`build.js` 안의 `SITE_URL` 값이 canonical URL, sitemap URL, robots.txt의 sitemap 경로에 사용됩니다.
