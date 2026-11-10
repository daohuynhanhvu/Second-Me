# Thống kê chiêu thức chưa được làm lại hiệu ứng

Cập nhật: 2026-11-10 (đối chiếu với code trong `src/game/rendering/`).

**Quy ước**
- ✅ **Đã làm lại**: dùng sprite/GIF hiệu ứng mới (nguồn GIF + pixelfx, thêm ở các phiên gần đây).
- 🟡 **Có sprite cũ**: dùng ảnh do bạn làm phần boss thêm từ trước, chưa thay bằng bộ mới.
- ❌ **Chưa làm lại**: vẫn vẽ bằng code canvas (vòng tròn, đường kẻ, đa giác...), nhìn khác hẳn các hiệu ứng pixel mới.

---

## 1. Đã làm lại (tham khảo)

| Chiêu | Hiệu ứng | File |
|---|---|---|
| Kael: Chém nhanh, Chém ngược, Nhát chém kết liễu (vòng cung) | Crescent slash | `vfx-slash.png` |
| Kael: Thánh địa (kỹ năng) | Vòng ánh sáng dưới đất khi tung | `vfx-ground-ring.png` |
| Nhặt Khiên đá / Giáp | Thánh giá khiên lúc nhặt | `vfx-shield-cross.png` |
| Đang có khiên (Khiên đá / Giáp) | Bong bóng lục giác quanh người | `vfx-hex-shield.png` |
| Nhặt kỹ năng sát thương (Lửa, Sét, Kiếm quang) | Tia lấp lánh lúc nhặt | `vfx-sparkle.png` |
| Dùng bình thời gian | Đồng hồ | `vfx-time-clock.png` |
| Boss: Ba tia băng | Ice Spikes (pixelfx) | `ice-spikes.png` |
| Aeris: Đạn bí thuật, Bùng nổ bí thuật, Quỹ đạo phép (đạn combo) | Arcane orb (pixelfx), vệt đuôi tím | `arcane-orb.png` |

---

## 2. Chưa làm lại, theo nhân vật

### Aeris (pháp sư)

| Chiêu | Hiện trạng | Vẽ ở đâu | Mức |
|---|---|---|---|
| Tân tinh bí thuật (đòn 4, kết liễu): vòng nổ | Elip xanh + 12 tia sét vẽ bằng đường kẻ | `comboSprites.ts` (`nova`) | ❌ |
| Tân tinh: vòng tụ lực trước khi nổ | Elip mỏng thu nhỏ | `comboSprites.ts` (`charge`) | ❌ |
| Đạn phép của Echo (bóng Aeris) | Tia sét xanh vẽ bằng code | `adventure.ts` + `mageMagic.ts` (`drawLightningOrb`) | ❌ |
| Gậy phép | Vẽ bằng code | `mageMagic.ts` (`drawMageStaff`) | ❌ |
| Băng Chú (kỹ năng 40 MP): vòng cảnh báo + gai băng nổ | Dùng chung sprite của boss | `bossFrostZone.ts` + `boss-ice-spell.png` | 🟡 |
| Nhặt Đạn lửa, Tia sét, Khiên đá: hiệu ứng thả chiêu | Chỉ một vòng tròn màu nở ra (`combatFlash`), không có đạn/tia thật | `adventure.ts` dòng `combatFlash` | ❌ |

### Kael (kiếm sĩ)

| Chiêu | Hiện trạng | Vẽ ở đâu | Mức |
|---|---|---|---|
| Chém xoáy (đòn 3) | Vòng elip trắng vẽ bằng đường kẻ (`spin`) | `comboSprites.ts` | ❌ |
| Nhát chém kết liễu: tia nổ khi trúng | Ngôi sao 10 tia + vòng vàng (`impact`) | `comboSprites.ts` | ❌ |
| Thánh địa: vòng vùng hồi máu (vùng thật, đứng trong để hồi) | Elip vàng nhạt + 6 chấm, vẽ bằng code, **vẫn hiện cùng sprite mới** | `adventure.ts` dòng `lightCircle` | ❌ |
| Đòn đánh thường (không combo) | Cung xanh lá vẽ bằng đường kẻ | `adventure.ts` (dòng `attackAngle`) | ❌ |
| Nhặt Kiếm quang | Chỉ vòng tròn nở ra, không có đường kiếm bay | `combatFlash` | ❌ |
| Nhặt Tốc chém (Haste) | **Không có hiệu ứng nhìn thấy** (chỉ banner + chém nhanh gấp đôi) | `collectCombatSkill` | ❌ |

