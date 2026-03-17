let userController = require('../controllers/users')
let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')

// Đọc public key để verify token RS256
let publicKey = fs.readFileSync(path.join(__dirname, '../public.key'));

module.exports = {
    CheckLogin: async function (req, res, next) {
        let key = req.headers.authorization;
        if (!key) {
            if (req.cookies.LOGIN_NNPTUD_S3) {
                key = req.cookies.LOGIN_NNPTUD_S3;
            } else {
                res.status(401).send("ban chua dang nhap")
                return;
            }
        }

        // Hỗ trợ cả dạng "Bearer <token>"
        if (key.startsWith('Bearer ')) {
            key = key.slice(7);
        }

        try {
            // Verify bằng public key với thuật toán RS256
            let result = jwt.verify(key, publicKey, { algorithms: ['RS256'] })
            if (result.exp * 1000 < Date.now()) {
                res.status(401).send("ban chua dang nhap")
                return;
            }
            let user = await userController.GetUserById(result.id);
            if (!user) {
                res.status(401).send("ban chua dang nhap")
                return;
            }
            req.user = user;
            next();
        } catch (error) {
            res.status(401).send("ban chua dang nhap")
            return;
        }
    }
}