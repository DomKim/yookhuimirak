# VWeb 마스터 템플릿

Gnuboard 5 + 영카트 기반 프론트엔드 퍼블리싱 마스터 템플릿.
클라이언트 프로젝트 시작 시 이 레포를 클론해서 사용.

## 빠른 시작

### 새 프로젝트 시작 (원클릭)

```bash
git clone [레포URL] 새프로젝트명
cd 새프로젝트명
bash setup.sh
php -S localhost:8080
```

이게 전부입니다. `setup.sh`가 자동으로:
- 폴더명으로 **독립 DB 생성** (프로젝트별 분리)
- 기본 테이블 + 설정 데이터 임포트
- `dbconfig.php` 자동 생성 (토큰 키 랜덤)
- data/ 권한 설정
- npm 의존성 설치

→ `http://localhost:8080` 접속 | 관리자: `admin` / `admin`

### Docker 사용 시 (PHP/MySQL 미설치 환경)

```bash
git clone [레포URL] 새프로젝트명
cd 새프로젝트명
cp data/dbconfig.php.docker data/dbconfig.php
docker compose up -d
```
→ `http://localhost:8080` (PHP 8.2 + MySQL 8.0 자동)

### PSD 파싱 도구 (의존성 자동 설치)
```bash
node psd_parser.js design.psd output.json
```
> ag-psd 미설치 시 자동 `npm install`

## 구조

```
www/
├── theme/design/           ← 프론트엔드 작업 영역
│   ├── template/
│   │   ├── header/         ← 헤더 (메뉴, 로고)
│   │   ├── footer/         ← 푸터 (회사정보, 개인정보)
│   │   └── main/           ← 메인 페이지 섹션
│   ├── head.sub.php        ← CSS/JS 라이브러리 로드
│   └── tail.sub.php        ← 하단 스크립트
├── css/
│   ├── style.css           ← 공통 CSS (리셋, 레이아웃, 키프레임, 유틸)
│   ├── mobile_style.css    ← 모바일 반응형
│   └── lib/                ← Swiper CSS 등
├── js/
│   ├── header.js           ← 헤더 동작 (햄버거, 스크롤, 팝업)
│   ├── footer.js           ← 푸터 동작 (자동하이픈, 메일폼)
│   ├── script.js           ← GSAP 초기화 + 클라이언트 애니메이션
│   ├── map.js              ← 카카오맵
│   └── lib/                ← GSAP, ScrollTrigger, Swiper, SplitType (로컬)
├── images/                 ← 이미지 에셋
├── data/
│   ├── dbconfig.sample.php ← DB 설정 샘플 (이걸 복사해서 사용)
│   └── dbconfig.php        ← 실제 DB 설정 (.gitignore)
└── adm/                    ← 관리자
```

## 작업 흐름

1. `theme/design/template/main/index.html` — 메인 섹션 HTML 추가
2. `css/style.css` — 섹션별 CSS 추가
3. `css/mobile_style.css` — 모바일 반응형 추가
4. `js/script.js` — GSAP/Swiper 애니메이션 추가
5. `images/` — 에셋 추가

## 포함된 라이브러리 (로컬, CDN 의존 없음)

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| jQuery | 1.12.4 | DOM 조작 |
| GSAP | 3.x | 스크롤 애니메이션 |
| ScrollTrigger | 3.x | 스크롤 트리거 |
| Swiper | 11.x | 슬라이더 |
| SplitType | - | 텍스트 분할 애니메이션 |
| Font Awesome | 4.7 | 아이콘 |

## 캔버스 기준

- PC: **1905px** (÷1920 아님!)
- 좌표 변환: `page_x = figma_x + 59.7`
- 단위: **vw, % only** (px 금지)
- 소수점 4자리 필수
