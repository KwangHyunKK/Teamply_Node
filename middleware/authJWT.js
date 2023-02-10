const {verify} = require('../jwt-util');
const ip_util = require('../ip');
const requestIP = require('request-ip');
const authJWT = (req, res, next) => {
    if (req.headers.authorization) {
        const ip = ip_util.inet_aton(requestIP.getClientIp(req));
        const auth = req.headers.authorization.split('Bearer ') [1]; // header에서 access token을 가져옵니다.
        const token = auth.substr(0, auth.length - 1);
        const result = verify(token); // token을 검증합니다.
        if (result.ok && ip == result.ip) { 
            req.user_id = result.id; // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
            req.user_hash = result.hash;
            req.ip = result.ip;
            next();
        } else if(result.ip != ip) {
            res.status(401).send({
                isSuccess: false,
                message: 'Login from different IP address!',
            })
        }else { // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
            res.status(401).send({
            isSuccess: false,
            message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        });
        }
    }
};

module.exports = authJWT;