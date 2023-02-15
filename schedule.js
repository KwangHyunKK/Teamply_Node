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
    var string = req.body.member_id.substr(1, req.body.member_id.length-2);
    try{
        // proj member add 
        // user Transaction
        const query = `select Exists(select * from ProjectMember where user_id = ${req.user_id} and proj_id = ${sch.proj_id}) as success`;
        const query1 = `insert into Schedule(proj_id, sch_title, sch_num, sch_contents, sch_progress, sch_startAt, sch_endAt)
        select proj_id, ${sch.sch_title}, ${0}, ${sch.sch_contents}, ${sch.sch_progress}, ${sch.startAt}, ${sch.endAt} from Project where proj_id = ${sch.proj_id}`;
        const query2 = `select sch_id, proj_id from Schedule where proj_id = ${sch.proj_id} and sch_title = ${sch.sch_title}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result2] = await conn.query(query);
        if(result2[0].success == 0)throw Error('No authorized!'); // 다른 proj에 대한 권한이 없다
        const [result1] = await conn.query(query2);
        if(result1[0] != null)throw Error('already exist!');
        await conn.query(query1);
        const [result] = await conn.query(query2);
        const query3 = `insert into ScheduleMember(user_id, sch_id, proj_id) select user_id, sch_id, a.proj_id
        from (select * from ProjectMember where user_id in (${string})) 
        as a join (select sch_id, proj_id from Schedule where proj_id = ${sch.proj_id}) as b on a.proj_id = b.proj_id where sch_id = ${result[0].sch_id};`;
        await conn.query(query3);
        if(result[0] == null)throw Error('no update!');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            statuscode: 200,
            message: 'create schedule success',
            data: result,
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: false,
            statuscode: 500,
            message: 'create schedule fail',
            submessage: err.message,
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
        const query1 = `delete from ScheduleMember where sch_id = ${req.body.sch_id}`;
        const query2 = `select Exists(select * from ScheduleMember where sch_id = ${req.body.sch_id}) as success`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        await conn.query(query1);
        const [result] = await conn.query(query2);
        if(result[0].success != 0)throw Error("delete error!");
        // End Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send('200 ok');
    }catch(err){
        console.log('get user DB connection Error!');
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
        const query1 = `select Exists(select * from ScheduleMember where sch_id = ${sch.sch_id} and proj_id = ${sch.proj_id} and user_id = ${req.user_id}) as success`;
        const query2 = `update Schedule set sch_title = ${sch.sch_title}, sch_contents = ${sch.sch_contents}, sch_progress = ${sch.sch_progress}, 
        sch_endAt = ${sch.endAt} where sch_id = ${sch.sch_id} and proj_id = ${sch.proj_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('Not exist data!');
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            statuscode: 200,
            message: 'update schedule success',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: false,
            statuscode: 500,
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
        var string = req.body.member_id.substr(1, req.body.member_id.length-2);
        // user Transaction
        const query1 = `select Exists(select * from ScheduleMember where user_id in (${string}) and sch_id = ${req.body.sch_id}) as success`;
        const query2 = `insert into ScheduleMember(user_id, sch_id, proj_id) select user_id, sch_id, a.proj_id
        from (select * from ProjectMember where user_id in (${string})) 
        as a join (select sch_id, proj_id from Schedule where proj_id = ${sch.proj_id}) as b on a.proj_id = b.proj_id where sch_id = ${sch.sch_id};`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0].success != 0)throw Error(' already exist!');
        await conn.query(query2);
        const [result2] = await conn.query(query1);
        if(result2[0].success == 0)throw Error('');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            ok: true,
            statuscode: 200,
            message: 'create schedule member success',
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(500).send({
            ok: true,
            statuscode: 500,
            message: 'create schedule member fail',
            submessage: err.message,
        });
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
    }
})

router.delete('/member', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const string = req.body.member_id.substr(1, req.body.member_id.length-2);
        console.log(string);
        const query1 = `select Exists(select * from ScheduleMember where user_id = ${req.user_id} and sch_id = ${req.body.sch_id}) as success`
        const query2 = `delete from ScheduleMember where user_id in (${string}) and sch_id = ${req.body.sch_id}`;
        conn = await db.getConnection();
        // start Transaction
        await conn.beginTransaction();
        console.log(query1);
        console.log(query2);
        const [result_value] = await conn.query(query1);
        if(result_value[0].success == 0)throw Error('no authorization');
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: "Member delete complete!",
        });
    }catch(err){
        console.log('get user DB connection Error!');
        res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: "member delete fail!",
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
        const query1 = `select Exists(select * from Schedule where proj_id = ${req.params.projid} and sch_id = ${req.params.schid}) as success`
        const query2 = `select ProjectMember.user_id, user_name, user_email
        from ScheduleMember join ProjectMember on ScheduleMember.user_id = ProjectMember.user_id and ScheduleMember.proj_id = ProjectMember.proj_id
        where ScheduleMember.sch_id = ${req.params.schid}`;
        conn = await db.getConnection();
        // start Transactions
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0].succcess == 0)throw Error('No authorized!');
        const [result] = await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            } 
        });
    }catch(err){
        if(conn != null){
            await conn.rollback();
            conn.release();
        }
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            data:{
                message: '특정 Project의 Schedule 보기 실패',
            }
        });
    }
});

// check myschedule
router.get('/my', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select sch_id, proj_id, sch_title, sch_contents, sch_progress, date_format(sch_startAt, '%Y-%m-%d') as startAt, date_format(sch_endAt, '%Y-%m-%d') as endAt
        from Schedule where proj_id in (select proj_id from ScheduleMember where user_id = ${req.user_id});`;
        console.log(query);
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        console.log(result[0]);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            } 
        });
    }catch(err){
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            data:{
                message: 'My Project 보기 실패',
            }
        });
    }
});

router.get('/project/:projid', async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from Project where proj_id = ${req.params.projid})as success`;
        const query2 = `select sch_id, proj_id, sch_title, sch_contents,  date_format(sch_startAt, '%Y-%m-%d') as startAt, date_format(sch_endAt, '%Y-%m-%d') as endAt
        from Schedule where proj_id = ${req.params.projid};`
        conn = await db.getConnection();
        await conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0].success == 0)throw Error('Wrong proj_id');
        const [result] = await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            data:{
                result,
            } 
        });
    }catch(err){
        if(conn != null){
            await conn.rollback;
            conn.release();
        }
        return res.status(401).send({
            isSuccess: false,
            statuscode: 401,
            data:{
                message: 'Project 일정 보기 실패',
                submessage: err.message,
            }
        });
    }
});


module.exports = router;