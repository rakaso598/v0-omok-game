# [🎲 오목 온라인 게임 프로젝트](https://v0-omok-game.vercel.app)
![image](https://github.com/user-attachments/assets/40247e2c-db82-4f36-99cf-311b0f501f8f)
<details>
<summary>로비 화면</summary>

![image](https://github.com/user-attachments/assets/f41119b8-e172-4364-8e3d-b05410767d52)

</details>
<details>
<summary>새 게임룸 만들기</summary>
   
![image](https://github.com/user-attachments/assets/e52c8f8b-181a-43e8-b7e0-301a565c62ef)

</details>
<details>
<summary>컴퓨터와 대전</summary>

![image](https://github.com/user-attachments/assets/4f5c2c76-4ac0-4de3-ad89-87c956eff066)

</details>
<details>
<summary>익명 사용자와 대전</summary>

![image](https://github.com/user-attachments/assets/abddefd3-619c-4e0e-9c6a-cda4cfbfcf58)

</details>
<details>
<summary>게임 승리시</summary>

![image](https://github.com/user-attachments/assets/9b9dc133-d5cb-41c2-ad77-230dab190801)

</details>
<details>
<summary>Neon 데이터베이스</summary>

![image](https://github.com/user-attachments/assets/c0a00fe4-1522-4949-89e1-f0f39aa02e6f)

</details>
<details>
<summary>Verel 배포</summary>

![image](https://github.com/user-attachments/assets/dfa5e23c-f513-462d-be79-89f693102dc1)

</details>
<details>
<summary>v0 by Vercel 활용(초기 버전 세팅)</summary>

![image](https://github.com/user-attachments/assets/0f9be4c5-c9e1-45db-b48c-3d54c4dbdc83)

</details>

---

### 0. 프로젝트 완성도: `35%`

**구현한 기능**
- 로비에서 타 유저가 생성한 게임룸 조회 가능. (대기중인지, 게임중인지 상태 확인 가능)
- 상대방이 입장하면 해당 유저의 익명ID 노출됨. (상대방이 입장했음을 알 수 있음)
- 컴퓨터와 싱글플레이 모드 가능. (단, 컴퓨터의 오목 성능은 매우 떨어짐.)
- 게임판에 오목알 두기 가능.

**미흡한 기능**
- 오목알 착수 시 상대방 화면에 실시간 업데이트 미구현.
- 오목알 크기와 격자 간격 불일치.
- 턴제(Turn-based) 플레이 미구현 (단일 유저가 흑백 모두 조작 가능).
- 게임룸 삭제 기능 미구현.
- 이미 한번 생성된 방을 삭제할 수 없음.

**배포 상황**: [**오목 배포 페이지**](https://v0-omok-game.vercel.app)
- 배포 페이지에 접속하여 오목을 플레이할 수 있습니다. (단, 타 유저와 같은 게임룸에 입장 가능, 온라인 플레이 불가, 이모지 사용 불가, 컴퓨터와 대결 가능)
- `Next.js` 프레임워크로 제작하였으며 `Vercel`로 배포하였습니다.
- 데이터베이스는 `PostgreSQL` 사용했으며, `Next.js`에서 `Prisma` 활용하여 스키마를 관리합니다.
- DB는 `Neon` 으로 배포하였습니다.
- 웹페이지 초기 버전은 Vercel의 `v0` 서비스로 제작했습니다. [**v0 by Vercel 공식 페이지**](https://v0.dev/)

**걸린 시간**
- 설계부터 배포까지 3시간 걸렸습니다.
- 직접 코딩 대신 `Gemini`와 `v0` 를 사용해 제작하였습니다.

**개발하게 된 계기**
- Neon 데이터베이스와 Vercel 배포환경을 연동해 보고 싶었습니다.
- Vercel의 v0 서비스를 활용하여 어디까지 개발할 수 있는지 확인하려 하였습니다.
- 실시간으로 로그인 없이 익명 사용자들과 오목을 둘 수 있는 빠르고 간편한 사이트가 있으면 재미있을 것 같았습니다.

**프로젝트를 `35%`만큼 진행하며 느낀 점**
- `v0 by Vercel`은 매우 강력한 Next.js 초기 버전 생성 서비스입니다.
- `v0`에서 바로 깃허브 레포지토리로 푸쉬하고, v0가 새로운 개선사항을 적용할 때마다 v1, v2,... 로 자동으로 커밋해 줍니다.
- v0는 월 5달러 상당의 무료 크레딧을 제공하는 것으로 보입니다.
- `Neon`은 Vercel과 원활하게 호환되는 것 같습니다.
- Neon DB 서비스와 `Prisma`를 연동하는 건 간편했습니다.
- `웹소켓`에 대한 이해도가 부족하여 오목 실시간 대결의 흐름을 제대로 캐치하지 못해 프로젝트 진척이 느려진 것 같습니다. [**Socket.io 공식 페이지**](https://socket.io/)
- Next.js 클라이언트 컴포넌트와 서버 액션에 대한 이해도가 높아졌습니다. (특히, 로그인 등 보안-인증 관련, DB 작업의 경우는 서버 내부의 로직이 외부에 노출되지 않도록 서버로직을 활용해야 한다는 것입니다.)
- v0가 제작한 초기 버전 구조를 보며 Next.js의 `Best Practice`에 대해 생각해볼 수 있었습니다. (Vercel이 제작한 서비스이므로 공식문서와 밀접한 관련이 있을 거라고 생각했습니다.)
- `TypeScript` 프로젝트를 통해 tsconfig 설정 및 타입 지정의 실질적인 경험을 얻었습니다.

---

### 1. 프로젝트 소개

본 프로젝트는 사용자들이 **익명**으로 접속하여 게임 방을 생성하거나 기존 방에 참여하여 **오목 게임을 플레이**할 수 있는 웹 기반 오목 게임입니다. **실시간 통신**을 통해 매끄러운 게임 경험을 제공하며, **AI 대전 모드**도 지원합니다.

---

### 2. 주요 기술 스택

**프론트엔드:**
* **React**: UI 구축
* **Next.js (App Router)**: 프레임워크 (SSR/SSG, 라우팅)
* **TypeScript**: 타입스크립트 기반 개발
* **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크 (빠른 UI 스타일링)

**백엔드:**
* **Next.js (API Routes - App Router 및 Pages Router 혼용)**: API 엔드포인트 및 Socket.IO 서버 호스팅
* **Node.js**: 서버 런타임 환경
* **Prisma**: ORM (객체-관계 매핑)
* **PostgreSQL (or MySQL/SQLite)**: 데이터베이스 (Prisma datasource db 설정에 따라 변경)
* **bcrypt**: 비밀번호 해싱 (보안)
* **uuid**: 고유 ID 생성

**실시간 통신:**
* **Socket.IO**: 웹소켓 기반 실시간 양방향 통신

---

### 3. 아키텍처 개요

클라이언트 (React/Next.js)는 Next.js API 라우트를 통해 데이터베이스와 통신하고, Socket.IO를 통해 실시간 게임 상태 동기화를 처리합니다.

* **클라이언트 (Next.js FE)**: `useAuth` 훅을 통해 익명 사용자 인증을 관리하며, `fetch` API로 방 생성/참여/목록 조회 등의 HTTP 요청을 처리합니다. Socket.IO 클라이언트를 통해 실시간 게임 착수, 상태 변화 등을 서버와 주고받습니다.

* **서버 (Next.js API Routes)**:
    * **App Router API (app/api/.../route.js)**: 일반적인 RESTful API 요청 (사용자 생성, 방 생성, 방 목록 조회, 방 참여 등)을 처리합니다. Prisma를 통해 데이터베이스와 상호작용합니다.
    * **Pages Router API (pages/api/socket.js)**: Socket.IO 서버를 초기화하고 웹소켓 연결을 관리합니다. 게임 착수, 시간 업데이트, 연결/연결 해제, 방 나가기 등의 실시간 이벤트를 처리하며, Prisma를 통해 게임 상태를 데이터베이스에 저장하고 업데이트합니다.

* **게임 로직 (lib/gameLogic.js)**: 승자 판별, 보드 상태 업데이트 등 핵심 게임 로직을 담당합니다.

---

### 4. 주요 기능

* **익명 사용자 인증**: 별도 회원가입 없이 익명 닉네임 자동 생성 및 유지.
* **실시간 로비 시스템**: 현재 활성화된 방 목록 실시간 조회 및 갱신.
* **방 생성**: 제목, 비밀번호, 게임 모드(온라인/AI) 설정 가능한 게임 방 생성.
* **방 참여**: 기존 방에 참여 (비밀번호 방 지원).
* **온라인 멀티플레이**: Socket.IO를 통한 실시간 오목 플레이어 간 대전.
* **AI 대전 모드**: 컴퓨터 AI와 오목 대결.

---

### 5. 목표

사용자들이 **간편하고 빠르게 오목 게임을 즐길 수 있는 안정적이고 직관적인 웹 애플리케이션을 제공**하는 것입니다. 실시간 통신을 통해 지연 없는 게임 경험을 최적화하고, AI 대전 기능을 통해 다양한 플레이 옵션을 제공합니다.