### Rivet (cơ khí)

| Chiêu | Hiện trạng | Vẽ ở đâu | Mức |
|---|---|---|---|
| Overdrive (kỹ năng, 5s) | Một vòng elip cam mỏng dưới chân | `adventure.ts` dòng `overdrive` | ❌ |
| Đòn đánh thường | Sprite nhân vật có `attackFlash`, không có hiệu ứng riêng | `mechanicalSprite.ts` | ❌ |
| Nhặt Đạn lửa / Giáp / Tốc chém | Dùng chung hiệu ứng ở trên | | ❌ |

---

## 3. Chưa làm lại: Frost Guardian (boss)

| Chiêu | Hiện trạng | Vẽ ở đâu | Mức |
|---|---|---|---|
| Ba tia băng | **Đã xong** (Ice Spikes) | `tripleFrost.ts` | ✅ |
| Loạt đạn băng (volley) | Viên pha lê vẽ bằng đa giác + vệt đuôi | `iceProjectile.ts` | ❌ |
| Vùng băng nổ (Frost zone): vòng cảnh báo + gai | Ảnh sprite cũ | `bossFrostZone.ts` + `boss-ice-spell.png`, `boss-frost-ring.png`, `boss-frost-impact.png` | 🟡 |
| Lá chắn băng quanh boss (khi còn trụ) | Elip + mảnh kính vẽ bằng code | `guardianShield.ts` | ❌ |
| Lá chắn vỡ (khi phá hết trụ) | 16 mảnh vỡ vẽ bằng code | `guardianShield.ts` | ❌ |
| Trụ băng | Vẽ bằng code | `drawPillars` (`forestStage` / `adventure.ts`) | ❌ |
| Đấm cận chiến | Chỉ có pose nhân vật boss + chữ cảnh báo, không có hiệu ứng đòn | `frostGuardian.ts` | ❌ |
| Trạng thái tức giận (enrage) | Chỉ chữ cảnh báo | `adventure.ts` | ❌ |

---

## 4. Hiệu ứng khác (không phải chiêu của nhân vật)

| Hiệu ứng | Hiện trạng | Mức |
|---|---|---|
| Vật phẩm kỹ năng rơi xuống (icon 7x7 chấm) | Vẽ bằng code | ❌ (`skillPickup.ts`) |
| Đòn của lính thường (lao tới) | Chỉ dịch chuyển sprite, không có hiệu ứng đòn | ❌ (`enemies.ts`) |
| Echo: vòng giới hạn | Ảnh sprite | 🟡 (`echo-limit-ring.png`) |
| Bẫy | Có sprite riêng | 🟡 (`traps.ts`) |
| Hạt khi nhận sát thương | Hạt tròn đơn giản | ❌ (`renderer.particles`) |
| Storm Orbs | Đã gỡ khỏi game (không cần làm) | — |

---

## 5. Gợi ý thứ tự làm (ảnh hưởng thấy rõ nhất → ít nhất)

1. **Tân tinh của Aeris** (đạn phép đã xong).
2. **Vòng `combatFlash` của Lửa / Sét / Kiếm quang**: hiện chỉ là vòng tròn, trong khi nhặt chiêu là khoảnh khắc "ngầu" nhất.
3. **Loạt đạn băng của boss**: cùng chủ đề với Ice Spikes nên đồng bộ dễ.
4. **Lá chắn băng + vỡ lá chắn của boss.**
5. **Chém xoáy + tia nổ kết liễu của Kael**, và bỏ vòng `lightCircle` cũ chồng lên sprite Thánh địa mới.
6. **Haste, Overdrive**: hiện gần như không nhìn thấy gì.
7. Vật phẩm rơi, đòn lính, hạt sát thương.

## Ghi chú
- Sprite `boss-triple-frost-spikes.png` không còn được dùng sau khi chuyển sang Ice Spikes; có thể xóa.
- Pixelfx còn nhiều hiệu ứng có thể dùng (render bằng `node tools/render.mjs <nhóm>/<tên> --sheet`), ví dụ họ `ice/`, `fire/`, `lightning/` hợp với các mục trên.
