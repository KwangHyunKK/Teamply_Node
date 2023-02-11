const express = require('express'); // express 모듈
const router = express.Router(); // module.exports = router;
const jwt = require('./jwt-util'); 
// const redisClient = require('./redis'); // redis
const authJWT = require('./middleware/authJWT'); // token 확인해주는 middleware
const refresh = require('./refresh'); // token 재발행 router
// check ip
const requestIP = require('request-ip'); // 요청한 ip 주소 확인 
const crypto = require('crypto'); // 초대 코드 등 생성할 때 사용. crpyto.createHash('sha1').update('문자열').digext('hex')
var mysql = require('mysql2/promise'); // mysql 접근
var db = mysql.createPool({
    host: process.env.mysql_host,
    port: process.env.mysql_port,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    connectionLimit: 10,
    connectTimeout: 10000
});
const verifysignup = require('./middleware/verifysignup'); // duplicate email 확인하는 코드
const ip_util = require('./ip'); // ip 확인
const mail = require('./node_mailing/nodeMailing'); // email 확인

// signup : 회원가입 
router.post('/signup', verifysignup, async(req, res)=>{ 
    let conn = null;
    try{
        const user = req.body;
        const ip = ip_util.inet_aton(requestIP.getClientIp(req));
        const query1 = `insert into Users(user_name, user_email, user_pw, accessConsent, serviceConsent, createIP, updateIP, activate, is_resigned) 
        values(${user.name}, ${user.email}, sha2(${user.pw}, 256), ${user.accessConsent}, ${user.serviceConsent}, ${ip},${ip}, ${0}, ${0})`;
        const code = crypto.createHash('sha1').update(user.email.substring(1, user.email.length-1)).digest('hex').substring(0, 8);
        conn = await db.getConnection();
        await conn.query(query1);
        conn.release();
        mail.sendPDFMail('팀플리',process.env.senderMail,process.env.senderPass,process.env.senderSmtp,process.env.Port, process.env.email, {"emailSubject" : '[Teamply] User 활성화', 
        "emailHtml" : `<b>안녕하세요, ${user.name}님.</b> <br/>
        <b>아래의 ${code}를 입력하시면 이메일 인증이 되며 팀플리 회원가입이 완료됩니다.</b> <br/>
        <b>팀플리와 함께 즐거운 팀플되세요:) </b>`});
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message : 'signup complete!',
            activate: code,
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: false,
            code: 400,
            message: 'signup error!',
        });
    }
});

// login : create JWT token 
// update requeset : different ip update!
// 이메일과 비밀번호로 로그인
// transaction update가 필요하고
// 다른 ip 주소가 들어왔을 때 db에 업데이트도 해야 한다
router.post('/login', async(req, res)=>{
    let conn = null;
    try{
        // if every data is same
        // access token & refresh token
        const ip = ip_util.inet_aton(requestIP.getClientIp(req));
        const user = req.body;
        const loginQuery = `select user_id as id, user_name as name, left(sha1(concat(user_name, user_id)), 20) as hash, updateIP as ip, activate, is_resigned from Users 
        where user_email = ${user.email} and user_pw = sha2(${user.pw}, 256)`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(loginQuery);
        if(result[0] == null)throw Error('No user!');
        if(result[0].activate == 0 || result[0].is_resigned == 1)
        {
            await mail.sendPDFMail();
            throw Error('Activate User please!');
        }
        const result_value = {
            id: result[0].id,
            name: result[0].name,
            hash: result[0].hash,
            ip: ip
        }
        const accessToken = jwt.sign(result[0]);
        const refreshToken = jwt.refresh();
        const hash = '\''.concat('', result[0].hash).concat('', '\''); 
        const tokenkey = '\''.concat('', refreshToken).concat('', '\'');
        const jwtQuery = `insert into LogIn(user_id, user_hash, loginIP, plainText) values(${result[0].id}, ${hash}, ${result[0].ip}, ${tokenkey})`;
        let message = 'login complete';
        if(result[0].ip != ip){
            otherquery = `UPDATE Users set updateIP = ${ip} where user_id = ${result[0].id}`;
            await conn.query(otherquery);
            mail.sendPDFMail('팀플리',process.env.senderMail,process.env.senderPass,process.env.senderSmtp,process.env.Port, process.env.email,
            {"emailSubject" : '[Teamply] User 다른 IP 로그인', 
            "emailHtml" : `<b>안녕하세요, ${result[0].name}님.</b> <br/>
            <b>기존 ${result[0].ip}가 아닌 ${ip}에서 접속이 확인되었습니다.</b> <br/>
            <b>팀플리와 함께 즐거운 팀플되세요:) </b>`} );
            message = message + 'from another IP';
        }
        await conn.query(jwtQuery);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            message: message,
            data:{
                accessToken,
                refreshToken,
            }
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(400).send({
            isSuccess: false,
            code: 500,
            message: err.message,
        });
    }
})

// refresh
// refresh token을 활용해서 refresh를 하는 코드
// 만질 필요 없다
router.get('/refresh', refresh);

