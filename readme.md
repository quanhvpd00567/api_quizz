# API Quizz

## Giới thiệu
Đây là dự án API cho hệ thống quản lý và tạo bài kiểm tra trắc nghiệm, hỗ trợ các loại câu hỏi như trắc nghiệm, tự luận, đúng/sai, điền khuyết, v.v.

## Tính năng
- Quản lý bài kiểm tra, câu hỏi, chủ đề, lớp học
- Tạo bài kiểm tra tự động bằng AI
- Hỗ trợ nhiều loại câu hỏi: trắc nghiệm, tự luận, đúng/sai, điền khuyết
- Giao bài tập cho học sinh, sinh viên
- Thống kê kết quả làm bài
- Xáo trộn câu hỏi và đáp án
- Hỗ trợ mã hóa mật khẩu bài kiểm tra

## Yêu cầu hệ thống
- Node.js >= 16.x
- MongoDB >= 4.x

## Cài đặt

```bash
npm install
```

## Chạy dự án

```bash
npm start
```

## Chạy queue

```bash
npm run queue:start
```

## Seed database

```bash
npm run db:seed
```

## Cài mongodb
```bash
docker run -d \
  --name mongo-rs \
  -p 27017:27017 \
  mongo:5 \
  --replSet rs0 --bind_ip_all

  docker exec -it mongo-rs mongosh

  rs.initiate({
  _id: "rs0",
   members: [
      { _id: 0, host: "localhost:27017" }
   ]
   })


   rs.status()
```


## Cấu hình môi trường
Tạo file `.env` và thêm các biến sau:
```
MONGO_URI=mongodb://localhost:27017/quizdb
PORT=3000
JWT_SECRET=your_jwt_secret
```

## Ví dụ request/response
### Tạo bài kiểm tra mới
`POST /api/quizzes`
```json
{
  "title": "Bài kiểm tra Toán lớp 4",
  "subject": "Toán",
  "questions": [ ... ],
  "timeLimit": 60
}
```

### Lấy danh sách bài kiểm tra
`GET /api/quizzes`
```json
[
  {
    "_id": "...",
    "title": "Bài kiểm tra Toán lớp 4",
    "subject": "Toán",
    ...
  }
]
```

## Cấu trúc thư mục
- `/src`: Mã nguồn chính của API
- `/models`: Định nghĩa các model dữ liệu
- `/routes`: Định nghĩa các route cho API
- `/controllers`: Xử lý logic cho các route
- `/middlewares`: Các middleware dùng chung

## Liên hệ
Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ admin qua email: support@example.com

## Bản quyền
Dự án thuộc sở hữu của nhóm phát triển. Vui lòng không sử dụng cho mục đích thương mại khi chưa có sự cho phép.

## Test API
Bạn có thể sử dụng Postman hoặc Insomnia để kiểm thử các endpoint API.

## Công cụ đề xuất
- Postman/Insomnia: test API
- Docker: chạy MongoDB
- VS Code: phát triển mã nguồn

## Đóng góp
Mọi đóng góp vui lòng gửi pull request hoặc liên hệ qua email.

## Bảo mật
- Không chia sẻ file .env lên public
- Đổi JWT_SECRET khi deploy production

## License
MIT License

## Lưu ý khi deploy
- Đảm bảo cấu hình biến môi trường đúng
- Sử dụng HTTPS cho môi trường production
- Backup dữ liệu thường xuyên