var express = require("express");
var router = express.Router();
let { CheckLogin } = require("../utils/authHandler");
let messageModel = require("../schemas/messages");
let { uploadFile } = require("../utils/uploadHandler");

// -----------------------------------------------------------------------
// GET /  → Lấy tin nhắn cuối cùng của mỗi conversation mà user hiện tại
//           đã nhắn (từ user đến ai đó) hoặc được nhắn (từ ai đó đến user)
// -----------------------------------------------------------------------
router.get("/", CheckLogin, async function (req, res, next) {
    try {
        let currentUserId = req.user._id;

        // Gom tất cả người dùng đã từng chat với user hiện tại
        let conversations = await messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { from: currentUserId },
                        { to: currentUserId }
                    ]
                }
            },
            {
                // Tạo field "partner" = người phía bên kia cuộc trò chuyện
                $addFields: {
                    partner: {
                        $cond: {
                            if: { $eq: ["$from", currentUserId] },
                            then: "$to",
                            else: "$from"
                        }
                    }
                }
            },
            // Sắp xếp mới nhất trước để $last lấy đúng tin nhắn cuối
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$partner",
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "partnerInfo"
                }
            },
            { $unwind: "$partnerInfo" },
            {
                $project: {
                    _id: 0,
                    partner: {
                        _id: "$partnerInfo._id",
                        username: "$partnerInfo.username",
                        fullName: "$partnerInfo.fullName",
                        avatarUrl: "$partnerInfo.avatarUrl"
                    },
                    lastMessage: {
                        _id: "$lastMessage._id",
                        from: "$lastMessage.from",
                        to: "$lastMessage.to",
                        messageContent: "$lastMessage.messageContent",
                        createdAt: "$lastMessage.createdAt"
                    }
                }
            },
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);

        res.send(conversations);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------------------------------------------------------------
// GET /:userID → Lấy toàn bộ tin nhắn giữa user hiện tại và userID
//                (from: current → to: userID) và (from: userID → to: current)
// -----------------------------------------------------------------------
router.get("/:userID", CheckLogin, async function (req, res, next) {
    try {
        let currentUserId = req.user._id;
        let targetUserId = req.params.userID;

        let messages = await messageModel
            .find({
                $or: [
                    { from: currentUserId, to: targetUserId },
                    { from: targetUserId, to: currentUserId }
                ]
            })
            .populate("from", "username fullName avatarUrl")
            .populate("to", "username fullName avatarUrl")
            .sort({ createdAt: 1 }); // cũ → mới

        res.send(messages);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------------------------------------------------------------
// POST /   → Gửi tin nhắn đến userID
//   Body (multipart/form-data hoặc JSON):
//     - to       : ObjectId của người nhận
//     - text     : nội dung text (nếu gửi text)
//     - file     : file đính kèm (nếu gửi file, dùng multipart/form-data)
// -----------------------------------------------------------------------
router.post(
    "/",
    CheckLogin,
    uploadFile.single("file"), // multer: xử lý file nếu có
    async function (req, res, next) {
        try {
            let currentUserId = req.user._id;
            let { to, text } = req.body;

            if (!to) {
                return res.status(400).send({ message: "Thiếu trường 'to' (người nhận)" });
            }

            let messageContent;

            if (req.file) {
                // Có file → type = "file", text = đường dẫn đến file
                messageContent = {
                    type: "file",
                    text: req.file.path
                };
            } else if (text && text.trim() !== "") {
                // Không có file → type = "text", text = nội dung gửi
                messageContent = {
                    type: "text",
                    text: text.trim()
                };
            } else {
                return res.status(400).send({
                    message: "Phải cung cấp nội dung text hoặc file đính kèm"
                });
            }

            let newMessage = new messageModel({
                from: currentUserId,
                to: to,
                messageContent: messageContent
            });

            await newMessage.save();
            await newMessage.populate("from", "username fullName avatarUrl");
            await newMessage.populate("to", "username fullName avatarUrl");

            res.status(201).send(newMessage);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    }
);

module.exports = router;
