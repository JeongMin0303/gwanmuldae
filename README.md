# 관물대 유지보수형 구조

준비물 목록과 Q&A는 `data` 폴더의 JSON 파일에서 수정할 수 있습니다.

```text
gwanmuldae-json-maintainable/
├── index.html
├── army.html
├── navy.html
├── marine.html
├── airforce.html
├── qna.html
├── styles.css
├── script.js
└── data/
    ├── army.json
    ├── navy.json
    ├── marine.json
    ├── airforce.json
    └── qna.json
```

## 준비물 수정

예를 들어 육군 준비물은 `data/army.json`에서 수정합니다.

```json
{
  "id": "army-required-id-card",
  "title": "신분증",
  "description": "주민등록증, 운전면허증 등 사진이 있는 신분증을 준비하세요."
}
```

항목을 추가하려면 같은 형식으로 `items` 배열 안에 하나 더 넣으면 됩니다. `id`는 체크 저장에 사용되므로 되도록 고유하게 유지하세요. `id`를 빼도 화면 표시는 되지만, 체크 상태를 안정적으로 유지하려면 직접 넣는 것을 추천합니다.

## Q&A 수정

Q&A는 `data/qna.json`에서 수정합니다. 질문은 8개씩 한 페이지에 표시되고, 8개를 넘으면 페이지가 자동으로 나뉩니다.

```json
{
  "id": "q8",
  "question": "질문을 적으세요.",
  "answer": "답변을 적으세요."
}
```

검색은 두 글자 이상 입력했을 때 적용됩니다.

## 실행

JSON 파일을 불러오는 구조이므로 `index.html`을 더블클릭하는 방식보다 로컬 서버 실행을 추천합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소를 여세요.

```text
http://localhost:8000
```
