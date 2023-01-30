const nodemailer = require('nodemailer');
const { readFileSync, unlinkSync, stat, readdirSync } = require('fs');

//const pdfFolderPath = "./pdfPath/";

const emailSubject = "[테스트]제목입니다.";
const emailHtml =
    `<b>(테스트)내용입니다.</b>
<br/>
<b>첨부된 PDF 파일들을 다운로드하세요.</b>`;

// PDF 파일을 메일에 첨부하여 보낸 뒤 삭제.
async function sendPDFMail(senderName,senderEmail,senderPass,senderSmtp,senderPort,receivers){

    /*
    matchedFileList = ['one.pdf','two.pdf'];
    // 첨부파일 리스트
    let attachList = [];
    for (let j = 0; j < matchedFileList.length; j++) {
        const matchFile = matchedFileList[j];
        attachList.push({
            filename: matchFile,
            content: new Buffer(readFileSync(pdfFolderPath + matchFile), 'base64'),
            contentType: 'application/pdf'
        });
    }
    */

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


    // PDF 파일 삭제
    /*
    for (let j = 0; j < matchedFileList.length; j++) {
        const matchFile = matchedFileList[j];
        stat(pdfFolderPath + matchFile,(err,stat)=>{
            if(err == null){
                unlinkSync(pdfFolderPath + matchFile);
                console.log('PDF deleted');
            }else if(err.code === 'ENOENT'){
                console.log('---Delete Error! NO PDF FILE---');
            }else {
                console.log('Delete error code : ' + err.code);
            }
        });
    }
    */
}

sendPDFMail('팀플리','nayoung657145@gmail.com','yekersrhhqoqfies','smtp.gmail.com',587,'skdud657145@gmail.com');