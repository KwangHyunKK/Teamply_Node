const express = require('express');
const router = express.Router();
const authJWT = require('./middleware/authJWT');
const upload = require('./file');
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

router.post('/img', authJWT, upload.single('file'), async(req, res, next)=>{
    let conn = null;
    try{
        const str = req.file.originalname.split('.');
        const query1 = `delete from PhotoFile where user_id = ${req.user_id}`;
        const query2 = `insert into PhotoFile(user_id, file_type, file_name) Values(${req.user_id}, ${str[1]}, ${req.file.originalname});`;
        conn = await db.getConnection();
        await conn.beginTransaction();
        await conn.query(query1);
        await conn.query(query2);
        await conn.commit();
        conn.release();
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: '파일 업로드 성공!',
        });
    }catch(err){
        if(conn!=null){
            await conn.rollback();
            conn.release();
        }
        return res.statusCode(400).send({
            isSuccess: false,
            statuscode:400,
            message: '파일 업로드 실패!',
        });
    }
})

router.get('/img/:userid', authJWT, async(req, res, next)=>{
    let conn = null;
    try{
        const query = `select file_name from PhotoFile where userid = ${req.params.userid}`;
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        conn.release();
        const stream = fs.createReadStream(`./uploads/${result[0].file_name}`);
        res.setHeader('Content-Disposition', `attachment; filename=${result[0].file_name}`);
        stream.pipe(res);
    }catch(err){
        return res.statusCode(400).send({
            isSuccess: false,
            statuscode:400,
            message: '파일 다운로드 실패!',
        });
    };
})

module.exports = router;