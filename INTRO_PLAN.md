# Intro theo cheat sheet pixelfx

Intro hiện tại: phim 29 giây, 7 cảnh, vẽ trên lưới 2px (`src/game/rendering/cinematicIntro.ts`, mốc thời gian ở
`src/game/logic/introTimeline.ts`). Ánh sáng, hạt, tia sáng, vệt chém hiện đều vẽ tay bằng code.
Kế hoạch: **giữ nguyên cốt truyện, lời thoại, nhạc và mốc thời gian**, thay các hiệu ứng vẽ tay bằng hiệu ứng trong
`PIXELFX_CHEATSHEET.md`, thêm chuyển cảnh. Số trong ngoặc là số mục trong cheat sheet.

## Từng cảnh

| Cảnh | Giây | Hiện tại | Hiệu ứng pixelfx | Mốc gắn |
|---|---|---|---|---|
| 1. Rừng cổ thức tỉnh | 0–5 | Đen → sáng, rune sáng lần lượt, đom đóm | **God rays** (242) phủ cảnh · **Rune circle** (9) trên vòng đá, sáng theo 3 nhịp rune · **Fireflies** (240) | rune1 1.6 · rune2 3.1 · rune3 4.6 |
| → chuyển cảnh | 5 | Nhúng đen | **Pixel dissolve** (207), bỏ màu hồng thành xám | 4.6–5.4 |
| 2. Con đường cổ | 5–10 | Lời dẫn, tán lá trôi | **Fog** (241) tầng gần (đã thử Falling leaves: lá quá to, màu sặc, che nhân vật → bỏ) | suốt cảnh |
| 3. Hai anh hùng | 10–15 | Vòng triệu hồi, Aeris hiện ra, Kael bước vào, kiếm lóe | **Magic circle cast** (6) khi mở vòng · **Halo** (52) trên đầu Kael khi rút kiếm. Bỏ Blink in: nó tự vẽ một nhân vật thế thân | wizard 10.4 · wizardIn 10.95 · draw 13.8 |
| → chuyển cảnh | 15 | Ánh sáng tắt | **Shatter wipe** (208): màn hình vỡ như băng, mở ra rừng tuyết | 14.6–15.6 |
| 4. Boss thức tỉnh (không hiện boss) | 15–19 | Màn tối từ phải, băng lan, rung khi bước, gầm | **Snow** (245) · **Heavy landing** (74) ngoài khung phải mỗi bước chân · **Frost nova** (63) lan trên nền phía phải · **Blizzard** (236) quét ngang lúc gầm | bước 17.15, 17.65 · roar 18.0 |
| 5. Giao chiến | 19–22 | Kael lao, chém, va chạm; Aeris gồng, bắn; đụng nhau | **Sword slash** (100) lúc chém · **Critical hit** (72) lúc trúng · **Spell charge** (10) lúc gồng · **Magic missile** (147) lúc bắn · **Parry** (78) lúc đụng | slash 19.6 · impact 19.78 · cast 20.4 · bolt 20.75 · clash 21.05 |
| 6. Tụ sáng, chữ SECOND ME | 22–28 | Hạt tụ lại, vòng rune, logo | **Collect burst** (131) khi hạt tụ · **Rune circle** (9) sau logo · **Shooting stars** (244) trên trời | gather 22.0 · logo 22.8 |
| 7. Mờ về menu | 28–29.4 | Mờ đen | **Star iris** (210) đóng vào giữa rồi mở ra menu | 28–29.4 |

## Nguyên tắc

- **Cùng lưới pixel:** hiệu ứng vẽ trên lớp 2px của phim, phóng nguyên lần, không làm mịn. Các hiệu ứng thời tiết và
  chuyển cảnh khung 320×180 phủ vừa khít màn hình ở hệ số 2.
- **Dung lượng:** phim chỉ cần mỗi hiệu ứng thời tiết trong thời lượng một cảnh (5 giây), không cần cả vòng lặp 8–12 giây.
  Script cắt các hiệu ứng này còn 5 giây ở 15 khung/giây, giảm 256 màu như các hiệu ứng khác. Tải trước trong lúc logo
  studio đang hiện; hiệu ứng nào chưa tải xong thì phim vẫn chạy bằng phần vẽ tay hiện có.
- **Giảm chuyển động:** bỏ chuyển cảnh và thời tiết động, giữ hình tĩnh như bản hiện tại.
- **Không đổi:** lời thoại, giọng đọc, nhạc, mốc thời gian, nút bỏ qua.

## Sprite cần xuất (một lệnh)

`arcane/blink-in`, `impacts/crit-hit`, `impacts/parry`, `arcane/spell-charge`, `status/haste`, `ice/frost-nova` đã có.
Còn lại:

```powershell
cd C:\Users\Lenovo\Downloads\pixelfx
node tools/render.mjs weather/god-rays weather/fireflies weather/falling-leaves weather/fog weather/snow weather/blizzard weather/shooting-stars arcane/rune-circle arcane/magic-circle-cast holy/halo impacts/heavy-landing melee/sword-slash projectiles/magic-missile pickups/collect-burst transitions/pixel-dissolve transitions/shatter-wipe transitions/star-iris --sheet
```

## Trạng thái

✅ Đã gắn (10/11/2026). Bỏ Haste ở cảnh giao chiến vì nó tự vẽ dư ảnh hình người. Khi bật giảm chuyển động: không có
thời tiết và chuyển cảnh, các hiệu ứng nhỏ vẫn chạy.
