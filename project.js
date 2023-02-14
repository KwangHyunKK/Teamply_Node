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
        Values(${proj.name}, ${proj.headcount}, ${1}, ${proj.startAt}, ${proj.endAt}, ${proj.contents})`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0] != null)throw Error(`Same Project is already exists! : get my Project`);
        await conn.query(query2);
        const [result] = await conn.query(query1);
        const query3 = `insert into ProjectMember(user_id, proj_id, user_name, user_email, proj_name, proj_contents, proj_color) 
        select user_id, proj_id, user_name, user_email, proj_name, proj_contents, ${proj.color}
        from Users join Project on Project.proj_id = ${result[0].proj_id}
        where Users.user_id = ${req.user_id}`;
        const query4 = `insert into ProjInvite(in_hash, proj_id, is_timeless) select left(sha1(concat(proj_name, createAt)), 9), proj_id, 0 From Project where proj_id = ${result[0].proj_id}`;
        await conn.query(query3);
        await conn.query(query4);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode:200,
            message: 'Project Create Success',
            data:{
                result,
            }
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: 'project create fail',
            submessage: err.message,
        });
    }
})

// change Project : update 
router.put('/', authJWT, async(req, res)=>{
    let conn = null;
    const proj = req.body;
    try{
        // user Transaction
        const query1 = `select Exists (select * from ProjectMember where user_id = ${req.user_id} and proj_id = ${proj.proj_id}) as success`;
        const query2 = `update ProjectMember set proj_name = ${proj.proj_name}, proj_contents = ${proj.proj_contents}, proj_color = ${proj.proj_color}, is_Finished = ${proj.is_Finished}, updateAt = now() where user_id = ${req.user_id} and proj_id = ${proj.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('No Project : Create project please!');
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'Project Update Success',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            message: 'Project Update fail',
            submessage: err.message,
        });
    }
})

