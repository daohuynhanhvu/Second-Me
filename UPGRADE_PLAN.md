# Nâng cấp Kael, Aeris và Frost Guardian (theo "Pixel Fighter Forge")

Bản thiết kế để duyệt trước khi làm. Áp dụng tinh thần của prompt (đòn có lực, chiêu có vai trò rõ, hình và tiếng khớp nhau)
vào **Second Me** như nó đang là: góc nhìn từ trên xuống, đánh theo hướng chuột.

## 0. Những gì đổi so với prompt gốc (và lý do)

| Prompt gốc | Trong Second Me | Lý do |
|---|---|---|
| Game đối kháng màn hình ngang, nhảy, cúi, không kích, đánh thấp | **Bỏ** nhảy / cúi / không kích / đánh thấp | Game nhìn từ trên xuống, không có trục cao, không có sàn |
| 5 biến thể Skill và 5 Ultimate (thường, tiến, lùi, lên, xuống) | **3 biến thể mỗi loại: thường, tiến, lùi** | "Lên / xuống" không có nghĩa khi không có trọng lực. Tiến / lùi tính theo hướng chuột (mục tiêu), không theo trái / phải màn hình |
| Sprite nhân vật mới 48x48 cho toàn bộ animation | **Giữ sprite hiện có** của Kael, Aeris, boss | Môi trường này không có công cụ tạo ảnh; vẽ tay hàng chục animation bằng code sẽ xấu hơn sprite đang có. Chiêu mới dùng lại khung combo hiện có + dư ảnh + VFX |
| VFX tự vẽ | **VFX từ pixelfx** (MIT, đã dùng cho Ice Spikes, Arcane orb) | Đồng bộ phong cách, chất lượng ổn định |
| Phím A/D/J/K/L/U/I | Giữ phím hiện tại, thêm **V = Ultimate** | Không phá thói quen của người chơi |

Điều khiển sau nâng cấp:
- WASD di chuyển.
- Chuột trái: combo 4 đòn.
- Chuột phải hoặc Space: Skill.
- **V hoặc chuột giữa: Ultimate (mới).**
- Shift: lướt né.
- Biến thể theo hướng đang đi lúc bấm. Đứng yên là **thường**. Đi về phía chuột là **tiến**. Đi ra xa chuột là **lùi**.

Tài nguyên:
- MP giữ như hiện tại (combo, Skill).
- **Thêm thanh Nộ 0–100.** Tăng khi đánh trúng (+4 mỗi hit, +10 cho đòn kết) và khi bị đánh (+6). Ultimate tốn 100 Nộ.
- Chế độ tập luyện: phím G nạp đầy.

## 1. Nền cảm giác đánh (dùng chung cho mọi nhân vật)

| Hạng mục | Thiết kế |
|---|---|
| Hit-stop | Đòn nhẹ 30 ms, đòn kết / Ultimate 80 ms. Dừng cả người đánh, mục tiêu, đạn, VFX đi kèm. Không dừng nhạc, UI |
| Đẩy lùi | Lính bị đẩy 10 px (đòn nhẹ) / 36 px (đòn kết), chặn bởi tường. Boss không bị đẩy, chỉ khựng khi đã mất giáp |
| Rung màn hình | Chỉ đòn kết, Ultimate, đòn nện của boss. Nhỏ (2–5 px), tắt khi bật Giảm chuyển động |
| Tia va chạm | `impacts/hit-spark` (đòn thường), `impacts/crit-hit` (đòn kết), `impacts/shield-block` (đánh vào boss còn khiên, thay chữ MIỄN nhỏ) |
| Một mốc duy nhất | Sát thương, hit-stop, tia va chạm, tiếng đánh lấy từ cùng một lệnh `strike()` (đã đúng trong code hiện tại, chỉ gắn thêm) |
| VFX ba pha | Active (gây sát thương) → Release (ngừng gây, hình tiếp tục tan) → Finished (dọn). Phần tan không gây thêm sát thương |

## 2. Kael: kiếm sĩ ánh sáng (vàng, trắng)

