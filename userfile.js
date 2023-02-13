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
        // const query = `insert `
        console.log(req.file.originalname);
        return res.status(200).send({
            isSuccess: true,
            statuscode: 200,
            message: '파일 업로드 성공!',
        });
    }catch(err){
        return res.statusCode(400).send({
            isSuccess: false,
            statuscode:400,
            message: '파일 업로드 실패!',
        });
    }
})

router.get('/img', authJWT, (req, res, next)=>{
    let conn = null;
    try{

    }catch(err){
        
    }
    const stream = fs.createReadStream(`./uploads/${req.params.filename}`);
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.filename}`);
    stream.pipe(res);
})

module.exports = router;