// delete ProjectMembers
router.delete('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        // user Transaction
        const query1 = `delete from ScheduleMember where user_id = ${req.user_id} and proj_id = ${req.body.proj_id}`;
        const query2 = `delete from UserReview where user_id = ${req.user_id} and proj_id = ${req.body.proj_id}`;
        const query3 = `delete from ProjectMember where user_id = ${req.user_id} and proj_id = ${req.body.proj_id}`;
        const query4 = `update Project set proj_realcount = proj_realcount - 1, updateAt = now() where proj_id = ${req.body.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        await conn.query(query1);
        await conn.query(query2);
        await conn.query(query3);
        await conn.query(query4);
        // end Transaction 
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 500,
            message: 'Project Delete Success!',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: 'Project Delete Fail!',
        });
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
        const query2 = `insert into ProjInvite(in_hash, proj_id, is_timeless) select left(sha1(concat(proj_name, createAt)), 9), proj_id, 0 From Project where proj_id = ${req.body.proj_id}`;
        conn = await db.getConnection();
        // start Transactions
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0] != null)throw Error('Invite Code is already exist! : Check your invite code');
        await conn.query(query2);
        const [result2] = await conn.query(query1);
        if(result2[0] == null)throw Error('Your project id is not correct : Check your project id');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'Create project invite code Success!',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: 'Create project invite code Fail',
            submessage: err.message,
        });
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
        if(result[0] == null)throw Error('Code is not exist : Check your invite code');
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data : {
                result,
            },
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: err.message,
        });
    }
})

// invite new member
// 초대 코드를 입력해서 입장
router.post('/admission', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select proj_id from ProjInvite where in_hash = ${req.body.invite_code}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error('No Project with your invite code : Check invite code');
        const query1 = `select Exists(select * from ProjectMember where proj_id = ${result[0].proj_id} and user_id = ${req.user_id}) as success`;
        const query2 = `insert into ProjectMember(user_id, proj_id, user_name, user_email, proj_name, proj_contents, proj_color) 
        select user_id, proj_id, user_name, user_email, proj_name, proj_contents, ${req.body.color}
        from Users join Project on Project.proj_id = ${result[0].proj_id}
        where Users.user_id = ${req.user_id}`;
        const query3 = `update Project set proj_realcount = proj_realcount + 1 where proj_id = ${result[0].proj_id}`;
        const [result1] = await conn.query(query1);
        if(result1[0].success != 0)throw Error('Already Join Project!');    
        await conn.query(query2);
        await conn.query(query3);
        // end Transaction
        await conn.commit();
        conn.release();
        // 메일 보내기
        // mail.sendEMail('팀플리',process.env.senderMail,process.env.senderPass,process.env.senderSmtp,process.env.Port, process.env.email1, mail.//(user.name, code));
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'admission success',
        });
    }catch(err){
        if(conn != null){
            await conn.rollback();
            conn.release();
        }
        return res.status(500).send({
            isSuccess: false,
            code: 500,
            message: 'admission fail',
            submessage: err.message,
        });
    }
})

// check
// check myproj
router.get('/my', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select p.proj_id, p.proj_name, p.proj_contents, proj_realcount, date_format(proj_startAt, '%Y-%m-%d') as startAt, date_format(proj_endAt, '%Y-%m-%d') as endAt, proj_color as color 
        from Project join ProjectMember as p on Project.proj_id = p.proj_id where p.user_id = ${req.user_id} and Project.is_Finished = ${0}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
            message: 'Bad request',
        });
    }
});

router.get('/my/color', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select proj_color as color from ProjectMember where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
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

router.post('/my/finish', authJWT, async(req, res)=>{
    let conn = null;
    const proj = req.body;
    try{
        // user Transaction
        const query1 = `select Exists (select * from ProjectMember where user_id = ${req.user_id} and proj_id = ${proj.proj_id}) as success`;
        const query2 = `update ProjectMember set is_Finished = ${1}, updateAt = now() where user_id = ${req.user_id} and proj_id = ${proj.proj_id}`;
        const query3 = `insert into CompletedProject(user_id, proj_id, comments1, comments2, comments3, comments4) 
        select user_id, proj_id, '','','','' from ProjectMember where user_id = ${req.user_id} and proj_id = ${proj_proj_id};`
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('No Project : Create project please!');
        await conn.query(query2);
        await conn.query(query3);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'Project Update Success',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            message: 'Project Update fail',
            submessage: err.message,
        });
    }
})

router.put('/my/finish', authJWT, async(req, res)=>{
    let conn = null;
    const proj = req.body;
    try{
        // user Transaction
        const query1 = `select Exists (select * from CompletedProject where user_id = ${req.user_id} and proj_id = ${proj.proj_id}) as success`;
        const query2 = `update CompletedProject set comments1 = ${proj.comments1}, comments2 = ${proj.comments2}, comments3 = ${proj.comments3}, comments4 = ${proj.comments4},
        updateAt = now() where user_id = ${req.user_id} and proj_id = ${proj.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('No Project : Create project please!');
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'Project Update Success',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            message: 'Project Update fail',
            submessage: err.message,
        });
    }
})

router.get('/my/finish', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select p.proj_id, p.proj_name, p.proj_contents, proj_realcount, date_format(proj_startAt, '%Y-%m-%d') as startAt, date_format(proj_endAt, '%Y-%m-%d') as endAt
        from Project join ProjectMember as p on Project.proj_id = p.proj_id where p.user_id = ${req.user_id} and Project.is_Finished = ${1}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
            message: 'Bad request',
        });
    }
});

router.get('/my/finish/comments', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select comments1, comments2, comments3, comments4 from CompletedProject where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
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
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
            message: 'Bad request',
        });
    }
});

// check
// check every proj
router.get('/:projid', async(req, res)=>{
    let conn = null;
    try{
        const query = `select * from Project join ProjectMember on Project.proj_id = ProjectMember.proj_id where Project.proj_id = ${req.params.projid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        if(result[0] == null)throw Error();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
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
            statuscode: 200,
            data:{
                result,
            },
        });
    }catch(err){
        return res.status(400).send({
            isSuccess: true,
            statuscode: 400,
            message: 'Bad request',
        });
    }
});

module.exports = router;