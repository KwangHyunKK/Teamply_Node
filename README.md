### Teamply_Node.js Team

### [세부내용 확인](https://www.notion.so/Teamply-0cf89fb056c6405d99cbea7bd418291e)
<hr>

#### Versions & dependencies
    "body-parser": "^1.20.1",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "morgan": "^1.10.0",
    "mysql": "^2.18.1",
    "mysql2": "^3.0.1",
    "nodemailer": "^6.9.1",
    "redis": "^4.5.1",
    "request-ip": "^3.3.0"

#### login 

- use JWT

- accessToken & refreshToken


#### what is JWT?

**Json Web Token** : header - payload - signature

- **Header** : JWT를 검증하는데 필요한 정보를 가진 JSON을 Base64 알고리즘 기반으로 인코딩한 문자열
  - typ : 토큰의 타입 ex) JWT
  - alg : 알고리즘 방식을 지정 ex) HS256
- **Payload** : JWT에 저장된 값. (name, value)의 쌍으로 이루어져 있다. 
  - 등록된 Claim
  - 공개 Claim
  - 비공개 Claim
- **Signature** : JWT를 인코딩하거나 유효성 검증을 할 때 사용하는 암호화 된 코드


#### Redis cloud

REDIS_HOST
REDIS_PORT
REDIS_USERNAME
REDIS_PASSWORD 

설정 완료

#### env 파일 사용

process.env로 사용자 정보숨기기 완료

#### db 설계 완료

<img src = "teamply1_1_0.png">

#### API 

##### 1. User

- [ ] signup : 회원가입  - update : email로 activate
- [ ] login : jwt 토큰 생성
- [ ] refresh : jwt 토큰 재발행
- [ ] resign : 회원탈퇴 - email resign code 필요
- [ ] Read Profile : 프로필 읽기
- [ ] Read Account : 회원정보 읽기
- [ ] update Profile : 프로필 업데이트
- [ ] update Account : 회원정보 업데이트
- [ ] update password : 비밀번호 최신화 - email code 필요
- [ ] add friend : 친구 초대
- [ ] get photo : 사진 출력

##### 2. Project

- [ ] create : 프로젝트 생성 
- [ ] update project : 프로젝트 내용 변경
- [ ] delete project : 프로젝트 제거
- [ ] create project invite code : 프로젝트 초대 코드 생성
- [ ] get project invite code : 프로젝트 초대 코드 받기
- [ ] invite project : 프로젝트 초대
  <hr>
###### 2.1 ProjectMember
- [ ] my : 내가 속한 프로젝트 가져오기
- [ ] get projectmember : 프로젝트에 속한 인원들 정보 가져오기

- 변경내용이 각각 다르다

##### 3. Schedule

- [ ] create : 일정 추가
- [ ] read : 일정 내용 가져오기
- [ ] update : 일정 내용 변경
- [ ] delete : 일정 제거

- 일정은 변경내용이 공통

##### 4. Alarm

- [ ] get my alarm : 나에게 해당되는 알람 가져오기

##### 5. Timetable

- [ ] get timetable : 시간표 가져오기
- [ ] update timetable : 시간표 업데이트하기

##### 6. email

- 외부에 공개하지 않음