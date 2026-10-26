# 표 두 개 대조 / Table Diff

W011. 설치·빌드 없이 `dist/`를 정적 호스팅하는 브라우저 도구입니다. `/` 한국어 및 `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/` 경로를 제공합니다. 언어 메뉴는 모든 경로에서 작동합니다. 사용자 입력과 예시 데이터는 번역하지 않습니다.

## 구현

- CSV/TSV/세미콜론/파이프 입력, 첫 레코드 기반 구분자 감지, UTF-8 파일 읽기.
- 인용된 구분자, 이중 인용부호, 셀 내부 CRLF/LF 보존. 문법 오류·빈 헤더·중복 헤더·열 수 불일치 차단.
- 키 열 선택. 헤더 이름 집합이 같으면 열 순서가 달라도 대조. 추가·누락·변경·동일 행 집계와 셀별 상세.
- 빈 키는 예외로 분리. 어느 쪽이든 중복된 키는 양쪽에서 대조 제외. 임의 병합 없음.
- 대조표·예외 CSV 전체 내보내기. 기본적으로 수식 시작 문자 앞에 작은따옴표 추가. 이 보호는 내보낸 값을 변경하며 스프레드시트 재저장 이후까지 보장하지 않습니다.
- 서버 호출·저장·광고·추적 없음. 모든 경로 `noindex,nofollow`.

## 제한

표당 2,000,000자, 헤더 포함 10,001행, 200열, 500,000셀. 파일 최대 8 MB. UTF-8만 지원합니다. 화면 목록 각 300행, 내보내기는 전체. 숫자·날짜·앞자리 0은 문자열로 유지합니다. 자동 감지는 수동 교정할 수 있습니다. 비교는 키 공백 옵션 외에 정확한 문자열 비교입니다. 브라우저 시각 QA는 수행하지 않았습니다.

## 검증

앱 루트 PowerShell에서 실제 실행한 명령입니다. Node는 제공된 런타임을 사용합니다.

```powershell
$node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& '..\..\.tools\rtk\rtk.exe' proxy $node --check dist/core.js
& '..\..\.tools\rtk\rtk.exe' proxy $node --check dist/app.js
& '..\..\.tools\rtk\rtk.exe' proxy $node --check dist/i18n.js
& '..\..\.tools\rtk\rtk.exe' proxy $node --check dist/locale-init.js
& '..\..\.tools\rtk\rtk.exe' proxy $node tests.mjs
```

결과: 모든 구문 검사 exit 0. 10개 fixture 그룹 통과. 다중행·이스케이프·TSV 왕복·잘못된 인용·헤더/열 오류·추가/누락/변경·열 재배열·중복 키·빈 키·공백 정책·앞자리 0·수식 보호·입력 상한·6개 언어 카탈로그 누락 검증 포함.

## 근거

- CSV 인용 규칙: [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)
- 내보내기 보호와 한계: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

코드·스타일·예시는 직접 작성했습니다. 외부 라이브러리·폰트·이미지 없음.

## Public GitHub Pages release

Launch: https://nanalab.kr/table-diff/

Korean is at the root. English, Spanish, Chinese, Japanese and German use `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/`.
GitHub Pages serves `main` → `/docs` using the branch build. No project CNAME is used.

Build: `node scripts/build-public.mjs`. The `dist/` snapshot and its original generators/tests are preserved as the application source. The public build adds metadata, six-locale sitemaps, original JPEG cards, More Apps styling and the existing NaNa publisher integrations. It does not upload selected user files.

Publisher integrations: AdSense, Google Tag Manager, Google Analytics and Cloudflare Web Analytics, with the same publisher settings as the NaNa Lab homepage. These scripts can make network requests independently of local file processing.

Original JPEG cards are rendered from original text and geometry using an installed system font; no font files are redistributed. Existing source references and third-party notices remain applicable.
