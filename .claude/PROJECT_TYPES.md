# 프로젝트 형태 — 두 가지 (Landing / Brand)

> 모든 프로젝트는 다음 두 가지 형태 중 하나로 진행된다.
> 작업 착수 전 `theme/design/template/` 하위를 한 번 확인해 어느 쪽인지 파악한다.

---

## 🅰️ Landing (랜딩 원페이지 형태)

**"하나의 메인 페이지에 모든 섹션이 들어가는 구조"**

- 서브페이지 없음
- 헤더 메뉴는 **동일 페이지 내 앵커 스크롤** (`href="#move_03"`)
- 전체 콘텐츠가 `main/index.html` 에 전부 담김 (섹션 10~20개)
- CSS/JS 파일은 기본 세트 한 벌만 (`style.css`, `header.css`, `footer.css`)

### 구조

```
theme/design/template/
  ├── main/
  │   ├── index.html     ← 여기에 모든 섹션 (con01~con16 등)
  │   ├── style.css
  │   └── script.js
  ├── header/
  └── footer/

css/
  style.css, header.css, footer.css, default*, flip_clock, mobile* (9개)

g5_content DB
  company / privacy / provision  (약관 3개만)
```

### 헤더 패턴

```html
<a href="#move_03">매출안내</a>
<a href="#move_05">경쟁력</a>
<a href="tel:…">전화</a>
```

---

## 🅱️ Brand (브랜드 서브페이지 형태)

**"메인 + 별도 서브페이지 여러 개가 분리된 구조"**

- 메인은 상대적으로 슬림 (섹션 8개 내외)
- 나머지 콘텐츠는 **서브페이지로 분리** (`sub01 ~ subN`)
- 헤더 메뉴는 **별도 URL 이동** (`href="/bbs/content.php?co_id=sub01"`)
- 각 서브페이지마다 CSS/JS 가 1:1 로 매칭

### 구조

```
theme/design/template/
  ├── main/
  ├── header/
  ├── footer/
  ├── sub01/                  ← 서브페이지 템플릿
  │   ├── index.html
  │   └── style.css
  ├── sub02/
  ├── sub03/ …

css/
  기본 9개 + sub01.css ~ subN.css

js/
  기본 + sub01.js ~ subN.js

g5_content DB
  company / privacy / provision + sub01 / sub02 / … / subN
```

### 헤더 패턴

```html
<a href="/bbs/content.php?co_id=sub01">브랜드소개</a>
<a href="/bbs/content.php?co_id=sub02">매장안내</a>
```

---

## 🔎 이 프로젝트는 어느 쪽인지 식별

다음 중 하나만 확인하면 즉답:

| 시그널 | 랜딩 | 브랜드 |
|--------|:----:|:-----:|
| `theme/design/template/` 에 `subNN/` 폴더 존재 | ❌ | ✅ |
| `css/subNN.css` 존재 | ❌ | ✅ |
| 헤더에 `href="#move_XX"` 앵커 링크만 | ✅ | ❌ |
| 헤더에 `href="/bbs/content.php?co_id=subXX"` | ❌ | ✅ |
| `g5_content` 에 `sub*` 레코드 | ❌ | ✅ |

가장 빠른 확인: `ls theme/design/template/` → `subNN/` 있으면 브랜드, 없으면 랜딩.

---

## 📐 작업 시 파급

- **랜딩형**: 모든 섹션을 `main/index.html` 한 파일에 이어붙임. `#move_XX` 앵커 + 스크롤 UX 중심.
- **브랜드형**: 메인은 핵심 섹션만, 나머지는 `subNN/index.html` + `subNN.css` 로 분리 구현. 서브페이지마다 별도 퍼블리싱 단위.

두 형태 모두 기본 골격(`config.php`, `head.php`, `tail.php`, `theme/design/skin/`, `mobile/`, `bbs/` 등)은 **동일**. 차이는 오직 "메인 하나냐 / 메인 + 서브 N개냐" 이다.
