const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 
const userRouter = require('./user');
const projRouter = require('./project');
const schRouter = require('./schedule');
// const alarmRouter = require('./alarm');
const timetable = require('./timetable');
const crypto = require('crypto');
const email = require('./middleware/email');
const logger = require('./config/logger');
const morganMiddleware = require('./config/morganMiddleware');
const server = app.listen(3000, '0.0.0.0', ()=>{
    logger.info(`Server start Listening on port 3000`);
    console.log('Express Server start port 3000');
});

app.use(morganMiddleware);
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get('/', async(req, res)=>{
    try{
        return res.status(200).send('200 ok');
    }catch(err){
        return res.status(401).send("401 error!");
    }
})

app.get('/:email', async(req, res)=>{
    try{
        await email('팀플리',process.env.senderMail,process.env.senderPass,process.env.senderSmtp,process.env.Port,req.params.email, {"emailSubject" : 'Teamply 서버 구동 확인', 
        "emailHtml" : `<b>현재 팀플리 서버가 열심히 돌아가고 있습니다</b>`});
        return res.status(200).send('200 ok');
    }catch(err){
        return res.status(401).send("401 error!");
    }
})

app.use('/user', userRouter, email.sendActivateMail);
app.use('/project', projRouter);
app.use('/schedule', schRouter);
// app.use('/alarm', alarmRouter);
app.use('/timetable', timetable)