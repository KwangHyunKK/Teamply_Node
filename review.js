const express = require('express');
const router = express.Router();
const authJWT = require('./middleware/authJWT');
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

// 중간 평가 생성
router.post('/middle', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from UserReview where reviewer_id = ${req.user_id} and user_id = ${req.body.user_id} and is_Final = ${0}) as success`;
        const query2 = `insert into UserReview(reviewer_id, user_id, proj_id, is_Final, comments)
        select a.user_id, b.user_id, b.proj_id, ${0}, ${req.body.comments} from ProjectMember as a join ProjectMember as b on a.proj_id = b.proj_id and a.user_id != b.user_id
        where a.proj_id = ${req.body.proj_id} and a.user_id = ${req.user_id} and b.user_id = ${req.body.user_id}`;
        const query3 = `select ur_id from UserReview where reviewer_id = ${req.user_id} and user_id = ${req.body.user_id} and is_Final = ${0}`;
        console.log(query2);
        conn = await db.getConnection();
        conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0].success == 1)throw Error('Already Exist!');
        await conn.query(query2);
        const [result] = await conn.query(query3);
        if(result[0] == null)throw Error('Check user please!');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statusCode: 200,
            message: 'Create Middle Review Success!',
            data: result,
        })
    }catch(err){
        if(conn != null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statusCode: 400,
            message: 'Create Middle Review Fail!',
            submessage: err.message,
        })
    }
})

// 내가 작성한 리뷰 보기
router.get('/fromme', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select ur_id as review_id, user_id, proj_id, comments, date_format(createAt, '%Y-%m-%d') as createAt, date_format(updateAt, '%Y-%m-%d') as updateAt from UserReview where reviewer_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess:true,
            statusCode: 200,
            message: 'Get Review success!',
            data: result,
        })
    }catch(err){
        return res.status(400).send({
            isSuccess:false,
            statusCode:400,
            message: 'Get Review fail!',
        })
    }
})

// 남들이 나에게 한 리뷰 보기
router.get('/tome', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select proj_id, comments, date_format(createAt, '%Y-%m-%d') as createAt, date_format(updateAt, '%Y-%m-%d') as updateAt from UserReview where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess:true,
            statusCode: 200,
            message: 'Get Review success!',
            data: result,
        })
    }catch(err){
        return res.status(400).send({
            isSuccess:false,
            statusCode:400,
            message: 'Get Review fail!',
        })
    }
})

// 평가 업데이트
router.put('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from UserReview where ur_id = ${req.body.review_id}) as success`;
        const query2 = `update UserReview set comments = ${req.body.comments} where ur_id = ${req.body.review_id}`;
        conn = await db.getConnection();
        conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0].success == 0)throw Error('No data');
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: 'update success!',
        })
    }catch(err){
        if(conn != null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statuscode: 400,
            message: 'update fail!',
            submessage: err.message,
        })
    }
})

// 기말 평가 생성
router.post('/final', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from UserReview where reviewer_id = ${req.user_id} and user_id = ${req.body.user_id} and is_Final = ${1}) as success`;
        const query2 = `insert into UserReview(reviewer_id, user_id, proj_id, is_Final, comments)
        select a.user_id, b.user_id, b.proj_id, ${1}, ${req.body.comments} from ProjectMember as a join ProjectMember as b on a.proj_id = b.proj_id and a.user_id != b.user_id
        where a.proj_id = ${req.body.proj_id} and a.user_id = ${req.user_id} and b.user_id = ${req.body.user_id}`;
        const query3 = `select ur_id from UserReview where reviewer_id = ${req.user_id} and user_id = ${req.body.user_id} and is_Final = ${1}`;
        console.log(query2);
        conn = await db.getConnection();
        conn.beginTransaction();
        const [result1] = await conn.query(query1);
        if(result1[0].success == 1)throw Error('Already Exist!');
        await conn.query(query2);
        const [result] = await conn.query(query3);
        if(result[0] == null)throw Error('Check user please!');
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statusCode: 200,
            message: 'Create Final Review Success!',
            data: result,
        })
    }catch(err){
        if(conn != null){
            await conn.rollback();
            conn.release();
        }
        return res.status(400).send({
            isSuccess: false,
            statusCode: 400,
            message: 'Create Final Review Fail!',
            submessage: err.message,
        })
    }
})

module.exports = router;