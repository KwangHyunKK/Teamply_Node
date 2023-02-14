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
        const query= `update TimeTable set sun = ${req.body.sun}, mon = ${req.body.mon},tue = ${req.body.tue}, wed = ${req.body.wed}, 
        thur = ${req.body.thur}, fri = ${req.body.fri}, sat = ${req.body.sat} where user_id = ${req.user_id}`;
        conn = await db.getConnection();
        await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'update Timetable success',
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'update Timetable fail',
        });
    }
});

router.get(`/my`, authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query = `select sun, mon, tue, wed, thur, fri, sat from TimeTable where user_id = ${req.user_id}`;
        console.log(query);
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'Get Timetable success',
            data: result,
        });
    }catch(err){
        return res.status(500).send({
            isSuccess: false,
            message: 'update Timetable fail',
        });
    }
})

router.delete('/', authJWT, async(req, res)=>{
    let conn = null;
    try{
        const query1 = `select Exists(select * from TimeTable where user_id = ${req.user_id}) as success`;
        const query2 = `update TimeTable SET sun = ${0}, mon = ${0},tue = ${0}, wed = ${0}, thur = ${0}, fri = ${0}, sat = ${0} `;
        conn = await db.getConnection();
        // start transaction
        conn.beginTransaction();
        const [result] = await conn.query(query1);
        if(result[0] == null)throw Error();
        await conn.query(query2);
        // end Transaction
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            code: 200,
            message: 'delete Timetable success',
        });
    }catch(err){
        await conn.rollback();
        conn.release();
        return res.status(500).send({
            isSuccess: false,
            message: 'delete Timetable fail',
        });
    }
})
module.exports = router;
