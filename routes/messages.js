var express = require("express");
var router = express.Router();
let messageModel = require("../schemas/messages");
// Tôi thay uploadImage thành uploadFile (đã viết trước đó ở utils) 
// để route này hỗ trợ mọi loại file (PDF, Doc) thay vì chỉ ảnh bị lỗi
let { uploadFile } = require('../utils/uploadHandler');

// Middleware lấy user hiện tại từ header
function getCurrentUser(req, res, next) {
    req.currentUserId = req.headers['user-id'];
    if (!req.currentUserId) {
        return res.status(401).send({ 
            success: false,
            message: "Vui long truyen user-id trong header" 
        });
    }
    next();
}

// GET /:userID - Lấy toàn bộ tin nhắn giữa user hiện tại và userID
router.get("/:userID", getCurrentUser, async function (req, res, next) {
    try {
        let currentUserId = req.currentUserId;
        let targetUserId = req.params.userID;

        let messages = await messageModel.find({
            isDeleted: false,
            $or: [
                { from: currentUserId, to: targetUserId },
                { from: targetUserId, to: currentUserId }
            ]
        })
        .populate('from', 'username email')
        .populate('to', 'username email')
        .sort({ createdAt: 1 });

        res.send({
            success: true,
            count: messages.length,
            messages: messages
        });
    } catch (error) {
        res.status(500).send({ 
            success: false,
            message: error.message 
        });
    }
});

// POST / - Gửi tin nhắn
router.post("/", getCurrentUser, uploadFile.single('file'), async function (req, res, next) {
    try {
        let currentUserId = req.currentUserId;
        let { to, text } = req.body;

        if (!to) {
            return res.status(400).send({
                success: false,
                message: "Thieu thong tin nguoi nhan (to)"
            });
        }

        let messageContent = {};

        if (req.file) {
            messageContent = {
                type: 'file',
                text: req.file.path
            };
        } else {
            if (!text) {
                return res.status(400).send({
                    success: false,
                    message: "Thieu noi dung tin nhan"
                });
            }
            messageContent = {
                type: 'text',
                text: text
            };
        }

        let newMessage = new messageModel({
            from: currentUserId,
            to: to,
            messageContent: messageContent
        });

        await newMessage.save();
        await newMessage.populate('from', 'username email');
        await newMessage.populate('to', 'username email');

        res.send({
            success: true,
            message: "Gui tin nhan thanh cong",
            data: newMessage
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

// GET / - Lấy tin nhắn cuối cùng với mỗi user
router.get("/", getCurrentUser, async function (req, res, next) {
    try {
        let currentUserId = req.currentUserId;

        let allMessages = await messageModel.find({
            isDeleted: false,
            $or: [
                { from: currentUserId },
                { to: currentUserId }
            ]
        })
        .populate('from', 'username email')
        .populate('to', 'username email')
        .sort({ createdAt: -1 });

        let conversationsMap = new Map();

        for (let message of allMessages) {
            let otherUserId = message.from._id.toString() === currentUserId 
                ? message.to._id.toString() 
                : message.from._id.toString();

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, message);
            }
        }

        let lastMessages = Array.from(conversationsMap.values());

        res.send({
            success: true,
            count: lastMessages.length,
            conversations: lastMessages
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
