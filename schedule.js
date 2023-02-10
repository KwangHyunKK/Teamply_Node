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

// create schedule : post 
router.post('/', authJWT, async(req, res)=>{
    let conn = null;
    const sch = req.body;
    try{
        // proj member add 
        // user Transaction
        const query1 = `insert into Schedule(proj_id, sch_title, sch_num, sch_contents, sch_progress, sch_startAt, sch_endAt)
        select proj_id, ${sch.sch_title}, ${0}, ${sch.sch_contents}, ${sch.sch_progress}, ${sch.startAt}, ${sch.endAt} from Project where proj_id = ${sch.proj_id}`;
        const query2 = `select sch_id, proj_id from Schedule where sch_id = last_insert_id()`;
        console.log(query1);
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        await conn.query(query1);
        const [result] = await conn.query(query2);
        if(result[0] == null)throw Error();
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            code: 200,
            message: 'create schedule success',
            data: result,
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: false,
            code: 500,
            message: 'create schedule fail',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// delete schedule
router.delete('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        // user Transaction
        const query1 = `delete from ScheduleMember where user_id = ${req.user_id} and proj_id = ${req.body.proj_id} and sch_id = ${req.body.sch_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        await conn.query(query1);
        await conn.commit();
        conn.release();
        return res.status(200).send('200 ok');
    }catch(err){
        console.log('get user DB connection Error!');
        console.log(message);
        res.status(404).send('404 error!');
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// change shedule
router.put('/', authJWT, async(req, res)=>{
    let conn = null;
    const sch = req.body;
    try{
        // proj member add 
        const users = req.body.proj_member;
        // user Transaction
        const query1 = `select user_id from ScheduleMember where sch_id = ${sch.sch_id} and proj_id = ${sch.proj_id} and user_id = ${req.user_id}`;
        const query2 = `update Schedule set sch_title = ${sch.sch_title}, sch_contents = ${sch.sch_contents}, sch_progress = ${sch.sch_progress}, 
        sch_startAt = ${sch.startAt}, sch_endAt = ${sch.endAt} where sch_id = ${sch.sch_id} and proj_id = ${sch.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0] ==  null)throw Error('Not exist data!');
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            code: 200,
            message: 'update schedule success',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: false,
            code: 500,
            message: 'update schedule fail',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
});

router.post('/member', authJWT, async(req, res)=>{
    let conn = null;
    const sch = req.body;
    try{
        // proj member add 
        var string = req.body.user_id.substr(1, req.body.user_id.length-2);
        // user Transaction
        const query1 = `select user_id from ScheduleMember where sch_id = ${sch.sch_id} and proj_id = ${sch.proj_id}`;
        const query2 = `insert into ScheduleMember(user_id, sch_id, proj_id) select user_id, sch_id, a.proj_id
        from (select user_id, proj_id from ProjectMember where user_id in (${string})) 
        as a join (select sch_id, proj_id from Schedule where proj_id = ${sch.proj_id}) as b on a.proj_id = b.proj_id where sch_id = ${sch.sch_id};`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0] != null)throw Error(' already exist!');
        await conn.query(query2);
        const [result2] = await conn.query(query1);
        if(result2[0] == null)throw Error();
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            code: 200,
            message: 'create schedule member success',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: true,
            code: 500,
            message: 'create schedule member fail',
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

// check schedule member
router.get('/member/:projid/:schid', async(req, res)=>{
    let conn = null;
    try{
        const query = `select a.user_id, user_name, user_email
        from (select * from ScheduleMember where sch_id = ${req.params.schid} and proj_id = ${req.params.projid}) as a join 
        (select * from ProjectMember where proj_id = ${req.params.projid}) as b on a.user_id = b.user_id;`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(401).send("401 error");
    }
});

// check myschedule
router.get('/my', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select sch_id, proj_id, sch_title, sch_intro, sch_progress, sch_startAt, sch_endAt
        from Schedule where proj_id in (select proj_id from ScheduleMember where user_id = ${req.user_id});`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        console.log(result[0]);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(401).send("401 error");
    }
});

router.get('/', async(req, res)=>{
    let conn = null;
    try{
        const query = `select * from Schedule join ScheduleMember on Schedule.proj_id = ScheduleMember.proj_id where projd_id = ${projid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send(result);
    }catch(err){
        return res.status(401).send("401 error");
    }
});


module.exports = router;