const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 
const userRouter = require('./user');
const projRouter = require('./project');
const schRouter = require('./schedule');
const alarmRouter = require('./alarm');
const email = require('./middleware/email');
const server = app.listen(8080, '0.0.0.0', ()=>{
    console.log('Express Server start port 8080');
});

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
    //     emailContent = '[Teamply] 이메일 인증을 진행해주세요.',
    // `<b>안녕하세요, 00님.</b> <br/>
    //     <b>아래의 [인증완료]버튼을 클릭하시면 이메일 인증이 되며 팀플리 회원가입이 완료됩니다.</b> <br/>
    //     <b>또는 아래의 [인증번호]를 입력하시면 이메일 인증이 되며 팀플리 회원가입이 완료됩니다.</b> <br/>
    //     <b>팀플리와 함께 즐거운 팀플되세요:) </b>`;
        //await email('팀플리',process.env.senderMail,process.env.senderPass,process.env.senderSmtp,process.env.Port,req.params.email, emailContent);
        return res.status(200).send('200 ok');
    }catch(err){
        return res.status(401).send("401 error!");
    }
})

app.use('/user', userRouter, email.sendActivateMail);
app.use('/project', projRouter);
app.use('/schedule', schRouter);
app.use('/alarm', alarmRouter);