const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 
const userRouter = require('./user');
const db = require('./db'); // erase : for check up
const server = app.listen(8080, '0.0.0.0', ()=>{
    console.log('Express Server start port 8080');
});

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get('/', async(req, res)=>{
    const getUserQuery = `select max(userId) as max from UserInfo`;
    conn = await db.getConnection();
    const [result] = await conn.query(getUserQuery);
    console.log(result);
    return res.status(200).send('200 ok');
})

app.use('/user', userRouter);