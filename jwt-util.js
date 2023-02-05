const promisify = require('util');
const jwt = require('jsonwebtoken');
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
const dotenv = require("dotenv");
dotenv.config();
const secret = process.env.secretkey;
const refreshkey = process.env.refreshkey;

// Issue access token 
const sign = (user) =>{
    const payload = {
        id : user.id,
        hash: user.hash,
        ip: user.ip,
    };

    return jwt.sign(payload, secret, {
        algorithm:'HS256',
        expiresIn: '1d',
    });
};

// verify access token
const verify = (token) => {
    let decoded = null;
    try{
        decoded = jwt.verify(token, secret);
        return{
            ok: true,
            id : decoded.id,
            hash: decoded.hash,
            ip: decoded.ip,
        };
    }catch(err){
        return{
            ok: false,
            message: err.message,
        };
    }
};

// issue refresh token
const refresh = () =>{
    return jwt.sign({}, refreshkey, {
        algorithm: 'HS256',
        expiresIn:'21d',
    })
};

// verify refreshtoken
refreshVerify = async (token, user_hash) =>{
    const conn = null;
    try{
        const query = `select plainText from LogIn where user_hash = ${user_hash} order by id desc`;
        console.log(query);
        conn = await db.getConnection();
        const [result] = await conn.query(query);
        console.log(result[0]);
        conn.release();
        if(result[0]){
            try{
                jwt.verify(token, refreshkey);
                return true;
            }catch(err){
                return false;
            }
        }else{
            return false;
        }
    }catch(err){
        return false;
    }
}

module.exports = {sign, verify, refresh, refreshVerify};