Khí chất: vững, dứt khoát, bảo vệ đồng đội. Đòn ngắn, nặng dần.

| Đòn | Thiết kế | VFX (pixelfx) |
|---|---|---|
| Combo 1–2: Chém nhanh, Chém ngược | Giữ | Crescent slash đang có |
| Combo 3: Chém xoáy | Thêm khựng nhẹ cho lính (0.25 s) | `melee/spin-slash` |
| Combo 4: Nhát chém kết liễu | Hit-stop nặng, đẩy lùi, rung | `melee/heavy-cleave` + `impacts/crit-hit` |
| **Skill thường: Thánh địa** | Giữ cơ chế (vùng hồi máu +20% sát thương) | `holy/heal-aoe` thay vòng elip cũ |
| **Skill tiến: Xung kích** (mới) | Lao 140 px về phía chuột, chém mọi thứ trên đường (1 hit mỗi mục tiêu), bất tử trong lúc lao | `moves/dash-strike` + dư ảnh |
| **Skill lùi: Lùi chém sóng** (mới) | Nhảy lùi 80 px, phóng 1 sóng kiếm bay thẳng 360 px | `projectiles/energy-disc` (tô vàng) |
| **Ultimate thường: Phán quyết** (mới) | Gồng 0.5 s, 5 cột sáng giáng xuống quanh 220 px, mỗi cột 60 sát thương | `holy/holy-pillar` + `holy/sunburst` lúc gồng |
| **Ultimate tiến: Thiên kiếm** (mới) | Lao xuyên tuyến 300 px, chém 3 nhịp lên mọi mục tiêu trên tuyến | `holy/smite` dọc tuyến |
| **Ultimate lùi: Khiên thánh** (mới) | 2 s chặn mọi đòn; mỗi đòn chặn được phản 40 sát thương về kẻ đánh | `holy/divine-shield` + `impacts/parry` khi chặn |

## 3. Aeris: pháp sư bí thuật – băng (tím, xanh băng)

Khí chất: lạnh, chính xác, giữ khoảng cách. Đòn từ xa, khống chế.

| Đòn | Thiết kế | VFX (pixelfx) |
|---|---|---|
| Combo 1–3: đạn bí thuật | Giữ | Arcane orb (đã xong) |
| Combo 4: Tân tinh | Gồng rõ hơn, hit-stop nặng, đẩy lùi | `arcane/spell-charge` (gồng) + `arcane/mana-burst` (nổ) |
| **Skill thường: Băng chú** | Giữ cơ chế | `ice/frost-nova` thay sprite cũ |
| **Skill tiến: Thuấn di** (mới) | Dịch chuyển 130 px về phía chuột (xuyên lính, không xuyên tường), để lại vùng băng làm chậm 1.5 s | `arcane/blink-out` → `arcane/blink-in` |
| **Skill lùi: Giáo băng** (mới) | Lùi 60 px, phóng giáo băng xuyên thẳng, làm chậm | `ice/ice-lance` |
| **Ultimate thường: Mưa băng** (mới) | Vùng 180 px quanh chuột, 12 cột băng rơi trong 2 s | `ice/icicle-fall` |
| **Ultimate tiến: Tia bí thuật** (mới) | Gồng 0.4 s, chùm tia 420 px về phía chuột, 6 nhịp sát thương | `arcane/arcane-beam` |
| **Ultimate lùi: Ngưng đọng thời gian** (mới) | Dừng lính, boss, đạn của chúng 2.5 s (Echo vẫn chạy, hợp chủ đề "Second Me") | `arcane/time-stop` |

## 4. Frost Guardian (boss)

