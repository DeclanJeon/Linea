# 🎵 Linea - Music Link Player

**YouTube 링크로 나만의 플레이리스트를 만들고 편리하게 음악을 재생하세요**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

![Linea Logo](public/logo.svg)

## ✨ 주요 기능

### 🎶 플레이리스트 관리
- **다중 플레이리스트 지원**: 여러 개의 플레이리스트를 생성하고 관리할 수 있습니다
- **플레이리스트 가져오기/내보내기**: JSON 파일로 플레이리스트를 백업하고 복원할 수 있습니다
- **자동 저장**: 모든 데이터가 브라우저의 IndexedDB에 자동으로 저장됩니다

### 🎵 트랙 관리
- **YouTube URL 지원**: YouTube 동영상 URL을 입력하여 트랙을 추가할 수 있습니다
- **자동 메타데이터 추출**: 제목과 썸네일이 자동으로 가져와집니다
- **일괄 추가**: 여러 URL을 한 번에 추가할 수 있습니다
- **트랙 삭제**: 플레이리스트에서 원치 않는 트랙을 쉽게 제거할 수 있습니다

### 🎧 재생 기능
- **YouTube IFrame Player**: 실제 YouTube 플레이어를 사용하여 고품질 재생
- **현재 재생 중인 트랙 표시**: 재생 중인 트랙이 시각적으로 강조됩니다
- **플레이리스트 전체 재생**: 한 번의 클릭으로 모든 트랙을 연속 재생
- **배속 조절**: 0.25x부터 2x까지 다양한 배속 지원
- **셔플 재생**: 랜덤 재생 모드 지원
- **이전/다음 트랙**: 직관적인 네비게이션

### 🎨 사용자 경험
- **모던 UI/UX**: shadcn/ui와 Tailwind CSS를 사용한 깔끔한 디자인
- **반응형 디자인**: 데스크톱과 모바일 모두 최적화
- **다크/라이트 모드**: 시스템 설정에 따른 자동 테마 적용
- **실시간 업데이트**: 플레이어 상태가 실시간으로 반영됩니다

## 🚀 설치 및 실행

### 사전 요구사항
- **Node.js** 18.0.0 이상
- **npm** 또는 **yarn** 또는 **pnpm**

### 1. 저장소 클론
```bash
git clone <repository-url>
cd tube-juke-box
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 3. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

브라우저에서 `http://localhost:6060`으로 접속하여 애플리케이션을 확인할 수 있습니다.

### 4. 프로덕션 빌드
```bash
npm run build
# 또는
yarn build
# 또는
pnpm build
```

## 🛠️ 기술 스택

### Frontend
- **React 18.3.1** - UI 프레임워크
- **TypeScript 5.8.3** - 타입 안전성
- **Vite 5.4.19** - 빠른 빌드 도구
- **React Router** - 클라이언트 사이드 라우팅

### UI/Design
- **Tailwind CSS 3.4.17** - 유틸리티 기반 CSS 프레임워크
- **shadcn/ui** - 재사용 가능한 컴포넌트 라이브러리
- **Radix UI** - 접근성 높은 기본 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### 데이터 관리
- **IndexedDB** - 브라우저 내 데이터 저장
- **React Query** - 서버 상태 관리 (확장성 고려)

### 배포
- **PM2** - 프로덕션 프로세스 관리
- **Nginx** - 웹 서버 (옵션)

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── YouTubePlayer.tsx    # YouTube 플레이어 컴포넌트
│   ├── PlaylistView.tsx     # 플레이리스트 표시
│   ├── PlayerControls.tsx   # 재생 컨트롤
│   ├── PlaylistManager.tsx  # 플레이리스트 관리
│   ├── AddTrackForm.tsx     # 트랙 추가 폼
│   └── PlaylistImportExport.tsx # 가져오기/내보내기
├── lib/                # 유틸리티 및 데이터베이스
│   ├── db.ts          # IndexedDB 래퍼
│   └── utils.ts       # 유틸리티 함수
├── pages/             # 페이지 컴포넌트
│   ├── Index.tsx      # 메인 페이지
│   └── NotFound.tsx   # 404 페이지
└── hooks/             # 커스텀 React 훅
```

## 🔧 주요 컴포넌트 설명

### YouTubePlayer
- YouTube IFrame API를 사용하여 실제 YouTube 영상을 재생
- 메타데이터(제목, 썸네일) 자동 추출
- 배속 조절, 재생 상태 관리

### PlaylistView
- 플레이리스트의 모든 트랙을 시각적으로 표시
- 각 트랙의 썸네일과 제목 표시
- 현재 재생 중인 트랙 하이라이트

### PlayerControls
- 재생/일시정지, 이전/다음 트랙 네비게이션
- 배속 조절, 셔플 모드 토글
- 플레이리스트 전체 재생 버튼

## 🌐 배포

### 개발 환경
```bash
npm run dev
```
- 개발 서버가 `http://localhost:6060`에서 실행됩니다
- 핫 리로드 지원으로 코드 변경 시 자동 반영

### 프로덕션 배포
```bash
# 빌드
npm run build

# PM2를 사용한 배포 (ecosystem.config.cjs)
pm2 start ecosystem.config.cjs

# 또는 정적 파일로 서빙
npx serve -s dist -l 6060
```

### 자동 배포 스크립트
`deploy.sh` 스크립트를 사용하여 VPS로 자동 배포할 수 있습니다:

```bash
# 배포 설정 파일 생성
cp deploy.config.example deploy.config

# 설정 파일 편집 (VPS 정보 입력)
nano deploy.config

# 배포 실행
./deploy.sh
```

## 📱 사용법

1. **플레이리스트 생성**: "플레이리스트 관리"에서 새 플레이리스트를 생성하세요
2. **트랙 추가**: YouTube 동영상 URL을 입력하여 트랙을 추가하세요
3. **재생 시작**: 플레이리스트에서 원하는 트랙을 클릭하거나 "플레이리스트 전체 재생" 버튼을 사용하세요
4. **재생 제어**: 하단의 컨트롤을 사용하여 재생, 배속, 셔플 등을 조절하세요

## 🤝 기여

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다.

## 🙋‍♂️ 지원

문의사항이 있으시면 이슈를 생성해주세요.

---

**만든 사람**: [Your Name]
**버전**: 1.0.0