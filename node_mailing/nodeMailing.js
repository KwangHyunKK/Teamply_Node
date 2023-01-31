const nodemailer = require('nodemailer');
//const { readFileSync, unlinkSync, stat, readdirSync } = require('fs');

let emailSubject = '';  //메일 제목
let emailHtml = '';     //메일 내용

function emailContent(subject, html){
    emailSubject = subject;
    emailHtml = html;
}

//메일 보내기
async function sendPDFMail(senderName,senderEmail,senderPass,senderSmtp,senderPort,receivers){

    // 수신자에게 메일 전송
    let transporter = nodemailer.createTransport({
        // 사용하고자 하는 서비스
        // service: 'gmail',

        host: senderSmtp,
        port: senderPort,
        auth: {
            user: senderEmail,
            pass: senderPass,
        }
    });

    await transporter.sendMail({
        // 보내는 곳의 이름과, 메일 주소를 입력
        from: `"`+senderName+`" `+senderEmail,
        // 받는 곳의 메일 주소를 입력
        to: receivers,
        // 보내는 메일의 제목을 입력
        subject: emailSubject,
        text: '메일링 테스트 중 입니다.',
        // 보내는 메일의 내용을 입력
        // text: 일반 text로 작성된 내용
        // text: 'just test text',
        // html: html로 작성된 내용
        html: emailHtml,
        // 첨부파일 정보 객체를 입력
        //attachments: attachList
    });
}


//예시
emailContent('[Teamply] 이메일 인증을 진행해주세요.',
    `<b>안녕하세요, 00님.</b> <br/>
        <b>아래의 [인증완료]버튼을 클릭하시면 이메일 인증이 되며 팀플리 회원가입이 완료됩니다.</b> <br/>
        <b>또는 아래의 [인증번호]를 입력하시면 이메일 인증이 되며 팀플리 회원가입이 완료됩니다.</b> <br/>
        <b>팀플리와 함께 즐거운 팀플되세요:) </b>`);

sendPDFMail('팀플리','teamply.official@gmail.com','moniebifmvppyatv','smtp.gmail.com',587,'skdud657145@gmail.com');