| Đòn | Hiện tại | Nâng cấp |
|---|---|---|
| Đấm cận chiến | Chỉ có pose | Thêm `impacts/ground-slam` + rung khi nện đất |
| Loạt đạn băng | Đa giác vẽ tay | `ice/ice-lance` (sprite) |
| Ba tia băng | Ice Spikes (đã xong) | Giữ |
| Lá chắn / vỡ lá chắn | Vẽ tay | Vỡ: `ice/ice-shatter` |
| Tức giận | Chỉ chữ | `status/rage` trên boss |
| **Chiêu mới: Bão tuyết** | | Từ 50% máu: vùng `ice/blizzard-vortex` 3 s kéo người chơi vào tâm, sát thương mỗi 0.5 s, báo trước 1 s |
| **Chiêu mới: Mưa nhũ băng** | | Từ 25% máu: 6 điểm báo đỏ quanh người chơi, 0.9 s sau nhũ băng rơi (`ice/icicle-fall`) |
| Bị đánh | Chớp trắng | Khựng 0.15 s khi trúng đòn kết lúc đã mất giáp |

## 5. Trạng thái (sửa các mục "không thấy gì" trong SKILLS_TODO.md)

- `status/haste`: Tốc chém.
- `status/burning`: Đạn lửa đốt boss.
- `status/frozen`: Làm chậm của băng.
- `fire/fireball`, `lightning/lightning-strike`, `projectiles/energy-disc`: hiệu ứng thật cho Đạn lửa, Tia sét, Kiếm quang khi nhặt.

## 6. Âm thanh

- Dùng lại bộ SFX và voice có sẵn trong `public/assets/sfx`, `voice` trước.
- Phần thiếu (dash, beam, time-stop, blink...) tìm SFX giấy phép CC0 / miễn phí, ghi nguồn và giấy phép vào `tools/assets/source/`.
- Không clone giọng người thật.

## 7. Thứ tự làm (mỗi bước chơi thử được, test, rồi mới sang bước sau)

1. **Nền cảm giác đánh**: hit-stop, đẩy lùi, rung, tia va chạm. Chưa thêm chiêu.
   ✅ Xong: hit-stop, đẩy lùi, rung (`logic/hitFeel.ts`), tia va chạm / chí mạng / vòm khiên boss (`rendering/pixelfx.ts`).
2. **Thanh Nộ + phím V + 3 Ultimate của Aeris.**
   ✅ Xong (`logic/ultimate.ts`). Chưa có câu thoại cho 3 chiêu mới; Aeris chưa có tư thế riêng khi tung Ultimate.
3. **3 Ultimate của Kael.**
4. **Skill tiến / lùi** cho cả hai.
5. VFX còn lại của combo (Chém xoáy, Kết liễu, Tân tinh, Thánh địa, Băng chú).
6. **Boss**: VFX mới + Bão tuyết + Mưa nhũ băng.
7. Trạng thái + chiêu nhặt.
8. Âm thanh còn thiếu, cân bằng sát thương, kiểm thử trên điện thoại (nút cảm ứng cho Ultimate).

## 8. Sprite pixelfx cần xuất (một lệnh)

```powershell
cd C:\Users\Lenovo\Downloads\pixelfx
node tools/render.mjs impacts/hit-spark impacts/crit-hit impacts/shield-block impacts/parry impacts/ground-slam melee/spin-slash melee/heavy-cleave moves/dash-strike projectiles/energy-disc holy/heal-aoe holy/holy-pillar holy/sunburst holy/smite holy/divine-shield arcane/spell-charge arcane/mana-burst arcane/blink-out arcane/blink-in arcane/arcane-beam arcane/time-stop ice/frost-nova ice/ice-lance ice/icicle-fall ice/ice-shatter ice/blizzard-vortex status/rage status/haste status/burning status/frozen fire/fireball lightning/lightning-strike --sheet
```

Mỗi sheet sẽ được cắt sát hình (như Arcane orb) để giảm dung lượng tải.

## Ghi chú khi gắn hiệu ứng

- `arcane/blink-in`, `arcane/blink-out` và `status/haste` tự vẽ một nhân vật thế thân (dáng người / dư ảnh chung chung).
  Gắn lên Aeris hoặc Kael sẽ lệch dáng: với Thuấn di và Tốc chém cần che phần đó (chỉ dùng các khung không có người,
  hoặc vẽ dư ảnh từ chính sprite nhân vật).
