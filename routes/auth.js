var express = require("express");
var router = express.Router();
let userController = require('../controllers/users')
let { RegisterValidator, ChangePasswordValidator, validationResult } = require('../utils/validatorHandler')
let { CheckLogin } = require('../utils/authHandler')
let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')

// Đọc cặp khóa RSA 2048-bit
let privateKey = fs.readFileSync(path.join(__dirname, '../private.key'));
let publicKey = fs.readFileSync(path.join(__dirname, '../public.key'));

router.post('/register', RegisterValidator, validationResult, async function (req, res, next) {
    try {
        let newItem = await userController.CreateAnUser(
            req.body.username, req.body.password, req.body.email,
            "69af870aaa71c433fa8dda8e"
        )
        res.send(newItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
})

router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let result = await userController.FindUserByUsername(username);
        if (!result) {
            res.status(403).send("sai thong tin dang nhap");
            return;
        }
        if (result.lockTime > Date.now()) {
            res.status(404).send("ban dang bi ban");
            return;
        }
        result = await userController.CompareLogin(result, password);
        if (!result) {
            res.status(403).send("sai thong tin dang nhap");
            return;
        }
        // Ký token bằng RS256 với private key
        let token = jwt.sign(
            { id: result._id },
            privateKey,
            {
                expiresIn: '1d',
                algorithm: 'RS256'
            }
        )
        res.cookie("LOGIN_NNPTUD_S3", token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        })
        res.send(token)

    } catch (err) {
        res.status(400).send({ message: err.message });
    }
})

router.get('/me', CheckLogin, function (req, res, next) {
    let user = req.user;
    res.send(user)
})

router.post('/logout', CheckLogin, function (req, res, next) {
    res.cookie("LOGIN_NNPTUD_S3", "", {
        maxAge: 0,
        httpOnly: true
    })
    res.send("da logout ")
})

// Đổi mật khẩu - yêu cầu đăng nhập
router.post('/change-password', CheckLogin, ChangePasswordValidator, validationResult, async function (req, res, next) {
    try {
        let { oldPassword, newPassword } = req.body;
        let user = req.user;

        let result = await userController.ChangePassword(user, oldPassword, newPassword);
        if (!result) {
            return res.status(400).send({ message: "Mật khẩu cũ không đúng" });
        }
        res.send({ message: "Đổi mật khẩu thành công" });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
})

module.exports = router;