// resign
router.delete('/resign', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const user = req.body;
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const query1= `update Users set is_resigned = ${1}, updateAt = now() where user_id = ${req.user_id} and user_pw = sha2(${user.pw}, 256) and user_name = ${user.name}`;
        const query2=`delete from LogIn where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        conn = await db.getConnection();
        await conn.query(query1);
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'account delete!',
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(401).send({
            isSuccess: false,
            code: 401,
            message: 'account delete error : unauthorized!',
        });
    }
})


// 프로필 얻는 코드
router.get('/my/profile', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const getUserQuery = `select * from UserInfo where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data: {
                result,
            }
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'profile read error',
        });
    }
});

// 회원 정보(이메일) 등을 얻는 코드
router.get('/my/account', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const getUserQuery = `select * from Users where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        if(result[0] == null)throw new Error('no result!');
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data: {
                result,
            }
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'account read error!',
        });
    }
});

// update account
router.put('/my/account', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const user = req.body;
        const query1 = `select Exists(select * from Users where user_pw = sha2(${user.pw}, 256) and user_id = ${req.user_id}) as success`;
        const query2 = `update Users set user_email = ${req.body.email}, updateAt = now() where user_id = ${req.user_id} and user_pw = sha2(${user.pw}, 256)`;
        console.log(query2);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('unauthorized!');
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        // send email 

        // 변경사항 필요
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'account update!',
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(401).send({
            isSuccess: false,
            code: 401,
            message: err.message,
        });
    }
})

// update profile
// transaction update 필요
router.put('/my/profile', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const user = req.body;
        const query1 = `select Exists(select * from Users where user_pw = sha2(${user.pw}, 256) and user_id = ${req.user_id} and activate = 1) as success`;
        const query2 = `update UserInfo set school = ${req.body.school}, major = ${req.body.major}, MBTI = ${req.body.mbti}, updateAt = now() where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('no data!');
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message : 'update profile',
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'account update error!',
        });
    }
})

// new password
// password 이메일을 요청하는 password와 password/callback으로 요청이 필요하다
router.put('/password', authJWT, async(req, res)=>{
 // 비밀번호를 새로운 비밀번호로 변경해준다
     let conn = null;
    try{
        const user = req.body;
        const query1 = `select Exists(select * from Users where user_pw = sha2(${user.pw}, 256) and user_id = ${req.user_id}) as success`;
        const query2 = `update Users set user_pw = sha2(${user.newpw}, 256), updateAt = now() where user_id = ${req.user_id} and user_pw = sha2(${user.pw}, 256)`;
        console.log(query2);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error();
        conn = await db.getConnection();
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'account update!',
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(401).send({
            isSuccess: false,
            code: 401,
            message: 'Unauthorized!',
        });
    }
})

// 모든 유저를 볼 수 있게하는 코드
// 개발용이다
router.get('/users/:userid', async(req, res)=>{
    let conn = null;
    try{
        const getUserQuery = `select * from Users where user_id = ${req.params.userid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        console.log(result[0]);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'all user read error!',
        });
    }
});

// 범위로 값 확인하기
router.get('/:startid/~/:endid', async(req, res)=>{
    console.log('this');
    let conn = null;
    try{
        const getUserQuery = `select * from Users where user_id < ${req.params.endid} and user_id >= ${req.params.startid}`;
        console.log(getUserQuery);
        conn = await db.getConnection();
        console.log('this');
        const [result] = await conn.query(getUserQuery);
        console.log(result[0]);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'all user read error!',
        });
    }
});

// Token이 유효한지 확인하는 코드
router.get('/checkToken', authJWT, async(req, res)=>{
    console.log('checkToken');
    try{
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message : 'Authorized token',
        });
    }catch(err){
        return res.status(401).send({
            isSuccess: false,
            code: 401,
            message : 'Invalid token',
        });
    }
})

// hash 값을 통해서 유저를 활성화시키는 함수
// activate와 activate/callback 함수로 변경할 필요가 있음
router.post('/activate', async(req, res)=>{
    // use transaction
    try{
        const user = req.body;
        const getUserQuery = `select user_id from Users where user_email = ${user.email} and left(sha1(user_email), 8) = ${user.code}`;
        conn = await db.getConnection();
        // start Transaction;
        await conn.beginTransaction();
        const [result] = await conn.query(getUserQuery);
        if(result[0] == null)throw new Error('not match');
        const updateQuery = `update Users set activate = 1, is_resigned = 0, updateAt = now() where user_id = ${result[0].user_id}`;
        const UserInfoQuery = `insert into UserInfo(user_id, school, major, mbti, evaluation) select user_id, null, null, null, null from Users where user_id = ${result[0].user_id}`;
        let tableQuery = `insert into TimeTable(user_id, sun, mon, tue, wed, thur, fri, sat) values(${result[0].user_id}, ${0}, ${0}, ${0}, ${0}, ${0}, ${0}, ${0})`;
        await conn.query(updateQuery);
        await conn.query(UserInfoQuery);
        await conn.query(tableQuery);
        await conn.commit();
        // end Transaction
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message : 'Activate user success',
        });
    }catch(err){
        if(conn != null)
        {
            await conn.rollback();
            conn.release();
        }
        return res.status(409).send({
            isSuccess: false,
            code: 409,
            message : 'Activate user failed',
        });
    }
})

module.exports = router;
