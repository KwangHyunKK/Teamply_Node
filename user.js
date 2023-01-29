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

// verifysignup
const verifysignup = require('./middleware/verifysignup');
const ip_util = require('./ip');
// email

// login with E_mail & pw
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
        const name = '\''.concat('', result[0].name).concat('', '\'');
        const tokenkey = '\''.concat('', refreshToken).concat('', '\'');
        const jwtQuery = `insert into LogIn(user_id, user_hash, loginIP, plainText) values(${result[0].id}, Sha1(${name}), ${result[0].ip}, ${tokenkey})`;
        console.log(jwtQuery);
        conn = await db.getConnection();
        await conn.query(jwtQuery);
        conn.release();
        return res.status(200).send({
            ok: true,
            data:{
                accessToken,
                refreshToken,
            }
        });
    }catch(err){
        return res.status(401).send('401 error');
    }
})

// signup
// verifysignup add  check
router.post('/', verifysignup, async(req, res)=>{
    // email, phonenumber
    let conn = null;
    try{
        const user = req.body;
        console.log(user);
        const ip = ip_util.inet_aton(requestIP.getClientIp(req));
        // const query = 'insert into teamply.Users(user_hash, user_name, user_email, user_pw, phone, accessConsent, serviceConsent, createIP, updateIP, activate) Values(Sha1(\'홍길동\'), \'홍길동\', \'user1@naver.com\',\'password\', \'01043482832\', 1, 1, inet_aton(\'209.207.224.40\'),inet_aton(\'209.207.242.43\'), 1)';
        
        const signupQuery = `insert into Users(user_hash, user_name, user_email, user_pw, phone, accessConsent, serviceConsent, createIP, updateIP, activate) values(Sha1(${user.name}), ${user.name}, ${user.email}, ${user.pw}, ${user.phone}, ${user.accessConsent}, ${user.serviceConsent}, ${ip},${ip}, ${0})`;
        console.log(signupQuery);
        conn = await db.getConnection();
        await conn.query(signupQuery);
        conn.release();
        return res.status(200).send('200 okay');
    }catch(err){
        return res.status(401).send('401 error');
    }
});

router.get('/refresh', refresh);

// check
router.get('/', async(req, res)=>{
    let conn = null;
    try{
        const getUserQuery = `select * from Users`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        console.log(result[0]);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(401).send("401 error");
    }
});
module.exports = router;