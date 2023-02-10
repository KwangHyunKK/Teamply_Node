const mysql = require('mysql');
const conn = {
    host: process.env.mysql_host,
    port: process.env.mysql_port,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
}

let connection = mysql.createConnection(conn);
connection.connect();

checkDuplicateUser = (req, res, next) =>{
    let connection = mysql.createConnection(conn);
    connection.connect();
    try{
        const query = `select Exists (select * from Users where user_email = ${req.body.email}) as success`;
        connection.query(query, function(err, results, fields){
            if(err){
                return res.status(500).send({
                    ok: false,
                    message: 'checkDuplicateUser error!',
                });
            }
            if(results[0].success != 0){
                console.log(results[0]);
                return res.status(400).send({
                    ok: false,
                    message: 'The account is already exist!',
                });
            }
        connection.end();
            next();
        })
    }catch(err){
        connnection.end();
        return res.status(401).send({
            ok: false,
            message: '401 error from verifysignup',
        });
    }
}

module.exports = checkDuplicateUser;