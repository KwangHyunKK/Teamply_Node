const multer = require('multer'); // 파일 업로드를 위한
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb){ // destination : 업로드 한 파일 저장할 위치 : string ex) '/tmp/uploads'
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
         // 파일 이름
        const str = file.originalname.split('.');
        cb(null, str[0] + '_' + '.' + str[1]);
    }
});

function fileFilter (req, file, cb) {
    const typeArray = file.mimetype.split('/');
    const fileType = typeArray[1];

    if (fileType == 'jpg' || fileType == 'png' || fileType == 'jpeg' || fileType == 'gif' || fileType == 'webp') {
        req.fileValidationError = null;
        cb(null, true);
    } else {
        req.fileValidationError = "jpg,jpeg,png,gif,webp 파일만 업로드 가능합니다.";
        cb(null, false)
    }
}

const upload = multer({
    storage:storage,
    limits: {fileSize:1 * 1024 * 1024},
    fileFilter: fileFilter
});

module.exports = upload;