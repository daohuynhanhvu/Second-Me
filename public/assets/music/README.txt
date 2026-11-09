THƯ MỤC NHẠC NỀN — TÊN FILE QUYẾT ĐỊNH NHẠC PHÁT Ở ĐÂU

Bỏ file .mp3 / .ogg / .wav / .m4a vào đây. Game đọc tên file (không phân biệt hoa thường,
có dấu hay không dấu đều được) và tự phát đúng cảnh. Không cần sửa code.

  Tên file có chữ...                                   -> Phát khi
  "boss", "bos", "trùm"                                -> đánh boss
  "intro", "mở đầu", "cinematic"                       -> phim mở đầu (thay nhạc tạo bằng code)
  "thua", "defeat", "game over"                        -> màn hình thua
  "ending", "kết thúc", "chiến thắng", "victory"       -> đoạn kết sau khi thắng boss
  "level", "màn" (màn chơi, ở các màn...), "gameplay"   -> các màn chơi thường
  "theme", "menu", "sảnh", "lobby", "chủ đề", "main"   -> màn hình chính, sảnh, shop, chọn nhân vật

Thứ tự kiểm tra từ trên xuống: "Nhạc trong màn đánh bos" có cả "trong màn" lẫn "bos"
-> tính là nhạc boss.

Không có nhạc màn chơi thường -> các màn chơi thường im lặng (thêm file có chữ "level" là có nhạc).
Không có nhạc kết thúc -> đoạn kết dùng nhạc theme.
Màn hình loading luôn im lặng: vào sảnh (Echo Camp) sau loading thì nhạc theme phát lại từ đầu.
Nhiều file cùng một cảnh -> mỗi lần vào cảnh chọn ngẫu nhiên một bài.
File không khớp chữ nào ở trên -> bị bỏ qua.

Nhạc tự lặp lại, chuyển cảnh thì nhạc mờ dần sang bài mới, tạm dừng thì nhạc nhỏ lại.
Riêng nhạc intro: không lặp, phát khớp thời điểm với phim (bật tiếng muộn thì nhạc bắt đầu
từ đúng giây đó), mức 0.6 và tự hạ 6 dB khi người kể chuyện nói để giọng vẫn nghe rõ
(chỉnh ở INTRO_LEVEL / SPEECH_DUCK trong src/game/logic/music.ts). Nên làm bài intro dài bằng phim (khoảng 30 giây).
Âm lượng theo thanh âm lượng chung trong game, tắt tiếng thì nhạc cũng tắt.
Khi chạy "pnpm dev": thêm/đổi tên file xong chỉ cần tải lại trang (F5).
Code: src/game/logic/music.ts
