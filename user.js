const express = require('express');
const router = express.Router();
const jwt = require('./jwt-util');
// this redis 
const redisClient = require('./redis');
const authJWT = require('./middleware/authJWT');
const refresh = require('./refresh');
// check ip
const requestIP = require('request-ip');
// for hash : sha1
const crypto = require('crypto');
// db
var mysql = require('mysql2/promise');
var db = mysql.createPool({
    host: process.env.mysql_host,
    port: process.env.mysql_port,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    connectionLimit: 10,
    connectTimeout: 10000
});

// // verifysignup
const verifysignup = require('./middleware/verifysignup');
const ip_util = require('./ip');
// email
const mail = require('./node_mailing/nodeMailing');


// signup : 회원가입 
// 이름, 이메일, 비밀번호, 휴대폰 번호, 수신동의, 약관동의 -> request
// IP 주소, 활성화, 회원 정보는 직접 알아내서 넣는다.
// pw는 password로 wrapping하자
router.post('/signup', verifysignup, async(req, res)=>{
    // email, phonenumber
    let conn = null;
    try{
        const user = req.body;
        console.log(user);
        const ip = ip_util.inet_aton(requestIP.getClientIp(req));
        const query1 = `insert into Users(user_hash, user_name, user_email, user_pw, phone, accessConsent, serviceConsent, createIP, updateIP, activate, is_resigned) 
        values(Sha1(concat(${user.name}, right(${user.phone}, 8))), ${user.name}, ${user.email}, ${user.pw}, ${user.phone}, ${user.accessConsent}, ${user.serviceConsent}, ${ip},${ip}, ${0}, ${0})`;
        conn = await db.getConnection();
        await conn.query(query1);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message : 'signup complete!',
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
        const user = req.body;
        console.log(user);
        // sql query
        const loginQuery = `select user_id as id, user_name as name, user_hash as hash, updateIP as ip from Users where user_email = ${user.email} and user_pw = ${user.pw}`;
        conn = await db.getConnection();
        const [result] = await conn.query(loginQuery);
        conn.release();
        const accessToken = jwt.sign(result[0]);
        const refreshToken = jwt.refresh();
        const hash = '\''.concat('', result[0].hash).concat('', '\''); 
        const tokenkey = '\''.concat('', refreshToken).concat('', '\'');
        const jwtQuery = `insert into LogIn(user_id, user_hash, loginIP, plainText) values(${result[0].id}, ${hash}, ${result[0].ip}, ${tokenkey})`;
        conn = await db.getConnection();
        await conn.query(jwtQuery);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            data:{
                accessToken,
                refreshToken,
            }
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: false,
            code: 500,
            message: 'login error!',
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
        const query= `update Users set is_resigned = ${1}, updateAt = now() where user_hash = ${hash} and user_pw = ${user.pw} and user_name = ${user.name}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        conn = await db.getConnection();
        await conn.query(query);
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
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const getUserQuery = `select * from UserInfo where user_hash = ${hash}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        console.log(result[0]);
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
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const getUserQuery = `select * from Users where user_hash = ${hash}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        console.log(result[0]);
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
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const query1 = `select user_id as id, user_hash as hash, updateIP as ip from Users where user_pw = ${user.pw} and user_hash = ${hash}`;
        const query2 = `update Users set user_email = ${req.body.email}, phone = ${req.body.phone}, updateAt = now() where user_hash = ${hash} and user_pw = ${user.pw}`;
        console.log(query2);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0] == null)throw Error('unauthorized!');
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
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const query1 = `select user_id as id, user_hash as hash, updateIP as ip from Users where user_pw = ${user.pw} and user_hash = ${hash}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query1);
        console.log(result);
        conn.release();
        const query2 = `update UserInfo set school = ${req.body.school}, major = ${req.body.major}, MBTI = ${req.body.mbti} updateAt = now() where user_hash = ${hash}`;
        conn = await db.getConnection();
        await conn.query(query2);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            message : 'update profile',
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'account update error!',
        });
    }
})

// new password
// 새로운 비밀번호와 access token을 입력하면 새로운 비밀번호를 얻을 수 있다.
// 이메일, 비밀번호, access token 값 입력
router.put('/password', authJWT, async(req, res)=>{
 // 비밀번호를 새로운 비밀번호로 변경해준다
     let conn = null;
    try{
        const user = req.body;
        const hash = '\''.concat('', req.user_hash).concat('', '\''); 
        const query1 = `select user_id as id, user_hash as hash, updateIP as ip from Users where user_pw = ${user.pw} and user_hash = ${hash}`;
        const query2 = `update Users set user_pw = ${user.newpw}, updateAt = now() where user_hash = ${hash} and user_pw = ${user.pw}`;
        console.log(query2);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0] == null)throw Error();
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
router.get('/:userid', async(req, res)=>{
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

// checkToken
// Token이 유효한지 확인하는 코드
router.get('/checkToken', authJWT, async(req, res)=>{
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

// not checked this function 
// hash 값을 통해서 유저를 활성화시키는 함수
router.post('/activate/:userhash', async(req, res)=>{
    // use transaction
    try{
        const user = req.body;
        const getUserQuery = `select user_email from Users where user_hash = ${req.params.userhash}`;
        const updateQuery = `update Users set activate = 1, updateAt = now() where user_email = ${user.email}`;
        const UserInfoQuery = `insert into UserInfo(user_id, user_hash, school, major, mbti, evaluation) select user_id, user_hash, null, null, null, null from Users where user_email = ${user.email}`;
        const TimeTableQuery = `insert into TimeTable(user_id, user_hash, sun, mon, tue, wed, thur, fri, sat) select user_id, user_hash, '','','','','','','' from Users where user_email = ${user.email}`;
        conn = await db.getConnection();
        // start Transaction;
        const [result] = await conn.query(getUserQuery);
        if(result[0] == null)throw new Error('not match');
        await conn.query(updateQuery);
        await conn.query(UserInfoQuery);
        await conn.query(TimeTableQuery);
        await conn.commit();
        // end Transaction
        conn.release();
        return res.status(200).send({
            isSuccess: true,
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
            message : 'Activate user failed',
        });
    }
})

module.exports = router;

// 로그아웃은 로컬에서 token을 제거하는 것으로 가능하지 않을까
// // logout
// router.get('/logout', authJWT, async(req, res)=>{
//     let conn = null;
//     try{
//         const hash = '\''.concat('', req.user_hash).concat('', '\''); 
//         const query = `delete from LogIn where user_hash like ${hash}`;
//         console.log(req.user_hash);
//         conn = await db.getConnection();
//         await conn.query(query);
//         conn.release();
//         return res.status(200).send("logout!");
//     }catch(err){
//         return res.status(401).send("401 error : already not accessible token!");
//     }
// })