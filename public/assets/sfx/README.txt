THƯ MỤC HIỆU ỨNG ÂM THANH (SFX) — TÊN FILE QUYẾT ĐỊNH ÂM NÀO ĐƯỢC THAY

Bỏ file .mp3 / .ogg / .wav / .m4a vào đây. Game đọc tên file (không phân biệt hoa thường,
có dấu hay không dấu đều được, dấu - _ . coi như dấu cách) và tự thay đúng âm thanh.
Không cần sửa code.

  Tên file có chữ...                                  -> Thay âm thanh                 Tên gợi ý
  "dừng ghi", "ngừng ghi", "record stop"              -> dừng ghi hình Echo            dừng ghi.mp3
  "bắt đầu ghi", "ghi hình", "record"                 -> bắt đầu ghi hình Echo         bắt đầu ghi.mp3
  "hủy echo", "echo tan", "dismiss"                   -> Echo biến mất                 hủy echo.mp3
  "echo", "triệu hồi", "summon"                       -> gọi Echo ra                   triệu hồi echo.mp3
  "nhả nút", "thả nút", "plate off"                   -> rời khỏi nút nhấn             nhả nút.mp3
  "nhấn nút", "nút bấm", "plate", "button"            -> đứng lên nút nhấn             nhấn nút.mp3
  "đóng cửa", "door close"                            -> cửa đóng                      đóng cửa.mp3
  "mở cửa", "door"                                    -> cửa mở                        mở cửa.mp3
  "kết liễu", "đòn cuối", "finisher", "nova"          -> đòn thứ 4 của combo (*)       đòn kết liễu.mp3
  "chém", "kiếm", "slash", "swing"                    -> Kael vung kiếm (mỗi đòn) (**) chém 1.mp3
  "phép", "spell", "cast", "magic"                    -> Aeris tung phép (mỗi đòn) (**) phép 1.mp3
  "né", "né tránh", "lướt", "dodge", "roll"           -> né đòn (**)                   né.mp3
  "vỡ", "phá", "break", "shatter"                     -> phá vỡ trụ băng               trụ vỡ.mp3
  "trúng đòn", "đánh trúng", "hit", "impact"          -> đánh trúng quái/trụ/boss      đánh trúng 1.mp3
  "bước chân", "footstep", "step"                     -> tiếng bước chân               bước chân 1.mp3
  "chiến thắng", "qua màn", "victory", "win"          -> qua màn / thắng               chiến thắng.mp3
  "đá trượt", "kéo đá", "rock", "stone", "sliding"    -> cổng đá trượt + xoay (***)    đá trượt.mp3
  "mở cổng", "cổng dịch chuyển", "portal", "vortex"   -> cổng kích hoạt + lao vào (***) mở cổng.mp3

Thứ tự kiểm tra từ trên xuống, khớp dòng nào trước thì tính dòng đó:
"hủy echo" có cả "hủy echo" lẫn "echo" -> tính là Echo biến mất.

(*)  Không có file -> vẫn dùng tiếng "bụp" cũ.
(**) Âm mới: không có file thì im lặng (trước giờ game chưa có âm này).
(***) Chuyển cảnh vào cổng ở cuối màn hình loading (khi vào màn từ menu). Không có file thì
      im lặng. Phát nguyên file, không lệch cao độ:
        đá trượt: từ lúc cổng bắt đầu trượt vào giữa, qua lúc xoay, ngắt ngay khi cổng quay
                  ra chính diện hoàn toàn (sau 3 s; nên dài hơn 3 s, âm đều).
        mở cổng:  từ lúc cổng kích hoạt (rung) qua cú lao vào; sau chớp trắng nhỏ dần 1.6 s
                  (nên mạnh ở đầu, dài khoảng 3.5-5 s).
Các âm khác không có file -> dùng âm tạo bằng code như cũ (src/game/logic/sound.ts).

Nhiều file cho cùng một âm (vd. "bước chân 1.mp3", "bước chân 2.mp3", "bước chân 3.mp3")
-> mỗi lần phát chọn ngẫu nhiên một file, cao độ lệch nhẹ ±4% cho đỡ lặp. Nên làm vậy với
bước chân, chém, phép, đánh trúng.
File không khớp chữ nào ở trên -> bị bỏ qua (khi chạy "pnpm dev" có báo trong Console).

Nên dùng file ngắn (dưới 1-2 giây), cắt sát đầu (không có khoảng lặng ở đầu file) để âm
phát đúng lúc ra đòn. Âm lượng: chuẩn hóa các file gần bằng nhau; game tự đặt hiệu ứng ở
mức 0.7 (SFX_LEVEL trong src/game/logic/sound.ts), theo thanh âm lượng chung, tắt tiếng thì
cũng tắt.
File được tải sẵn ở màn hình loading khi vào màn chơi, nên phát ngay từ lần đầu.
Khi chạy "pnpm dev": thêm/đổi tên file xong chỉ cần tải lại trang (F5).
Code: src/game/logic/sfx.ts
