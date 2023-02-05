const express = require('express');
const router = express.Router();
const authJWT = require('./middleware/authJWT');
const crypto = require('crypto');
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

// create Project : post 
// 프로젝트를 생성하는 코드

router.post('/', authJWT, async(req, res)=>{
    let conn = null;
    const proj = req.body;
    try{
        // user Transaction
        const query1 = `select proj_id from Project where proj_name = ${proj.name} and proj_contents = ${proj.contents}`;
        const query2 = `insert into Project(proj_name, proj_headcount, proj_realcount, proj_startAt, proj_endAt, proj_contents) 
        Values(${proj.name}, ${proj.headcount}, ${0}, ${proj.startAt}, ${proj.endAt}, ${proj.contents})`;
        const query3 = `insert into ProjectMember(user_id, proj_id, user_name, user_email, proj_name, proj_contents, proj_color) 
        select user_id, proj_id, user_name, user_email, proj_name, proj_contents, ${proj.color}
        from Users join Project on Project.proj_name = ${proj.name} and Project.proj_contents = ${proj.contents}
        where Users.user_id = ${req.user_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0] != null)throw Error();
        await conn.query(query2);
        await conn.query(query3);
        const [result] = await conn.query(query1);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code:200,
            message: 'project create ok',
            data:{
                result,
            }
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'project create fail',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// change Project : update 
router.put('/', authJWT, async(req, res)=>{
    let conn = null;
    const proj = req.body;
    try{
        // user Transaction
        const query1 = `select user_id from ProjectMember where user_id = ${req.user_id} and proj_id = ${proj.proj_id}`;
        const query2 = `update ProjectMember set proj_name = ${proj.proj_name}, proj_contents = ${proj.proj_contents}, proj_color = ${proj.proj_color}, updateAt = now() where user_id = ${req.user_id} and proj_id = ${proj.proj_id}`;
        console.log(query1);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].user_id == null)throw Error();
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'project update ok',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(401).send({
            isSuccess: true,
            code: 401,
            message: 'project update error!',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// delete ProjectMembers
router.delete('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        // user Transaction
        const query1 = `delete from ScheduleMember where user_id = ${req.user_id} and proj_id = ${req.body.proj_id}`;
        const query2 = `delete from ProjectMember where user_id = ${req.user_id} and proj_id = ${req.body.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        await conn.query(query1);
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 500,
            message: 'project delete ok',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            isSuccess: true,
            code: 500,
            message: 'project delete error!',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// code create
// 초대 코드 생성하는 함수
router.post('/code', authJWT, async(req, res)=>{
    let conn = null;
    try{
        // user Transaction
        const query1 = `select in_hash from (select * from ProjInvite where proj_id = ${req.body.proj_id}) as a join
        (select * from ProjectMember where proj_id = ${req.body.proj_id} and user_id = ${req.user_id}) as b on 
        a.proj_id = b.proj_id`;
        const query2 = `insert into ProjInvite(in_hash, proj_id, is_timeless) select left(sha1(concat(proj_name, proj_startAt)), 9), proj_id, 0 From Project where proj_id = ${req.body.proj_id}`;
        conn = await db.getConnection();
        // start Transactions
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0] != null)throw Error('alreay Exist!');
        await conn.query(query2);
        const [result2] = await conn.query(query1);
        if(result2[0] == null)throw Error('wrong proj_id');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'create project invite code ok',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            isSuccess: true,
            code: 500,
            message: err.message,
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// code get
// 초대 코드를 얻는 함수
router.get('/code/:projid', async(req, res)=>{
    let conn = null;
    try{
        // user Transaction
        const query1 = `select in_hash as code from ProjInvite where proj_id = ${req.params.projid}`;
        conn = await db.getConnection();
        // start Transactions
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        console.log(result[0]);
        if(result[0] == null)throw Error('No code is exist');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data : {
                result,
            },
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            isSuccess: false,
            code: 500,
            message: err.message,
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// invite new member
// 초대 코드를 입력해서 입장
router.post('/admission', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `insert into ProjectMember(user_id, proj_id, user_name, user_email, proj_name, proj_contents, proj_color) 
        select user_id, proj_id, user_name, user_email, proj_name, proj_contents, ${req.body.color}
        from Users join Project on Project.proj_id = (select proj_id from ProjInvite where in_hash = ${req.body.invite_code})
        where Users.user_id = ${req.user_id}`;
        console.log(query);
        conn = await db.getConnection();
        await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'admission success',
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'admission fail',
        });
    }
})

// check
// check myproj
router.get('/my', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select proj_id, proj_name, proj_headcount, proj_startAt, proj_endAt, proj_contents from Project where proj_id 
        in (select proj_id from ProjectMember where user_id = ${req.user_id});`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            code: 400,
            message: 'Bad request',
        });
    }
});

// check 
// check projmember
router.get('/member/:projid', async(req, res)=>{
    let conn = null;
    try{
        const query = `select user_id, user_name, user_email from ProjectMember where proj_id = ${req.params.projid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            code: 400,
            message: 'Bad request',
        });
    }
});

// check
// check every proj
router.get('/:projid', async(req, res)=>{
    let conn = null;
    try{
        const query = `select * from Project where proj_id = ${req.params.projid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            code: 400,
            message: 'Bad request',
        });
    }
});

router.get('/:startid/~/:endid', async(req, res)=>{
    let conn = null;
    try{
        const query = `select * from Project where proj_id < ${req.params.endid} and proj_id >= ${req.params.startid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            code: 400,
            message: 'Bad request',
        });
    }
});


module.exports = router;