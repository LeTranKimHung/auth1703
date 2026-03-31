# Hướng dẫn test Message API trên Postman

> Base URL: `http://localhost:3000/api/v1`

---

## BƯỚC 1 — Đăng ký tài khoản User 1 (người gửi)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/v1/auth/register` |
| **Body** | `raw` → `JSON` |

```json
{
  "username": "testuser1",
  "password": "Test@1234",
  "email": "testuser1@test.com"
}
```

✅ Ghi lại `_id` trong response (là ID của user1).

---

## BƯỚC 2 — Đăng ký tài khoản User 2 (người nhận)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/v1/auth/register` |
| **Body** | `raw` → `JSON` |

```json
{
  "username": "testuser2",
  "password": "Test@1234",
  "email": "testuser2@test.com"
}
```

✅ Ghi lại `_id` trong response (là ID của user2, sẽ dùng làm `to` khi gửi tin nhắn).

---

## BƯỚC 3 — Đăng nhập User 1 lấy token

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/v1/auth/login` |
| **Body** | `raw` → `JSON` |

```json
{
  "username": "testuser1",
  "password": "Test@1234"
}
```

✅ Copy toàn bộ chuỗi JWT trả về (dùng cho tất cả request bên dưới).

> **Cách thêm token:** Vào tab **Headers** → thêm:
> - Key: `authorization`
> - Value: `<paste token vào đây>`

---

## BƯỚC 4 — Gửi tin nhắn TEXT

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/v1/messages` |
| **Headers** | `authorization: <token>` |
| **Body** | `raw` → `JSON` |

```json
{
  "to": "<_id của user2 từ bước 2>",
  "text": "Xin chao ban!"
}
```

**Response mong đợi (`201`):**
```json
{
  "_id": "...",
  "from": { "username": "testuser1", "fullName": "", "avatarUrl": "..." },
  "to":   { "username": "testuser2", "fullName": "", "avatarUrl": "..." },
  "messageContent": {
    "type": "text",
    "text": "Xin chao ban!"
  },
  "createdAt": "..."
}
```

---

## BƯỚC 5 — Gửi tin nhắn FILE

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/v1/messages` |
| **Headers** | `authorization: <token>` |
| **Body** | **`form-data`** ⚠️ (KHÔNG dùng raw JSON) |

Trong tab **Body → form-data**, thêm 2 row:

| Key | Type | Value |
|-----|------|-------|
| `to` | Text | `<_id của user2>` |
| `file` | **File** ← click dropdown để đổi | Chọn file từ máy tính |

**Response mong đợi (`201`):**
```json
{
  "messageContent": {
    "type": "file",
    "text": "uploads\\ten-file.png"
  }
}
```

---

## BƯỚC 6 — Lấy danh sách conversation (tin nhắn cuối mỗi người)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/v1/messages` |
| **Headers** | `authorization: <token>` |

**Response mong đợi:**
```json
[
  {
    "partner": {
      "_id": "...",
      "username": "testuser2",
      "fullName": "",
      "avatarUrl": "..."
    },
    "lastMessage": {
      "messageContent": { "type": "text", "text": "Xin chao ban!" },
      "createdAt": "..."
    }
  }
]
```

---

## BƯỚC 7 — Lấy toàn bộ tin nhắn giữa 2 user

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/api/v1/messages/<_id của user2>` |
| **Headers** | `authorization: <token>` |

**Ví dụ URL:** `http://localhost:3000/api/v1/messages/661f3b2a1c4e2d3f4a5b6c7d`

**Response mong đợi (mảng, sắp xếp cũ → mới):**
```json
[
  {
    "from": { "username": "testuser1" },
    "to":   { "username": "testuser2" },
    "messageContent": { "type": "text", "text": "Xin chao ban!" },
    "createdAt": "..."
  },
  {
    "from": { "username": "testuser1" },
    "to":   { "username": "testuser2" },
    "messageContent": { "type": "file", "text": "uploads\\ten-file.png" },
    "createdAt": "..."
  }
]
```

---

## ⚠️ Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|------------|----------|
| `ban chua dang nhap` | Thiếu hoặc sai token | Kiểm tra header `authorization` |
| `Thiếu trường 'to'` | Không có field `to` trong body | Thêm `"to": "<ObjectId>"` |
| `Phải cung cấp nội dung` | Không có text lẫn file | Điền `text` hoặc chọn `file` |
| `Cast to ObjectId failed` | `to` không phải ObjectId hợp lệ | Chắc chắn copy đúng `_id` từ response đăng ký |
| `ENOENT` / file lỗi | Thư mục `uploads/` chưa tồn tại | Server tự tạo khi upload lần đầu, thử lại |
