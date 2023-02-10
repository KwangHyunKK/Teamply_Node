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

router.put('/', authJWT, async(req,res)=>{
    let conn = null;
    try{
        const cut = (value) => {return value.substr(1, value.length - 2)};
        console.log(req.body.days);
        const query1 = `select * from TimeTable where user_id = ${req.user_id}`;
        const query2 = `update Timetable SET sun = ${cut(req.body.sun)}, mon = ${cut(req.body.mon)}, tue = ${cut(req.body.tue)}, `
        conn = await db.getConnection();
        const [result] = await conn.query(query1);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'all user read success!',
            data: result,
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'all user read fail!',
        });
    }
});

router.get('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const getUserQuery = `select * from TimeTable where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        const [result] = await conn.query(getUserQuery);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'all user read success!',
            data: result,
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'all user read fail!',
        });
    }
})

router.delete('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from TimeTable where user_id = ${req.user_id}) as success`;
        const query2 = ``;
        conn = await db.getConnection();
        // start transaction
        conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0] == null)throw Error();
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'all user read success!',
            data: result,
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(500).send({
            isSuccess: false,
            message: 'all user read fail!',
        });
    }
})
module.exports = router;
