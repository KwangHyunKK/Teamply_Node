const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 
const userRouter = require('./user');
const projRouter = require('./project');
const schRouter = require('./schedule');
// const alarmRouter = require('./alarm');
const timetable = require('./timetable');
const crypto = require('crypto');
const logger = require('./config/logger');
const morganMiddleware = require('./config/morganMiddleware');
const reviewRouter = require('./review'); // where is reviewRouter?
const userfileRouter = require('./userfile');
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

app.use('/user', userRouter);
app.use('/project', projRouter);
app.use('/schedule', schRouter);
app.use('/timetable', timetable);
app.use('/review', reviewRouter);
app.use('/userfile', userfileRouter);
