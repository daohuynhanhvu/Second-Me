THƯ MỤC NHẠC NỀN — TÊN FILE QUYẾT ĐỊNH NHẠC PHÁT Ở ĐÂU

Bỏ file .mp3 / .ogg / .wav / .m4a vào đây. Game đọc tên file (không phân biệt hoa thường,
có dấu hay không dấu đều được) và tự phát đúng cảnh. Không cần sửa code.

  Tên file có chữ...                                   -> Phát khi
  "boss", "bos", "trùm"                                -> đánh boss
  "intro", "mở đầu", "cinematic"                       -> phim mở đầu (thay nhạc tạo bằng code)
  "thua", "defeat", "game over"                        -> màn hình thua
  "ending", "kết thúc", "chiến thắng", "victory"       -> đoạn kết sau khi thắng boss
  "level", "màn chơi", "gameplay", "trong màn"         -> các màn chơi thường
  "theme", "menu", "sảnh", "lobby", "chủ đề", "main"   -> màn hình chính, sảnh, shop, chọn nhân vật

Thứ tự kiểm tra từ trên xuống: "Nhạc trong màn đánh bos" có cả "trong màn" lẫn "bos"
-> tính là nhạc boss.

Không có nhạc màn chơi thường hoặc nhạc kết thúc -> dùng nhạc theme (phát tiếp, không phát lại từ đầu).
Nhiều file cùng một cảnh -> mỗi lần vào cảnh chọn ngẫu nhiên một bài.
File không khớp chữ nào ở trên -> bị bỏ qua.

Nhạc tự lặp lại, chuyển cảnh thì nhạc mờ dần sang bài mới, tạm dừng thì nhạc nhỏ lại.
Âm lượng theo thanh âm lượng chung trong game, tắt tiếng thì nhạc cũng tắt.
Khi chạy "pnpm dev": thêm/đổi tên file xong chỉ cần tải lại trang (F5).
Code: src/game/logic/music.ts
