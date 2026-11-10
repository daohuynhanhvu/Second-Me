# Cheat sheet Pixel VFX — 246 mục (gói promptmmo "246+ Master Prompts")

> Nguồn: cheat sheet nhóm "Pixel VFX" trong gói đã mua trên promptmmo.store, xuất ngày 10/11/2026.
> Chỉ sửa số thứ tự đầu mục (bản xuất in mỗi số hai lần, vd. "1010." thành "10."), nội dung giữ nguyên.
>
> **Lưu ý:** 2 mục **không có** trong bộ pixelfx trên máy (bản 0.3.1, `C:\Users\Lenovo\Downloads\pixelfx`),
> lệnh xuất sprite của chúng sẽ báo lỗi: `holy/phoenix-flare` (mục 56) và `scifi/cyber-shield` (mục 153).
> 244 mục còn lại xuất được.
>
> Bản lọc theo Kael, Aeris, boss và trạng thái đã dùng trong game: `SKILLS_CHEATSHEET.md`.

## 1. [Ma Pháp Arcane] Arcane beam (`arcane/arcane-beam`)

Tạo/Tích hợp hiệu ứng Pixel Art Arcane beam (`arcane/arcane-beam`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 264x100px | Thời lượng: 1.2s
- **Mô tả chuyển động:** A beam fires right from the hand: a white core, strands twisting round it, pulses running down it, a flaring source and an end that sprays sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/arcane-beam --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/arcane-beam'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Arcane beam trong game RPG / Đi ải 2D. File xuất ra: records/arcane/arcane-beam/arcane-beam.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 2. [Ma Pháp Arcane] Arcane missiles (`arcane/arcane-missiles`)

Tạo/Tích hợp hiệu ứng Pixel Art Arcane missiles (`arcane/arcane-missiles`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 240x116px | Thời lượng: 1.75s
- **Mô tả chuyển động:** A volley of violet bolts fans out of the hand, curls round on twisting ribbons and pops on the target one after another.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/arcane-missiles --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/arcane-missiles'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Arcane missiles trong game RPG / Đi ải 2D. File xuất ra: records/arcane/arcane-missiles/arcane-missiles.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 3. [Ma Pháp Arcane] Arcane orb (`arcane/arcane-orb`)

Tạo/Tích hợp hiệu ứng Pixel Art Arcane orb (`arcane/arcane-orb`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x112px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A floating orb of smoky violet glass with a swirl turning round a white-hot heart, two tilted rings of light orbiting behind and in front.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/arcane-orb --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/arcane-orb'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Arcane orb trong game RPG / Đi ải 2D. File xuất ra: records/arcane/arcane-orb/arcane-orb.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 4. [Ma Pháp Arcane] Blink in (`arcane/blink-in`)

Tạo/Tích hợp hiệu ứng Pixel Art Blink in (`arcane/blink-in`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 136x96px | Thời lượng: 1.4s
- **Mô tả chuyển động:** Glittering bits spiral in to a point of light that opens into a line, then into a white silhouette that cools into the caster.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/blink-in --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/blink-in'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blink in trong game RPG / Đi ải 2D. File xuất ra: records/arcane/blink-in/blink-in.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 5. [Ma Pháp Arcane] Blink out (`arcane/blink-out`)

Tạo/Tích hợp hiệu ứng Pixel Art Blink out (`arcane/blink-out`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 136x96px | Thời lượng: 1.6s
- **Mô tả chuyển động:** The caster crackles with gathering light, flashes white, squeezes into a line of light that collapses and pops away in sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/blink-out --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/blink-out'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blink out trong game RPG / Đi ải 2D. File xuất ra: records/arcane/blink-out/blink-out.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 6. [Ma Pháp Arcane] Magic circle cast (`arcane/magic-circle-cast`)

Tạo/Tích hợp hiệu ứng Pixel Art Magic circle cast (`arcane/magic-circle-cast`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 200x220px | Thời lượng: 3.9s
- **Mô tả chuyển động:** A circle draws itself on the floor, runes ignite one by one, it flashes, and a column of light fires up and breaks apart into glints.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/magic-circle-cast --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/magic-circle-cast'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Magic circle cast trong game RPG / Đi ải 2D. File xuất ra: records/arcane/magic-circle-cast/magic-circle-cast.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 7. [Ma Pháp Arcane] Mana burst (`arcane/mana-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Mana burst (`arcane/mana-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x150px | Thời lượng: 1.8s
- **Mô tả chuyển động:** Energy rushes into a point and blows out in a white flash and rings, flinging glowing runes that flare and pop into sparks one after another.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/mana-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/mana-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Mana burst trong game RPG / Đi ải 2D. File xuất ra: records/arcane/mana-burst/mana-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 8. [Ma Pháp Arcane] Portal (`arcane/portal`)

Tạo/Tích hợp hiệu ứng Pixel Art Portal (`arcane/portal`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 152x116px | Thời lượng: 2.4s
- **Mô tả chuyển động:** An upright rift: fibrous spiral arms wind down into the dark, a lit rim wobbles, motes and streaks are pulled in, the floor glows.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/portal --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/portal'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Portal trong game RPG / Đi ải 2D. File xuất ra: records/arcane/portal/portal.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 9. [Ma Pháp Arcane] Rune circle (`arcane/rune-circle`)

Tạo/Tích hợp hiệu ứng Pixel Art Rune circle (`arcane/rune-circle`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x100px | Thời lượng: 4s
- **Mô tả chuyển động:** A rune circle turns on the floor in perspective: a carousel of runes lit by chasing light, a turning square, ticks, motes rising off it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/rune-circle --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/rune-circle'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rune circle trong game RPG / Đi ải 2D. File xuất ra: records/arcane/rune-circle/rune-circle.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 10. [Ma Pháp Arcane] Spell charge (`arcane/spell-charge`)

Tạo/Tích hợp hiệu ứng Pixel Art Spell charge (`arcane/spell-charge`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 120x86px | Thời lượng: 1.6s
- **Mô tả chuyển động:** Energy gathers in the caster's hand: streaks and motes spiral in, rings collapse into a swelling orb that crackles with arcs, ready to fire.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/spell-charge --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/spell-charge'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spell charge trong game RPG / Đi ải 2D. File xuất ra: records/arcane/spell-charge/spell-charge.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 11. [Ma Pháp Arcane] Star fall (`arcane/star-fall`)

Tạo/Tích hợp hiệu ứng Pixel Art Star fall (`arcane/star-fall`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 232x172px | Thời lượng: 2.5s
- **Mô tả chuyển động:** Stars streak down on long trails across an area, each landing with a white flash, a ring across the floor and a kick of sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/star-fall --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/star-fall'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Star fall trong game RPG / Đi ải 2D. File xuất ra: records/arcane/star-fall/star-fall.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 12. [Ma Pháp Arcane] Time stop (`arcane/time-stop`)

Tạo/Tích hợp hiệu ứng Pixel Art Time stop (`arcane/time-stop`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 196x136px | Thời lượng: 3.6s
- **Mô tả chuyển động:** A clock face springs open, ticks slower and slower, freezes drained of colour, cracks, then shatters into falling shards.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs arcane/time-stop --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/arcane/time-stop'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Time stop trong game RPG / Đi ải 2D. File xuất ra: records/arcane/time-stop/time-stop.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 13. [Sinh Vật Sống Động] Bat (`critters/bat`)

Tạo/Tích hợp hiệu ứng Pixel Art Bat (`critters/bat`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x80px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A bat flaps in four snappy wing frames along a figure-eight, its body lifting on each downbeat, moonlight on its wing bones, red eyes glowing and glinting.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/bat --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/bat'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bat trong game RPG / Đi ải 2D. File xuất ra: records/critters/bat/bat.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 14. [Sinh Vật Sống Động] Bird (`critters/bird`)

Tạo/Tích hợp hiệu ứng Pixel Art Bird (`critters/bird`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x80px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A songbird flies in place: bursts of wingbeats that lift its body on each downstroke, a glide on spread wings, its tail fanning, a loose feather drifting away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/bird --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/bird'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bird trong game RPG / Đi ải 2D. File xuất ra: records/critters/bird/bird.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 15. [Sinh Vật Sống Động] Butterfly (`critters/butterfly`)

Tạo/Tích hợp hiệu ứng Pixel Art Butterfly (`critters/butterfly`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x88px | Thời lượng: 3.2s
- **Mô tả chuyển động:** An iridescent butterfly wanders a loop in bursts of quick wingbeats and open-winged glides, its veined, spotted wings shedding a twinkling trail of glowing dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/butterfly --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/butterfly'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Butterfly trong game RPG / Đi ải 2D. File xuất ra: records/critters/butterfly/butterfly.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 16. [Sinh Vật Sống Động] Eyeball (`critters/eyeball`)

Tạo/Tích hợp hiệu ứng Pixel Art Eyeball (`critters/eyeball`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x108px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A bloodshot eyeball floats in its fleshy lids: its glowing iris snaps from one look to the next, it blinks, and its nerve sways behind it as it bobs.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/eyeball --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/eyeball'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Eyeball trong game RPG / Đi ải 2D. File xuất ra: records/critters/eyeball/eyeball.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 17. [Sinh Vật Sống Động] Fish school (`critters/fish-school`)

Tạo/Tích hợp hiệu ứng Pixel Art Fish school (`critters/fish-school`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x80px | Thời lượng: 4.8s
- **Mô tả chuyển động:** A school of fish holds station in two depth rows: bodies wag into swinging tails, one darts ahead now and then, bubbles rise and caustic light ripples over them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/fish-school --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/fish-school'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fish school trong game RPG / Đi ải 2D. File xuất ra: records/critters/fish-school/fish-school.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 18. [Sinh Vật Sống Động] Flying skull (`critters/flying-skull`)

Tạo/Tích hợp hiệu ứng Pixel Art Flying skull (`critters/flying-skull`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x132px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A cracked bone skull bobs in the air, jaw chattering, eyes burning, a fire roaring off its crown that sheds flame puffs, embers and smoke and throws warm light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/flying-skull --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/flying-skull'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Flying skull trong game RPG / Đi ải 2D. File xuất ra: records/critters/flying-skull/flying-skull.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 19. [Sinh Vật Sống Động] Frog (`critters/frog`)

Tạo/Tích hợp hiệu ứng Pixel Art Frog (`critters/frog`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x88px | Thời lượng: 2.6s
- **Mô tả chuyển động:** A frog puffs its throat, blinks, crouches and leaps to snap a buzzing fly out of the air, then lands with a squash and a puff of dust, gulps and settles.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/frog --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/frog'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Frog trong game RPG / Đi ải 2D. File xuất ra: records/critters/frog/frog.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 20. [Sinh Vật Sống Động] Ghost (`critters/ghost`)

Tạo/Tích hợp hiệu ứng Pixel Art Ghost (`critters/ghost`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x100px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A sheet ghost bobs over the floor: its scalloped hem ripples and trails its drift, little arms flutter, it glances about and blinks, motes trickle off its hem.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/ghost --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/ghost'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ghost trong game RPG / Đi ải 2D. File xuất ra: records/critters/ghost/ghost.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 21. [Sinh Vật Sống Động] Jellyfish (`critters/jellyfish`)

Tạo/Tích hợp hiệu ứng Pixel Art Jellyfish (`critters/jellyfish`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x120px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A see-through jellyfish pulses: its bell squeezes to shove it up and relaxes as it sinks, frilled arms and long tentacles trailing, a glow inside, bubbles drifting by.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/jellyfish --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/jellyfish'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Jellyfish trong game RPG / Đi ải 2D. File xuất ra: records/critters/jellyfish/jellyfish.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 22. [Sinh Vật Sống Động] Slime (`critters/slime`)

Tạo/Tích hợp hiệu ứng Pixel Art Slime (`critters/slime`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x88px | Thời lượng: 1.8s
- **Mô tả chuyển động:** A glossy slime hops in place: it squashes to wind up, stretches into the jump, rounds out in the air, splats down flinging droplets that creep back, then wobbles and blinks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/slime --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/slime'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Slime trong game RPG / Đi ải 2D. File xuất ra: records/critters/slime/slime.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 23. [Sinh Vật Sống Động] Snake (`critters/snake`)

Tạo/Tích hợp hiệu ứng Pixel Art Snake (`critters/snake`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x56px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A snake slithers along the floor, head raised: humps rise and roll back down its patterned body to the tail, dust puffs where it touches down, its forked tongue flicks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/snake --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/snake'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Snake trong game RPG / Đi ải 2D. File xuất ra: records/critters/snake/snake.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 24. [Sinh Vật Sống Động] Wisp (`critters/wisp`)

Tạo/Tích hợp hiệu ứng Pixel Art Wisp (`critters/wisp`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x104px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A will-o'-the-wisp loops a figure-eight over the floor: a little soul-flame with a face, its flame tail licking up and streaming behind, shedding puffs and sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs critters/wisp --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/critters/wisp'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Wisp trong game RPG / Đi ải 2D. File xuất ra: records/critters/wisp/wisp.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 25. [Vụ Nổ & Sóng Chấn] Barrel explosion (`explosions/barrel-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Barrel explosion (`explosions/barrel-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 300x240px | Thời lượng: 5.2s
- **Mô tả chuyển động:** An explosive barrel shudders, its lid bulging and spitting flame, then blows: a fireball column, staves and the lid flying, burning fuel splashed over the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/barrel-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/barrel-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Barrel explosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/barrel-explosion/barrel-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 26. [Vụ Nổ & Sóng Chấn] Big explosion (`explosions/big-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Big explosion (`explosions/big-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 360x300px | Thời lượng: 7.2s
- **Mô tả chuyển động:** A huge ground blast in three beats: a white dome, a rolling fireball that climbs into a mushrooming smoke column, heavy rocks, and fires left burning.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/big-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/big-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Big explosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/big-explosion/big-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 27. [Vụ Nổ & Sóng Chấn] Cartoon POW (`explosions/cartoon-pow`)

Tạo/Tích hợp hiệu ứng Pixel Art Cartoon POW (`explosions/cartoon-pow`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x144px | Thời lượng: 1.05s
- **Mô tả chuyển động:** A comic-book hit: a jagged two-tone burst star slams in with a shake and boiling edges, POW! drops in letter by letter, action lines fly, then it all snaps away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/cartoon-pow --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/cartoon-pow'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Cartoon POW trong game RPG / Đi ải 2D. File xuất ra: records/explosions/cartoon-pow/cartoon-pow.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 28. [Vụ Nổ & Sóng Chấn] Dirt explosion (`explosions/dirt-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Dirt explosion (`explosions/dirt-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 260x240px | Thời lượng: 3.6s
- **Mô tả chuyển động:** A buried charge goes off: a flash under the floor, a V of dirt clods and grit thrown high, a brown dust plume that billows and settles, and a crater left behind.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/dirt-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/dirt-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Dirt explosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/dirt-explosion/dirt-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 29. [Vụ Nổ & Sóng Chấn] Firework burst (`explosions/firework-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Firework burst (`explosions/firework-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 240x248px | Thời lượng: 3.6s
- **Mô tả chuyển động:** A shell climbs, slows and bursts into a sphere of coloured trailing stars round a gold core; they droop, crackle into white pops and fade, leaving glitter.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/firework-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/firework-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Firework burst trong game RPG / Đi ải 2D. File xuất ra: records/explosions/firework-burst/firework-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 30. [Vụ Nổ & Sóng Chấn] Firework rocket (`explosions/firework-rocket`)

Tạo/Tích hợp hiệu ứng Pixel Art Firework rocket (`explosions/firework-rocket`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 300x300px | Thời lượng: 3.8s
- **Mô tả chuyển động:** A rocket fizzes off the ground on a sparkling gold trail, coasts, and bursts into a palm: heavy gold fronds arc out, droop on glittering trails and crackle at the tips.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/firework-rocket --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/firework-rocket'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Firework rocket trong game RPG / Đi ải 2D. File xuất ra: records/explosions/firework-rocket/firework-rocket.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 31. [Vụ Nổ & Sóng Chấn] Grenade (`explosions/grenade`)

Tạo/Tích hợp hiệu ứng Pixel Art Grenade (`explosions/grenade`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 300x200px | Thời lượng: 4.2s
- **Mô tả chuyển động:** A grenade is lobbed in, bounces, rolls to a stop with its fuse fizzing, shudders, then blows: a white flash, shrapnel streaks, sparks, a small fireball and a scorch.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/grenade --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/grenade'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Grenade trong game RPG / Đi ải 2D. File xuất ra: records/explosions/grenade/grenade.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 32. [Vụ Nổ & Sóng Chấn] Implosion (`explosions/implosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Implosion (`explosions/implosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x184px | Thời lượng: 1.65s
- **Mô tả chuyển động:** Everything is sucked in: streaks and grit rush inward, rings contract and a dark sphere collapses onto a crushed white point; a beat of stillness, then a sharp pop.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/implosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/implosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Implosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/implosion/implosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 33. [Vụ Nổ & Sóng Chấn] Nuke (`explosions/nuke`)

Tạo/Tích hợp hiệu ứng Pixel Art Nuke (`explosions/nuke`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 400x320px | Thời lượng: 9s
- **Mô tả chuyển động:** A blinding white frame, then a fireball lifts on a thin stem into a wide rolling cap that glows from inside; a white skirt flashes and a dust surge sweeps the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/nuke --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/nuke'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Nuke trong game RPG / Đi ải 2D. File xuất ra: records/explosions/nuke/nuke.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 34. [Vụ Nổ & Sóng Chấn] Plasma explosion (`explosions/plasma-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Plasma explosion (`explosions/plasma-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 224x200px | Thời lượng: 1.7s
- **Mô tả chuyển động:** A blue-violet energy blast with no smoke: a white flash, a ball of plasma swelling into a thinning shell, shock rings in and out of depth, lightning arcs crackling off it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/plasma-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/plasma-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Plasma explosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/plasma-explosion/plasma-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 35. [Vụ Nổ & Sóng Chấn] Explosion (`explosions/small-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Explosion (`explosions/small-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 300x240px | Thời lượng: 5.4s
- **Mô tả chuyển động:** A ground blast: a white flash and shock rings, fire that cools into a rolling smoke column, sparks, burning brands that land and keep burning, tumbling rocks and a glowing scorch.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/small-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/small-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Explosion trong game RPG / Đi ải 2D. File xuất ra: records/explosions/small-explosion/small-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 36. [Vụ Nổ & Sóng Chấn] Smoke bomb (`explosions/smoke-bomb`)

Tạo/Tích hợp hiệu ứng Pixel Art Smoke bomb (`explosions/smoke-bomb`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 260x176px | Thời lượng: 5s
- **Mô tả chuyển động:** A round canister clinks down, fuse sparking, and pops: thick grey-violet smoke gushes out, rolls along the floor, billows into a cloud that hides all, then thins to wisps.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs explosions/smoke-bomb --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/explosions/smoke-bomb'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Smoke bomb trong game RPG / Đi ải 2D. File xuất ra: records/explosions/smoke-bomb/smoke-bomb.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 37. [Hệ Lửa & Hỏa Diệm] Brazier (`fire/brazier`)

Tạo/Tích hợp hiệu ứng Pixel Art Brazier (`fire/brazier`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x148px | Thời lượng: 3s
- **Mô tả chuyển động:** An iron bowl on a tripod heaped with glowing coals and a big roaring fire, sparks and embers streaming up off it, light on the iron and the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/brazier --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/brazier'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Brazier trong game RPG / Đi ải 2D. File xuất ra: records/fire/brazier/brazier.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 38. [Hệ Lửa & Hỏa Diệm] Campfire (`fire/campfire`)

Tạo/Tích hợp hiệu ứng Pixel Art Campfire (`fire/campfire`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x128px | Thời lượng: 3s
- **Mô tả chuyển động:** Crossed logs on a bed of coals and a lively fire: tongues that lick and leap, popping sparks, embers drifting up, smoke curling off, a warm pool of light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/campfire --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/campfire'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Campfire trong game RPG / Đi ải 2D. File xuất ra: records/fire/campfire/campfire.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 39. [Hệ Lửa & Hỏa Diệm] Candle (`fire/candle`)

Tạo/Tích hợp hiệu ứng Pixel Art Candle (`fire/candle`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 56x76px | Thời lượng: 4s
- **Mô tả chuyển động:** A wax candle in a brass dish: a calm flame with a blue root that sways and stretches, a halo of light, motes drifting in it, a bead of wax running down a drip.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/candle --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/candle'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Candle trong game RPG / Đi ải 2D. File xuất ra: records/fire/candle/candle.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 40. [Hệ Lửa & Hỏa Diệm] Fire breath (`fire/fire-breath`)

Tạo/Tích hợp hiệu ứng Pixel Art Fire breath (`fire/fire-breath`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 160x116px | Thời lượng: 1.5s
- **Mô tả chuyển động:** A roaring cone of fire streaming right from the mouth: white-hot at the lips, billowing out and cooling to red and smoke at its edges, sparks thrown out ahead.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/fire-breath --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/fire-breath'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fire breath trong game RPG / Đi ải 2D. File xuất ra: records/fire/fire-breath/fire-breath.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 41. [Hệ Lửa & Hỏa Diệm] Fire ring (`fire/fire-ring`)

Tạo/Tích hợp hiệu ứng Pixel Art Fire ring (`fire/fire-ring`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 224x128px | Thời lượng: 3.9s
- **Mô tả chuyển động:** A white flash at the feet, then flames race outward along the floor in a ring, flaring as the front passes and burning down behind it over a smouldering scorch.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/fire-ring --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/fire-ring'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fire ring trong game RPG / Đi ải 2D. File xuất ra: records/fire/fire-ring/fire-ring.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 42. [Hệ Lửa & Hỏa Diệm] Fire tornado (`fire/fire-tornado`)

Tạo/Tích hợp hiệu ứng Pixel Art Fire tornado (`fire/fire-tornado`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 120x152px | Thời lượng: 2s
- **Mô tả chuyển động:** A spinning funnel of fire: spiral bands turning round it, licks flung off its sides, a ring of flame whirling at its foot, embers orbiting it in and out of view.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/fire-tornado --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/fire-tornado'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fire tornado trong game RPG / Đi ải 2D. File xuất ra: records/fire/fire-tornado/fire-tornado.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 43. [Hệ Lửa & Hỏa Diệm] Fireball (`fire/fireball`)

Tạo/Tích hợp hiệu ứng Pixel Art Fireball (`fire/fireball`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x56px | Thời lượng: 1.2s
- **Mô tả chuyển động:** A fireball flying right: a churning white-hot head with a corona of flame, a long torn tail of flame puffs cooling into smoke, embers shed behind.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/fireball --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/fireball'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fireball trong game RPG / Đi ải 2D. File xuất ra: records/fire/fireball/fireball.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 44. [Hệ Lửa & Hỏa Diệm] Flame pillar (`fire/flame-pillar`)

Tạo/Tích hợp hiệu ứng Pixel Art Flame pillar (`fire/flame-pillar`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x256px | Thời lượng: 5s
- **Mô tả chuyển động:** The floor cracks and glows, a column of fire erupts white-hot and roars, spewing embers and shedding flame, then collapses into rolling smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/flame-pillar --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/flame-pillar'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Flame pillar trong game RPG / Đi ải 2D. File xuất ra: records/fire/flame-pillar/flame-pillar.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 45. [Hệ Lửa & Hỏa Diệm] Flamethrower (`fire/flamethrower`)

Tạo/Tích hợp hiệu ứng Pixel Art Flamethrower (`fire/flamethrower`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 184x104px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A pressurised jet shooting right: a blue pilot at the nozzle, a tight stream with surges racing down it, a sputter, burning drops falling off, a tip that curls up into smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/flamethrower --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/flamethrower'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Flamethrower trong game RPG / Đi ải 2D. File xuất ra: records/fire/flamethrower/flamethrower.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 46. [Hệ Lửa & Hỏa Diệm] Meteor (`fire/meteor`)

Tạo/Tích hợp hiệu ứng Pixel Art Meteor (`fire/meteor`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 272x232px | Thời lượng: 5s
- **Mô tả chuyển động:** A burning rock streaks in from the upper left in a comet of fire and smashes into the floor: a white flash, a fireball, rocks and brands thrown, a glowing crater that cools.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/meteor --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/meteor'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Meteor trong game RPG / Đi ải 2D. File xuất ra: records/fire/meteor/meteor.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 47. [Hệ Lửa & Hỏa Diệm] Spirit flame (`fire/spirit-flame`)

Tạo/Tích hợp hiệu ứng Pixel Art Spirit flame (`fire/spirit-flame`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 80x124px | Thời lượng: 3s
- **Mô tả chuyển động:** A cold blue-teal ghost fire floating in the air: a bright rim round a hollow dark heart, a wave climbing its wispy tail, curls breaking off, cold sparks rising.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/spirit-flame --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/spirit-flame'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spirit flame trong game RPG / Đi ải 2D. File xuất ra: records/fire/spirit-flame/spirit-flame.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 48. [Hệ Lửa & Hỏa Diệm] Torch (`fire/torch`)

Tạo/Tích hợp hiệu ứng Pixel Art Torch (`fire/torch`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x120px | Thời lượng: 2s
- **Mô tả chuyển động:** A wall torch on an iron bracket: a licking flame leaping off a pitch-soaked wrap, licks and puffs torn off its tips, smoke, embers, a flickering light on the wall.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs fire/torch --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/fire/torch'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Torch trong game RPG / Đi ải 2D. File xuất ra: records/fire/torch/torch.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 49. [Thánh Quang & Ánh Sáng] Blessing (`holy/blessing`)

Tạo/Tích hợp hiệu ứng Pixel Art Blessing (`holy/blessing`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 80x128px | Thời lượng: 3s
- **Mô tả chuyển động:** A soft cone of light rests on the character from above; sparkles drift down through it, twinkling, and wink out where they land on the head and shoulders.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/blessing --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/blessing'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blessing trong game RPG / Đi ải 2D. File xuất ra: records/holy/blessing/blessing.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 50. [Thánh Quang & Ánh Sáng] Divine shield (`holy/divine-shield`)

Tạo/Tích hợp hiệu ứng Pixel Art Divine shield (`holy/divine-shield`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 88x84px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A bubble of gold light round the character: a bright rim and a thin gold film, meridians turning like a slow globe, a sheen sweeping across and sparkles winking on it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/divine-shield --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/divine-shield'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Divine shield trong game RPG / Đi ải 2D. File xuất ra: records/holy/divine-shield/divine-shield.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 51. [Thánh Quang & Ánh Sáng] Feather burst (`holy/feather-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Feather burst (`holy/feather-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 160x160px | Thời lượng: 3s
- **Mô tả chuyển động:** A white puff pops and throws feathers that brake hard, then rock from side to side as they sink and fade, with down drifting after them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/feather-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/feather-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Feather burst trong game RPG / Đi ải 2D. File xuất ra: records/holy/feather-burst/feather-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 52. [Thánh Quang & Ánh Sáng] Halo (`holy/halo`)

Tạo/Tích hợp hiệu ứng Pixel Art Halo (`holy/halo`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 56x80px | Thời lượng: 2s
- **Mô tả chuyển động:** A ring of gold light floats over the head with a glint running round it; fine dust sifts down from it and the head catches its light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/halo --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/halo'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Halo trong game RPG / Đi ải 2D. File xuất ra: records/holy/halo/halo.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 53. [Thánh Quang & Ánh Sáng] Healing ring (`holy/heal-aoe`)

Tạo/Tích hợp hiệu ứng Pixel Art Healing ring (`holy/heal-aoe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 256x136px | Thời lượng: 2.9s
- **Mô tả chuyển động:** A seed of green light sinks into the floor and a soft ring rolls out from it; the floor glows where it passes and plus signs sprout and float up.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/heal-aoe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/heal-aoe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Healing ring trong game RPG / Đi ải 2D. File xuất ra: records/holy/heal-aoe/heal-aoe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 54. [Thánh Quang & Ánh Sáng] Heal (`holy/heal`)

Tạo/Tích hợp hiệu ứng Pixel Art Heal (`holy/heal`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 80x104px | Thời lượng: 1.9s
- **Mô tả chuyển động:** Petals of light bloom under the feet, a hoop of light rises up the body restoring its colour and leaving sparkles, and motes spiral up and pop into tiny hearts.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/heal --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/heal'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Heal trong game RPG / Đi ải 2D. File xuất ra: records/holy/heal/heal.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 55. [Thánh Quang & Ánh Sáng] Holy pillar (`holy/holy-pillar`)

Tạo/Tích hợp hiệu ứng Pixel Art Holy pillar (`holy/holy-pillar`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 192x232px | Thời lượng: 3.5s
- **Mô tả chuyển động:** Light breaks through from above: a sun opens at the top and a fan of shafts converges on the mark, pulsing, while a sigil burns on the floor; then the fan folds shut.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/holy-pillar --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/holy-pillar'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Holy pillar trong game RPG / Đi ải 2D. File xuất ra: records/holy/holy-pillar/holy-pillar.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 56. [Thánh Quang & Ánh Sáng] Phoenix flare (`holy/phoenix-flare`)

Tạo/Tích hợp hiệu ứng Pixel Art Phoenix flare (`holy/phoenix-flare`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x150px | Thời lượng: 2.5s
- **Mô tả chuyển động:** A holy phoenix of golden fire erupts from the ground, sweeps its radiant wings upward, and bursts into a cascade of glowing feathers and divine embers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/phoenix-flare --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/phoenix-flare'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Phoenix flare trong game RPG / Đi ải 2D. File xuất ra: records/holy/phoenix-flare/phoenix-flare.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 57. [Thánh Quang & Ánh Sáng] Resurrection (`holy/resurrection`)

Tạo/Tích hợp hiệu ứng Pixel Art Resurrection (`holy/resurrection`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 192x160px | Thời lượng: 4.8s
- **Mô tả chuyển động:** Light pours down on the fallen and life climbs back up the body; wings of light unfold, a halo forms, one great wingbeat, then the wings scatter into feathers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/resurrection --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/resurrection'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Resurrection trong game RPG / Đi ải 2D. File xuất ra: records/holy/resurrection/resurrection.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 58. [Thánh Quang & Ánh Sáng] Smite (`holy/smite`)

Tạo/Tích hợp hiệu ứng Pixel Art Smite (`holy/smite`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 224x176px | Thời lượng: 2.8s
- **Mô tả chuyển động:** A glint marks the spot, then a bolt of light drops like a hammer: a white flash, a shockwave over the floor, stone chips flying and cracks that glow and cool.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/smite --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/smite'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Smite trong game RPG / Đi ải 2D. File xuất ra: records/holy/smite/smite.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 59. [Thánh Quang & Ánh Sáng] Sunburst (`holy/sunburst`)

Tạo/Tích hợp hiệu ứng Pixel Art Sunburst (`holy/sunburst`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x128px | Thời lượng: 4s
- **Mô tả chuyển động:** A white-hot core in a gold corona; long and short rays turn slowly round it, breathing, with glints running out along them that wink at the tips.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs holy/sunburst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/holy/sunburst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Sunburst trong game RPG / Đi ải 2D. File xuất ra: records/holy/sunburst/sunburst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 60. [Băng Tuyết & Hàn Băng] Blizzard vortex (`ice/blizzard-vortex`)

Tạo/Tích hợp hiệu ứng Pixel Art Blizzard vortex (`ice/blizzard-vortex`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x116px | Thời lượng: 2s
- **Mô tả chuyển động:** A swirling snow tornado: wind bands spin up a leaning funnel, flakes and ice crystals orbit in front and behind, snow boils at its foot and cold light fills its throat.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/blizzard-vortex --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/blizzard-vortex'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blizzard vortex trong game RPG / Đi ải 2D. File xuất ra: records/ice/blizzard-vortex/blizzard-vortex.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 61. [Băng Tuyết & Hàn Băng] Freeze (`ice/freeze`)

Tạo/Tích hợp hiệu ứng Pixel Art Freeze (`ice/freeze`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x128px | Thời lượng: 4s
- **Mô tả chuyển động:** Frost races in and climbs the character, turning it to ice; a faceted block crystallizes round it pane by pane, glints, cracks and bursts, and the character thaws free.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/freeze --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/freeze'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Freeze trong game RPG / Đi ải 2D. File xuất ra: records/ice/freeze/freeze.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 62. [Băng Tuyết & Hàn Băng] Frost breath (`ice/frost-breath`)

Tạo/Tích hợp hiệu ứng Pixel Art Frost breath (`ice/frost-breath`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 184x104px | Thời lượng: 1.2s
- **Mô tả chuyển động:** A cone of icy wind blowing right: frost puffs billow out, swell and sink, wind streaks race through, ice crystals tumble and glint off a white-hot mouth.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/frost-breath --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/frost-breath'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Frost breath trong game RPG / Đi ải 2D. File xuất ra: records/ice/frost-breath/frost-breath.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 63. [Băng Tuyết & Hàn Băng] Frost nova (`ice/frost-nova`)

Tạo/Tích hợp hiệu ứng Pixel Art Frost nova (`ice/frost-nova`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 288x192px | Thời lượng: 3.4s
- **Mô tả chuyển động:** Frost spirals into a spinning snowflake, then a wave blooms three rings of ice crystals round the caster; snow drifts, frost creeps, and the ice melts back into the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/frost-nova --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/frost-nova'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Frost nova trong game RPG / Đi ải 2D. File xuất ra: records/ice/frost-nova/frost-nova.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 64. [Băng Tuyết & Hàn Băng] Ice crystal (`ice/ice-crystal`)

Tạo/Tích hợp hiệu ứng Pixel Art Ice crystal (`ice/ice-crystal`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x100px | Thời lượng: 3s
- **Mô tả chuyển động:** A floating ice crystal turning slowly in its own cold light: its facets brighten and darken as they turn, glints flash on them, frost motes circle it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/ice-crystal --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/ice-crystal'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ice crystal trong game RPG / Đi ải 2D. File xuất ra: records/ice/ice-crystal/ice-crystal.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 65. [Băng Tuyết & Hàn Băng] Ice lance (`ice/ice-lance`)

Tạo/Tích hợp hiệu ứng Pixel Art Ice lance (`ice/ice-lance`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 176x64px | Thời lượng: 0.8s
- **Mô tả chuyển động:** A faceted ice spear flying right: a light pulse runs through its core, rings of cold air shear off the tip, frost peels off into a wake and crystals shed behind it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/ice-lance --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/ice-lance'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ice lance trong game RPG / Đi ải 2D. File xuất ra: records/ice/ice-lance/ice-lance.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 66. [Băng Tuyết & Hàn Băng] Ice shatter (`ice/ice-shatter`)

Tạo/Tích hợp hiệu ứng Pixel Art Ice shatter (`ice/ice-shatter`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 224x112px | Thời lượng: 2.8s
- **Mô tả chuyển động:** A block of ice takes a hit from the left: it jolts, cracks race over its faces, it flashes white and bursts into chunks that tumble, bounce and skid off in a roll of ice dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/ice-shatter --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/ice-shatter'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ice shatter trong game RPG / Đi ải 2D. File xuất ra: records/ice/ice-shatter/ice-shatter.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 67. [Băng Tuyết & Hàn Băng] Ice spikes (`ice/ice-spikes`)

Tạo/Tích hợp hiệu ứng Pixel Art Ice spikes (`ice/ice-spikes`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 264x112px | Thời lượng: 3s
- **Mô tả chuyển động:** A frost line races along the floor and clusters of jagged ice blades burst up behind it in a rising wave, glint, flash white together and shatter into toppling shards.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/ice-spikes --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/ice-spikes'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ice spikes trong game RPG / Đi ải 2D. File xuất ra: records/ice/ice-spikes/ice-spikes.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 68. [Băng Tuyết & Hàn Băng] Icicle fall (`ice/icicle-fall`)

Tạo/Tích hợp hiệu ứng Pixel Art Icicle fall (`ice/icicle-fall`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x120px | Thời lượng: 2.6s
- **Mô tả chuyển động:** An icicle drips and trembles, snaps off its frosted root, drops, stabs the floor and bursts into skidding shards, splinters and rolling frost.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/icicle-fall --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/icicle-fall'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Icicle fall trong game RPG / Đi ải 2D. File xuất ra: records/ice/icicle-fall/icicle-fall.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 69. [Băng Tuyết & Hàn Băng] Snowflake burst (`ice/snowflake-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Snowflake burst (`ice/snowflake-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 140x120px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A cold pop: frost gathers and flashes white in a ring, then crisp six-armed snowflakes spin out, slow, twinkle and drift down to settle and melt.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ice/snowflake-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ice/snowflake-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Snowflake burst trong game RPG / Đi ải 2D. File xuất ra: records/ice/snowflake-burst/snowflake-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 70. [Va Chạm & Nện Đất] Blunt hit (`impacts/blunt-hit`)

Tạo/Tích hợp hiệu ứng Pixel Art Blunt hit (`impacts/blunt-hit`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 128x88px | Thời lượng: 0.9s
- **Mô tả chuyển động:** A heavy, soft thud: a white-hot lumpy blob cools to cream in a warm pool of light, inked wedges jab out and snap back, a squashed ring of dust puffs swells and drifts, clods drop.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/blunt-hit --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/blunt-hit'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blunt hit trong game RPG / Đi ải 2D. File xuất ra: records/impacts/blunt-hit/blunt-hit.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 71. [Va Chạm & Nện Đất] Bullet impact (`impacts/bullet-impact`)

Tạo/Tích hợp hiệu ứng Pixel Art Bullet impact (`impacts/bullet-impact`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x100px | Thời lượng: 1.4s
- **Mô tả chuyển động:** A bullet hits a wall on the right: a hot half-star, sparks sprayed back in a cone, a puff of grit, chips that fall and bounce, a pock mark cooling to soot.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/bullet-impact --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/bullet-impact'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bullet impact trong game RPG / Đi ải 2D. File xuất ra: records/impacts/bullet-impact/bullet-impact.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 72. [Va Chạm & Nện Đất] Critical hit (`impacts/crit-hit`)

Tạo/Tích hợp hiệu ứng Pixel Art Critical hit (`impacts/crit-hit`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 216x136px | Thời lượng: 0.9s
- **Mô tả chuyển động:** A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/crit-hit --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/crit-hit'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Critical hit trong game RPG / Đi ải 2D. File xuất ra: records/impacts/crit-hit/crit-hit.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 73. [Va Chạm & Nện Đất] Ground slam (`impacts/ground-slam`)

Tạo/Tích hợp hiệu ứng Pixel Art Ground slam (`impacts/ground-slam`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 288x208px | Thời lượng: 3.2s
- **Mô tả chuyển động:** Something lands hard: the floor flashes and cracks, two crescent shock waves race out along it, a dust wave and a tall dust cloud rise, rocks erupt, bounce and settle.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/ground-slam --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/ground-slam'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ground slam trong game RPG / Đi ải 2D. File xuất ra: records/impacts/ground-slam/ground-slam.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 74. [Va Chạm & Nện Đất] Heavy landing (`impacts/heavy-landing`)

Tạo/Tích hợp hiệu ứng Pixel Art Heavy landing (`impacts/heavy-landing`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x80px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A character lands hard: the floor dents and cracks under their feet, two rings of dust roll out along the floor one after the other, and pebbles hop away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/heavy-landing --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/heavy-landing'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Heavy landing trong game RPG / Đi ải 2D. File xuất ra: records/impacts/heavy-landing/heavy-landing.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 75. [Va Chạm & Nện Đất] Hit flash (`impacts/hit-flash`)

Tạo/Tích hợp hiệu ứng Pixel Art Hit flash (`impacts/hit-flash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 80x64px | Thời lượng: 0.5s
- **Mô tả chuyển động:** The character takes damage: a white frame, then their own colors flushed red and blinking white, cooling off, while comic hit lines jab in at them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/hit-flash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/hit-flash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Hit flash trong game RPG / Đi ải 2D. File xuất ra: records/impacts/hit-flash/hit-flash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 76. [Va Chạm & Nện Đất] Hit spark (`impacts/hit-spark`)

Tạo/Tích hợp hiệu ứng Pixel Art Hit spark (`impacts/hit-spark`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 136x80px | Thời lượng: 0.5s
- **Mô tả chuyển động:** The everyday hit: a sharp, lopsided cross flare with one long ray along the blow round a white diamond core, then a cone of sparks and hot chips that fall and bounce.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/hit-spark --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/hit-spark'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Hit spark trong game RPG / Đi ải 2D. File xuất ra: records/impacts/hit-spark/hit-spark.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 77. [Va Chạm & Nện Đất] Impact frame (`impacts/impact-frame`)

Tạo/Tích hợp hiệu ứng Pixel Art Impact frame (`impacts/impact-frame`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 0.3s
- **Mô tả chuyển động:** An anime impact: two frames of white with black burst lines rushing at the hit, two frames inverted, then the lines pull out past the edges and vanish.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/impact-frame --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/impact-frame'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Impact frame trong game RPG / Đi ải 2D. File xuất ra: records/impacts/impact-frame/impact-frame.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 78. [Va Chạm & Nện Đất] Parry (`impacts/parry`)

Tạo/Tích hợp hiệu ứng Pixel Art Parry (`impacts/parry`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 200x112px | Thời lượng: 1s
- **Mô tả chuyển động:** Two blades clash: their edges flash in an X, a white four-point star rings out, a ring breaks into arcs and a fan of gold sparks sprays up and rains down.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/parry --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/parry'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Parry trong game RPG / Đi ải 2D. File xuất ra: records/impacts/parry/parry.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 79. [Va Chạm & Nện Đất] Ricochet (`impacts/ricochet`)

Tạo/Tích hợp hiệu ứng Pixel Art Ricochet (`impacts/ricochet`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 232x84px | Thời lượng: 1.1s
- **Mô tả chuyển động:** A tracer streaks down onto the floor, glances off with a white-hot star and skips away at an angle, leaving a glowing skid while sparks skitter along the ground.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/ricochet --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/ricochet'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ricochet trong game RPG / Đi ải 2D. File xuất ra: records/impacts/ricochet/ricochet.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 80. [Va Chạm & Nện Đất] Shield block (`impacts/shield-block`)

Tạo/Tích hợp hiệu ứng Pixel Art Shield block (`impacts/shield-block`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 148x104px | Thời lượng: 1.1s
- **Mô tả chuyển động:** A blow is caught on a half-dome of energy in front of the character: its diamond lattice flashes, a ripple runs over it, sparks glance off, then it blinks out cell by cell.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs impacts/shield-block --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/impacts/shield-block'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shield block trong game RPG / Đi ải 2D. File xuất ra: records/impacts/shield-block/shield-block.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 81. [Sấm Sét & Hồ Quang] Ball lightning (`lightning/ball-lightning`)

Tạo/Tích hợp hiệu ứng Pixel Art Ball lightning (`lightning/ball-lightning`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x104px | Thời lượng: 4s
- **Mô tả chuyển động:** A crackling ball of plasma drifts on a wandering loop, spitting arcs off its skin and leaving a wake of fading motes, and zaps the floor when it dips low.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/ball-lightning --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/ball-lightning'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ball lightning trong game RPG / Đi ải 2D. File xuất ra: records/lightning/ball-lightning/ball-lightning.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 82. [Sấm Sét & Hồ Quang] Chain lightning (`lightning/chain-lightning`)

Tạo/Tích hợp hiệu ứng Pixel Art Chain lightning (`lightning/chain-lightning`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 248x104px | Thời lượng: 1.8s
- **Mô tả chuyển động:** A bolt leaps from the caster's hand through three targets in turn; each flashes, sparks and grounds itself to the floor while the arcs between them flicker, then the chain snaps.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/chain-lightning --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/chain-lightning'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Chain lightning trong game RPG / Đi ải 2D. File xuất ra: records/lightning/chain-lightning/chain-lightning.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 83. [Sấm Sét & Hồ Quang] Charge up (`lightning/charge-up`)

Tạo/Tích hợp hiệu ứng Pixel Art Charge up (`lightning/charge-up`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 272x184px | Thời lượng: 2.7s
- **Mô tả chuyển động:** Sparks streak and arcs whip in to a crackling core at the caster's hand that swells and pulses faster, then it flashes and bursts: bolts every way, a ring, a spray of sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/charge-up --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/charge-up'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Charge up trong game RPG / Đi ải 2D. File xuất ra: records/lightning/charge-up/charge-up.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 84. [Sấm Sét & Hồ Quang] Electrified (`lightning/electrified`)

Tạo/Tích hợp hiệu ứng Pixel Art Electrified (`lightning/electrified`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 108x92px | Thời lượng: 2s
- **Mô tả chuyển động:** Current runs through a character: arcs crawl over and leap across the body, sparks spit off, the body flares to an electric silhouette on each jolt, and the feet ground out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/electrified --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/electrified'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Electrified trong game RPG / Đi ải 2D. File xuất ra: records/lightning/electrified/electrified.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 85. [Sấm Sét & Hồ Quang] Lightning strike (`lightning/lightning-strike`)

Tạo/Tích hợp hiệu ứng Pixel Art Lightning strike (`lightning/lightning-strike`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 240x264px | Thời lượng: 3s
- **Mô tả chuyển động:** A targeted strike: a sigil charges on the floor, the scene darkens, a thick bolt slams into it, arcs race out along the cracks it splits, the channel crumbles to a scorch.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/lightning-strike --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/lightning-strike'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Lightning strike trong game RPG / Đi ải 2D. File xuất ra: records/lightning/lightning-strike/lightning-strike.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 86. [Sấm Sét & Hồ Quang] Plasma ball (`lightning/plasma-ball`)

Tạo/Tích hợp hiệu ứng Pixel Art Plasma ball (`lightning/plasma-ball`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x104px | Thời lượng: 3s
- **Mô tả chuyển động:** A glass globe on a dark pedestal: wandering plasma tendrils reach from the core to the glass and fan out in bright feet where they touch it, lighting the stand and floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/plasma-ball --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/plasma-ball'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Plasma ball trong game RPG / Đi ải 2D. File xuất ra: records/lightning/plasma-ball/plasma-ball.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 87. [Sấm Sét & Hồ Quang] Spark arc (`lightning/spark-arc`)

Tạo/Tích hợp hiệu ứng Pixel Art Spark arc (`lightning/spark-arc`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 124x120px | Thời lượng: 2s
- **Mô tả chuyển động:** A climbing arc between two rods: it strikes white at their narrow foot, climbs on rising heat as it stretches and bows, sputters and snaps at the top, then strikes again.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/spark-arc --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/spark-arc'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spark arc trong game RPG / Đi ải 2D. File xuất ra: records/lightning/spark-arc/spark-arc.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 88. [Sấm Sét & Hồ Quang] Storm cloud (`lightning/storm-cloud`)

Tạo/Tích hợp hiệu ứng Pixel Art Storm cloud (`lightning/storm-cloud`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 168x176px | Thời lượng: 3s
- **Mô tả chuyển động:** A storm cloud boils overhead, billows lit from inside by flickering discharges, ragged scud under its flat dark base; rain slants down and once a loop a bolt cracks to the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/storm-cloud --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/storm-cloud'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Storm cloud trong game RPG / Đi ải 2D. File xuất ra: records/lightning/storm-cloud/storm-cloud.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 89. [Sấm Sét & Hồ Quang] Tesla coil (`lightning/tesla-coil`)

Tạo/Tích hợp hiệu ứng Pixel Art Tesla coil (`lightning/tesla-coil`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 224x136px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A copper coil under a steel torus throws branching arcs that lash out in volleys and now and then strike the floor in a spray of sparks, lighting the metal and the ground.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/tesla-coil --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/tesla-coil'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Tesla coil trong game RPG / Đi ải 2D. File xuất ra: records/lightning/tesla-coil/tesla-coil.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 90. [Sấm Sét & Hồ Quang] Thunderclap (`lightning/thunderclap`)

Tạo/Tích hợp hiệu ứng Pixel Art Thunderclap (`lightning/thunderclap`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 288x156px | Thời lượng: 1.9s
- **Mô tả chuyển động:** A thunderclap round the caster: a white flash, forked bolts burst out and stab the floor, a heavy shock ring tears across the ground raising dust and grit, sparks streak away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/thunderclap --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/thunderclap'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Thunderclap trong game RPG / Đi ải 2D. File xuất ra: records/lightning/thunderclap/thunderclap.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 91. [Sấm Sét & Hồ Quang] Zap hit (`lightning/zap-hit`)

Tạo/Tích hợp hiệu ứng Pixel Art Zap hit (`lightning/zap-hit`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 144x112px | Thời lượng: 0.9s
- **Mô tả chuyển động:** A contact zap: an arc snaps in from the left, the hit point overloads into a knot of tiny crackling zigzags, a fern of burn marks glows outward, sparks jink away, ozone puffs.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs lightning/zap-hit --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/lightning/zap-hit'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Zap hit trong game RPG / Đi ải 2D. File xuất ra: records/lightning/zap-hit/zap-hit.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 92. [Cận Chiến Kiếm Đao] Claw swipe (`melee/claw-swipe`)

Tạo/Tích hợp hiệu ứng Pixel Art Claw swipe (`melee/claw-swipe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 128x96px | Thời lượng: 0.9s
- **Mô tả chuyển động:** Three claw marks rake down one after another, white-hot, cooling through orange to red, then close up from both ends and leave a dotted scar, with hot flecks and drips.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/claw-swipe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/claw-swipe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Claw swipe trong game RPG / Đi ải 2D. File xuất ra: records/melee/claw-swipe/claw-swipe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 93. [Cận Chiến Kiếm Đao] Dagger flurry (`melee/dagger-flurry`)

Tạo/Tích hợp hiệu ứng Pixel Art Dagger flurry (`melee/dagger-flurry`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 148x104px | Thời lượng: 0.95s
- **Mô tả chuyển động:** A flurry of small quick crescents at every angle in front of the fighter, each with a flick of sparks, finished by one big cut that glints and bursts.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/dagger-flurry --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/dagger-flurry'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Dagger flurry trong game RPG / Đi ải 2D. File xuất ra: records/melee/dagger-flurry/dagger-flurry.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 94. [Cận Chiến Kiếm Đao] Double slash (`melee/double-slash`)

Tạo/Tích hợp hiệu ứng Pixel Art Double slash (`melee/double-slash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 164x108px | Thời lượng: 0.8s
- **Mô tả chuyển động:** A down cut, then an up cut that crosses it: the moment the X closes both strokes flash white, the crossing bursts with light and sparks, and a dotted X lingers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/double-slash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/double-slash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Double slash trong game RPG / Đi ải 2D. File xuất ra: records/melee/double-slash/double-slash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 95. [Cận Chiến Kiếm Đao] Hammer smash (`melee/hammer-smash`)

Tạo/Tích hợp hiệu ứng Pixel Art Hammer smash (`melee/hammer-smash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x112px | Thời lượng: 2s
- **Mô tả chuyển động:** A hammer drops in front in a wedge of motion: a white slam with rays, a dome of force, a dent with cracks, rocks thrown up that bounce and settle, and dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/hammer-smash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/hammer-smash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Hammer smash trong game RPG / Đi ải 2D. File xuất ra: records/melee/hammer-smash/hammer-smash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 96. [Cận Chiến Kiếm Đao] Heavy cleave (`melee/heavy-cleave`)

Tạo/Tích hợp hiệu ứng Pixel Art Heavy cleave (`melee/heavy-cleave`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x116px | Thời lượng: 1.9s
- **Mô tả chuyển động:** A glint over the head, then a thick ember arc accelerates over the top into the floor: a white slam, glowing cracks, dust rolling both ways, grit and rising embers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/heavy-cleave --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/heavy-cleave'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Heavy cleave trong game RPG / Đi ải 2D. File xuất ra: records/melee/heavy-cleave/heavy-cleave.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 97. [Cận Chiến Kiếm Đao] Scythe reap (`melee/scythe-reap`)

Tạo/Tích hợp hiệu ứng Pixel Art Scythe reap (`melee/scythe-reap`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x116px | Thời lượng: 2.1s
- **Mô tả chuyển động:** A slow, huge dark crescent reaps round the front with a pale ghostly edge; it hangs, then tears away from the tail into curling wisps and cold vapour.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/scythe-reap --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/scythe-reap'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Scythe reap trong game RPG / Đi ải 2D. File xuất ra: records/melee/scythe-reap/scythe-reap.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 98. [Cận Chiến Kiếm Đao] Spear sweep (`melee/spear-sweep`)

Tạo/Tích hợp hiệu ứng Pixel Art Spear sweep (`melee/spear-sweep`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 216x84px | Thời lượng: 1.5s
- **Mô tả chuyển động:** A wide low sweep at shin height: a long flat crescent swings from behind the legs round the front, and the wind of it kicks a wake of dust and grit along the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/spear-sweep --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/spear-sweep'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spear sweep trong game RPG / Đi ải 2D. File xuất ra: records/melee/spear-sweep/spear-sweep.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 99. [Cận Chiến Kiếm Đao] Spin slash (`melee/spin-slash`)

Tạo/Tích hợp hiệu ứng Pixel Art Spin slash (`melee/spin-slash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x104px | Thời lượng: 0.8s
- **Mô tả chuyển động:** The blade whirls once round the waist on a tilted plane, behind the body and back in front; the closed ring flares white, dissolves into a dotted trace and throws sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/spin-slash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/spin-slash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spin slash trong game RPG / Đi ải 2D. File xuất ra: records/melee/spin-slash/spin-slash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 100. [Cận Chiến Kiếm Đao] Sword slash (`melee/sword-slash`)

Tạo/Tích hợp hiệu ứng Pixel Art Sword slash (`melee/sword-slash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 136x104px | Thời lượng: 0.75s
- **Mô tả chuyển động:** A tilted crescent whips round in two frames, cools from white to deep blue as it trails off, glints at the tip and throws sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/sword-slash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/sword-slash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Sword slash trong game RPG / Đi ải 2D. File xuất ra: records/melee/sword-slash/sword-slash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 101. [Cận Chiến Kiếm Đao] Thrust (`melee/thrust`)

Tạo/Tích hợp hiệu ứng Pixel Art Thrust (`melee/thrust`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 196x76px | Thời lượng: 0.75s
- **Mô tả chuyển động:** A piercing stab: a bundle of streaks shoots out from the hand to a point, a long four-point star flares at the tip with a pierce ring, sparks and speed lines.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/thrust --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/thrust'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Thrust trong game RPG / Đi ải 2D. File xuất ra: records/melee/thrust/thrust.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 102. [Cận Chiến Kiếm Đao] Uppercut (`melee/uppercut`)

Tạo/Tích hợp hiệu ứng Pixel Art Uppercut (`melee/uppercut`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 132x128px | Thời lượng: 0.85s
- **Mô tả chuyển động:** A crescent rises from the floor past the face, and at the top a comic impact star bursts: bold outline, hot core, burst lines, twinkles and sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/uppercut --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/uppercut'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Uppercut trong game RPG / Đi ải 2D. File xuất ra: records/melee/uppercut/uppercut.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 103. [Cận Chiến Kiếm Đao] Whip crack (`melee/whip-crack`)

Tạo/Tích hợp hiệu ứng Pixel Art Whip crack (`melee/whip-crack`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 192x80px | Thời lượng: 0.85s
- **Mô tả chuyển động:** A whip rolls out to the right as a loop running down its length, faster and faster, until the tip flips over and cracks: a white pop, a ring of air, sparks and a puff of smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs melee/whip-crack --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/melee/whip-crack'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Whip crack trong game RPG / Đi ải 2D. File xuất ra: records/melee/whip-crack/whip-crack.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 104. [Chiêu Thức Đòn Đánh] Arrow shot (`moves/arrow-shot`)

Tạo/Tích hợp hiệu ứng Pixel Art Arrow shot (`moves/arrow-shot`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 300x74px | Thời lượng: 1.9s
- **Mô tả chuyển động:** He raises the bow, draws to his cheek, holds his breath and looses: the string snaps forward, the arrow crosses the floor and thuds home.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/arrow-shot --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/arrow-shot'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Arrow shot trong game RPG / Đi ải 2D. File xuất ra: records/moves/arrow-shot/arrow-shot.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 105. [Chiêu Thức Đòn Đánh] Dash strike (`moves/dash-strike`)

Tạo/Tích hợp hiệu ứng Pixel Art Dash strike (`moves/dash-strike`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 372x156px | Thời lượng: 2.3s
- **Mô tả chuyển động:** A crouch, then he's across the floor in a blur of after-images and already cutting: a critical hit, a beat, and he hops back to where he started.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/dash-strike --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/dash-strike'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Dash strike trong game RPG / Đi ải 2D. File xuất ra: records/moves/dash-strike/dash-strike.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 106. [Chiêu Thức Đòn Đánh] Earth stomp (`moves/earth-stomp`)

Tạo/Tích hợp hiệu ứng Pixel Art Earth stomp (`moves/earth-stomp`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 290x142px | Thời lượng: 3.46s
- **Mô tả chuyển động:** A knee comes up, the boot slams down, the floor heaves under the target and a stone spike rams up through it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/earth-stomp --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/earth-stomp'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Earth stomp trong game RPG / Đi ải 2D. File xuất ra: records/moves/earth-stomp/earth-stomp.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 107. [Chiêu Thức Đòn Đánh] Fireball throw (`moves/fireball-throw`)

Tạo/Tích hợp hiệu ứng Pixel Art Fireball throw (`moves/fireball-throw`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 356x244px | Thời lượng: 6.8100000000000005s
- **Mô tả chuyển động:** He gathers fire in his hand, leans back and hurls it: the ball flies, the target takes it in a blast and comes out charred.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/fireball-throw --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/fireball-throw'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fireball throw trong game RPG / Đi ải 2D. File xuất ra: records/moves/fireball-throw/fireball-throw.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 108. [Chiêu Thức Đòn Đánh] Ground pound (`moves/ground-pound`)

Tạo/Tích hợp hiệu ứng Pixel Art Ground pound (`moves/ground-pound`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 304x204px | Thời lượng: 3.8200000000000003s
- **Mô tả chuyển động:** He coils, leaps out of frame height, hangs, and comes down like a rock: the floor cracks, shock waves race out and throw the target about as they pass.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/ground-pound --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/ground-pound'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ground pound trong game RPG / Đi ải 2D. File xuất ra: records/moves/ground-pound/ground-pound.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 109. [Chiêu Thức Đòn Đánh] Holy smite (`moves/holy-smite`)

Tạo/Tích hợp hiệu ứng Pixel Art Holy smite (`moves/holy-smite`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 252x182px | Thời lượng: 2.8s
- **Mô tả chuyển động:** Both hands go up and a glint marks the target; he brings them down and a bolt of light drops like a hammer, leaving the target blanched.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/holy-smite --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/holy-smite'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Holy smite trong game RPG / Đi ải 2D. File xuất ra: records/moves/holy-smite/holy-smite.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 110. [Chiêu Thức Đòn Đánh] Ice lance throw (`moves/ice-lance-throw`)

Tạo/Tích hợp hiệu ứng Pixel Art Ice lance throw (`moves/ice-lance-throw`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 310x136px | Thời lượng: 4.34s
- **Mô tả chuyển động:** Frost gathers into a spear in his hand, he throws it like a javelin, and the target ices over in a burst of snowflakes and shivers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/ice-lance-throw --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/ice-lance-throw'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ice lance throw trong game RPG / Đi ải 2D. File xuất ra: records/moves/ice-lance-throw/ice-lance-throw.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 111. [Chiêu Thức Đòn Đánh] Lightning call (`moves/lightning-call`)

Tạo/Tích hợp hiệu ứng Pixel Art Lightning call (`moves/lightning-call`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 290x266px | Thời lượng: 3s
- **Mô tả chuyển động:** An arm goes up, a sigil lights under the target, and on the downswing a thick bolt comes down on it; the target jolts through the aftershocks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/lightning-call --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/lightning-call'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Lightning call trong game RPG / Đi ải 2D. File xuất ra: records/moves/lightning-call/lightning-call.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 112. [Chiêu Thức Đòn Đánh] Meteor call (`moves/meteor-call`)

Tạo/Tích hợp hiệu ứng Pixel Art Meteor call (`moves/meteor-call`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 380x240px | Thời lượng: 6.43s
- **Mô tả chuyển động:** A long chant: a circle draws itself round him, it flares, he points, and a burning rock comes down on the target and flattens the scene.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/meteor-call --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/meteor-call'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Meteor call trong game RPG / Đi ải 2D. File xuất ra: records/moves/meteor-call/meteor-call.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 113. [Chiêu Thức Đòn Đánh] Pistol shots (`moves/pistol-shots`)

Tạo/Tích hợp hiệu ứng Pixel Art Pistol shots (`moves/pistol-shots`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 378x76px | Thời lượng: 2.6s
- **Mô tả chuyển động:** Three aimed shots: the gun kicks up each time and settles, tracers cross the floor, and the target staggers under each hit.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/pistol-shots --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/pistol-shots'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Pistol shots trong game RPG / Đi ải 2D. File xuất ra: records/moves/pistol-shots/pistol-shots.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 114. [Chiêu Thức Đòn Đánh] Rocket launcher (`moves/rocket-launcher`)

Tạo/Tích hợp hiệu ứng Pixel Art Rocket launcher (`moves/rocket-launcher`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 480x244px | Thời lượng: 6.5600000000000005s
- **Mô tả chuyển động:** He drops to one knee, shoulders the tube and fires: the kick shoves him back along the floor, the rocket crawls out on its jet and the target goes up.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/rocket-launcher --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/rocket-launcher'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rocket launcher trong game RPG / Đi ải 2D. File xuất ra: records/moves/rocket-launcher/rocket-launcher.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 115. [Chiêu Thức Đòn Đánh] Sword combo (`moves/sword-combo`)

Tạo/Tích hợp hiệu ứng Pixel Art Sword combo (`moves/sword-combo`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 264x150px | Thời lượng: 2.975s
- **Mô tả chuyển động:** Three strokes walking forward: a slash, a crossing double cut, and a two-handed cleave into the floor that throws the target about.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs moves/sword-combo --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/moves/sword-combo'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Sword combo trong game RPG / Đi ải 2D. File xuất ra: records/moves/sword-combo/sword-combo.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 116. [Tự Nhiên & Thảo Mộc] Acid splash (`nature/acid-splash`)

Tạo/Tích hợp hiệu ứng Pixel Art Acid splash (`nature/acid-splash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x116px | Thời lượng: 2.8s
- **Mô tả chuyển động:** A gob of acid bursts into a crown and spatters; it eats a glowing, smoking pit into the floor and boils down into it, spitting bright beads, pale steam curling off.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/acid-splash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/acid-splash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Acid splash trong game RPG / Đi ải 2D. File xuất ra: records/nature/acid-splash/acid-splash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 117. [Tự Nhiên & Thảo Mộc] Boulder (`nature/boulder`)

Tạo/Tích hợp hiệu ứng Pixel Art Boulder (`nature/boulder`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 264x120px | Thời lượng: 2.3s
- **Mô tả chuyển động:** A spinning boulder arcs right shedding dust and pebbles, smashes into the floor in a white flash and bursts into tumbling chunks, gravel and rolling dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/boulder --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/boulder'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Boulder trong game RPG / Đi ải 2D. File xuất ra: records/nature/boulder/boulder.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 118. [Tự Nhiên & Thảo Mộc] Earth spike (`nature/earth-spike`)

Tạo/Tích hợp hiệu ứng Pixel Art Earth spike (`nature/earth-spike`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 272x150px | Thời lượng: 3.4s
- **Mô tả chuyển động:** The floor cracks with light and heaves, a faceted stone spike rams up with two side shards in a burst of chips, grit and dust; rubble rains, then it splits and crumbles.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/earth-spike --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/earth-spike'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Earth spike trong game RPG / Đi ải 2D. File xuất ra: records/nature/earth-spike/earth-spike.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 119. [Tự Nhiên & Thảo Mộc] Healing bloom (`nature/healing-bloom`)

Tạo/Tích hợp hiệu ứng Pixel Art Healing bloom (`nature/healing-bloom`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 124x120px | Thời lượng: 3.3s
- **Mô tả chuyển động:** A sprout pushes up and unfurls, a bud swells and opens round a glowing golden heart in a flare of healing light; its petals lift away one by one as motes.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/healing-bloom --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/healing-bloom'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Healing bloom trong game RPG / Đi ải 2D. File xuất ra: records/nature/healing-bloom/healing-bloom.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 120. [Tự Nhiên & Thảo Mộc] Leaf storm (`nature/leaf-storm`)

Tạo/Tích hợp hiệu ứng Pixel Art Leaf storm (`nature/leaf-storm`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x104px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Leaves tumble up a rising spiral round the character, passing behind and in front, turning and flipping, wrapped in bright bands of wind; litter swirls at their feet.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/leaf-storm --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/leaf-storm'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Leaf storm trong game RPG / Đi ải 2D. File xuất ra: records/nature/leaf-storm/leaf-storm.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 121. [Tự Nhiên & Thảo Mộc] Poison cloud (`nature/poison-cloud`)

Tạo/Tích hợp hiệu ứng Pixel Art Poison cloud (`nature/poison-cloud`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 256x100px | Thời lượng: 4s
- **Mô tả chuyển động:** A miasma hugging the floor: ragged sheets of gas lit yellow-green from within, fading to violet, creep out in tongues that curl over at their tips; plumes twist up as ribbons.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/poison-cloud --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/poison-cloud'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Poison cloud trong game RPG / Đi ải 2D. File xuất ra: records/nature/poison-cloud/poison-cloud.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 122. [Tự Nhiên & Thảo Mộc] Quake (`nature/quake`)

Tạo/Tích hợp hiệu ứng Pixel Art Quake (`nature/quake`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 288x104px | Thời lượng: 3.1s
- **Mô tả chuyển động:** The ground jolts three times: a rift tears out along the floor glowing deep inside, slabs of floor heave up and drop back askew, pebbles hop and dust bursts out of the split.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/quake --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/quake'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Quake trong game RPG / Đi ải 2D. File xuất ra: records/nature/quake/quake.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 123. [Tự Nhiên & Thảo Mộc] Root snare (`nature/root-snare`)

Tạo/Tích hợp hiệu ứng Pixel Art Root snare (`nature/root-snare`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 128x96px | Thời lượng: 2.7s
- **Mô tả chuyển động:** The floor cracks and roots burst up round the character, spiralling round its legs; they cinch tight with a snap, hold, then crack and crumble into bark and dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/root-snare --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/root-snare'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Root snare trong game RPG / Đi ải 2D. File xuất ra: records/nature/root-snare/root-snare.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 124. [Tự Nhiên & Thảo Mộc] Spore burst (`nature/spore-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Spore burst (`nature/spore-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 212x132px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A toadstool pushes up, swells and trembles as its gills glow, then squashes and puffs a lumpy cloud of glowing spores that billows up and drifts down twinkling.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/spore-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/spore-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spore burst trong game RPG / Đi ải 2D. File xuất ra: records/nature/spore-burst/spore-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 125. [Tự Nhiên & Thảo Mộc] Thorns (`nature/thorns`)

Tạo/Tích hợp hiệu ứng Pixel Art Thorns (`nature/thorns`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 232x92px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A seam races along the floor and hooked thorns punch up out of it one after another, each bigger than the last, in bursts of dirt and green light; they hold, then sink.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/thorns --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/thorns'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Thorns trong game RPG / Đi ải 2D. File xuất ra: records/nature/thorns/thorns.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 126. [Tự Nhiên & Thảo Mộc] Tornado (`nature/tornado`)

Tạo/Tích hợp hiệu ứng Pixel Art Tornado (`nature/tornado`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 196x168px | Thời lượng: 2s
- **Mô tả chuyển động:** A snaking funnel of spinning wind bands under a flared, churning top that flickers with lightning; leaves and debris whirl round it front and back, dust boils at its foot.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/tornado --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/tornado'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Tornado trong game RPG / Đi ải 2D. File xuất ra: records/nature/tornado/tornado.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 127. [Tự Nhiên & Thảo Mộc] Toxic puddle (`nature/toxic-puddle`)

Tạo/Tích hợp hiệu ứng Pixel Art Toxic puddle (`nature/toxic-puddle`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 176x100px | Thời lượng: 4s
- **Mô tả chuyển động:** Black tar lit from inside by chartreuse veins and a glowing rim, an oily sheen drifting on it; glossy bubbles dome, stretch and pop, vapour curls up in fraying ribbons.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/toxic-puddle --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/toxic-puddle'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Toxic puddle trong game RPG / Đi ải 2D. File xuất ra: records/nature/toxic-puddle/toxic-puddle.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 128. [Tự Nhiên & Thảo Mộc] Vine whip (`nature/vine-whip`)

Tạo/Tích hợp hiệu ứng Pixel Art Vine whip (`nature/vine-whip`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 216x128px | Thời lượng: 1.4s
- **Mô tả chuyển động:** A thorny vine bursts from the floor, rears back coiled, then lashes out right in a whip crack that sprays sap and tears off leaves, before sliding back into the ground.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs nature/vine-whip --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/nature/vine-whip'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Vine whip trong game RPG / Đi ải 2D. File xuất ra: records/nature/vine-whip/vine-whip.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 129. [Thu Thập Vật Phẩm] Chest open (`pickups/chest-open`)

Tạo/Tích hợp hiệu ứng Pixel Art Chest open (`pickups/chest-open`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x112px | Thời lượng: 4.6s
- **Mô tả chuyển động:** A banded chest rattles with gold light leaking from its seam, the lid kicks open, rays fan up, and coins and gems arc out, bounce, glint and get collected.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/chest-open --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/chest-open'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Chest open trong game RPG / Đi ải 2D. File xuất ra: records/pickups/chest-open/chest-open.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 130. [Thu Thập Vật Phẩm] Coin spin (`pickups/coin-spin`)

Tạo/Tích hợp hiệu ứng Pixel Art Coin spin (`pickups/coin-spin`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 56x56px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A thick gold coin turning on its edge: an embossed star face, a reeded rim showing as it goes edge-on, a flash sweeping the face, bobbing over its shadow.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/coin-spin --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/coin-spin'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Coin spin trong game RPG / Đi ải 2D. File xuất ra: records/pickups/coin-spin/coin-spin.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 131. [Thu Thập Vật Phẩm] Collect burst (`pickups/collect-burst`)

Tạo/Tích hợp hiệu ứng Pixel Art Collect burst (`pickups/collect-burst`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 112x108px | Thời lượng: 1.35s
- **Mô tả chuyển động:** The moment of pickup: a white flash and a cross of light, a thin ring snapping out ahead of a softer one, twinkles thrown wide on curving paths that brake, hang and wink out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/collect-burst --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/collect-burst'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Collect burst trong game RPG / Đi ải 2D. File xuất ra: records/pickups/collect-burst/collect-burst.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 132. [Thu Thập Vật Phẩm] Crystal shard (`pickups/crystal-shard`)

Tạo/Tích hợp hiệu ứng Pixel Art Crystal shard (`pickups/crystal-shard`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 64x76px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A broken amber shard hovers and sways: chipped uneven faces, its top sheared off, light pulsing up through glowing cracks and flaring out of the break; splinters orbit it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/crystal-shard --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/crystal-shard'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Crystal shard trong game RPG / Đi ải 2D. File xuất ra: records/pickups/crystal-shard/crystal-shard.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 133. [Thu Thập Vật Phẩm] Gem spin (`pickups/gem-spin`)

Tạo/Tích hợp hiệu ứng Pixel Art Gem spin (`pickups/gem-spin`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 64x64px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A brilliant-cut ruby turning on its axis: real facets catch the light in turn, flashes roll over the crown, refracted light slides across the floor, sparkles wink round it.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/gem-spin --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/gem-spin'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Gem spin trong game RPG / Đi ải 2D. File xuất ra: records/pickups/gem-spin/gem-spin.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 134. [Thu Thập Vật Phẩm] Heart pickup (`pickups/heart-pickup`)

Tạo/Tích hợp hiệu ứng Pixel Art Heart pickup (`pickups/heart-pickup`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 56x60px | Thời lượng: 1.2s
- **Mô tả chuyển động:** A plump glossy heart hovering over its shadow beats lub-dub: a big squash and stretch, a smaller echo, light and a thin ring pulsing out, tiny hearts drifting off.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/heart-pickup --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/heart-pickup'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Heart pickup trong game RPG / Đi ải 2D. File xuất ra: records/pickups/heart-pickup/heart-pickup.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 135. [Thu Thập Vật Phẩm] Key glint (`pickups/key-glint`)

Tạo/Tích hợp hiệu ứng Pixel Art Key glint (`pickups/key-glint`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x60px | Thời lượng: 2s
- **Mô tả chuyển động:** An ornate silver key hovering and rocking; a glint runs from its bow down the shaft to the teeth and bursts off the tip as falling sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/key-glint --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/key-glint'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Key glint trong game RPG / Đi ải 2D. File xuất ra: records/pickups/key-glint/key-glint.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 136. [Thu Thập Vật Phẩm] Loot beam (`pickups/loot-beam`)

Tạo/Tích hợp hiệu ứng Pixel Art Loot beam (`pickups/loot-beam`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x176px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A dropped sword in a tall pillar of rarity light: a white core thinning to the sky, rings pulsing across the floor, motes streaming up, a glint racing up the shaft.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/loot-beam --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/loot-beam'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Loot beam trong game RPG / Đi ải 2D. File xuất ra: records/pickups/loot-beam/loot-beam.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 137. [Thu Thập Vật Phẩm] Potion (`pickups/potion`)

Tạo/Tích hợp hiệu ứng Pixel Art Potion (`pickups/potion`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 56x72px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A round glass flask of glowing brew rocks in the air: the brew sloshes behind the rock, bubbles rise and pop, light glows through the glass, wisps curl off the cork.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/potion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/potion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Potion trong game RPG / Đi ải 2D. File xuất ra: records/pickups/potion/potion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 138. [Thu Thập Vật Phẩm] Power star (`pickups/power-star`)

Tạo/Tích hợp hiệu ứng Pixel Art Power star (`pickups/power-star`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 88x84px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A fat bevelled star rocks side to side and swells on each beat, rays of light turning slowly behind it, sparks spinning off its points.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/power-star --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/power-star'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Power star trong game RPG / Đi ải 2D. File xuất ra: records/pickups/power-star/power-star.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 139. [Thu Thập Vật Phẩm] XP orb (`pickups/xp-orb`)

Tạo/Tích hợp hiệu ứng Pixel Art XP orb (`pickups/xp-orb`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x56px | Thời lượng: 1.8s
- **Mô tả chuyển động:** A small glowing orb races a figure-eight, a comet tail tapering behind it along its path, flecks shed from the tail winking out, its light following it over the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs pickups/xp-orb --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/pickups/xp-orb'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng XP orb trong game RPG / Đi ải 2D. File xuất ra: records/pickups/xp-orb/xp-orb.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 140. [Đạn Bay & Hỏa Tiễn] Arrow (`projectiles/arrow`)

Tạo/Tích hợp hiệu ứng Pixel Art Arrow (`projectiles/arrow`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x32px | Thời lượng: 0.6s
- **Mô tả chuyển động:** An arrow in flight: a steel broadhead catching the light, a wooden shaft, fletching fluttering in the wind, streaks of air peeling off its head and swirling off its feathers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/arrow --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/arrow'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Arrow trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/arrow/arrow.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 141. [Đạn Bay & Hỏa Tiễn] Bullet tracer (`projectiles/bullet-tracer`)

Tạo/Tích hợp hiệu ứng Pixel Art Bullet tracer (`projectiles/bullet-tracer`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 200x40px | Thời lượng: 0.6s
- **Mô tả chuyển động:** A white-hot slug tearing along, its tracer burning behind it in a long streak that sputters and cools from white through gold to red, shedding sparks and a thread of smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/bullet-tracer --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/bullet-tracer'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bullet tracer trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/bullet-tracer/bullet-tracer.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 142. [Đạn Bay & Hỏa Tiễn] Cannon shot (`projectiles/cannonball`)

Tạo/Tích hợp hiệu ứng Pixel Art Cannon shot (`projectiles/cannonball`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x116px | Thời lượng: 3.8s
- **Mô tả chuyển động:** A cannon fires from a muzzle `height` px above the floor (the origin): a white flash, a tongue of flame, the ball arcing off trailing smoke, a big gunsmoke cloud rolling out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/cannonball --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/cannonball'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Cannon shot trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/cannonball/cannonball.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 143. [Đạn Bay & Hỏa Tiễn] Energy disc (`projectiles/energy-disc`)

Tạo/Tích hợp hiệu ứng Pixel Art Energy disc (`projectiles/energy-disc`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 120x52px | Thời lượng: 0.5s
- **Mô tả chuyển động:** A sawblade of crackling energy spinning flat out as it flies: hooked teeth bright on their leading edges, a white hub, spiral arms churning, sparks flung off the teeth.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/energy-disc --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/energy-disc'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Energy disc trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/energy-disc/energy-disc.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 144. [Đạn Bay & Hỏa Tiễn] Signal flare (`projectiles/flare`)

Tạo/Tích hợp hiệu ứng Pixel Art Signal flare (`projectiles/flare`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x232px | Thời lượng: 5s
- **Mô tả chuyển động:** A signal flare streaks up off the ground trailing sparks and smoke, bursts, and hangs as a pulsing red star that drips sparks under its own red-lit smoke, then gutters out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/flare --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/flare'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Signal flare trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/flare/flare.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 145. [Đạn Bay & Hỏa Tiễn] Homing missile (`projectiles/homing-missile`)

Tạo/Tích hợp hiệu ứng Pixel Art Homing missile (`projectiles/homing-missile`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 248x140px | Thời lượng: 3.8s
- **Mô tả chuyển động:** A missile kicks off, arcs up, rolls over and dives onto its target (the origin), its smoke trail left hanging in the air, and hits in a fiery blast of flame, sparks and rocks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/homing-missile --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/homing-missile'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Homing missile trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/homing-missile/homing-missile.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 146. [Đạn Bay & Hỏa Tiễn] Laser bolt (`projectiles/laser-bolt`)

Tạo/Tích hợp hiệu ứng Pixel Art Laser bolt (`projectiles/laser-bolt`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x32px | Thời lượng: 0.5s
- **Mô tả chuyển động:** A red laser bolt: a white-hot core in a rounded head, red bands tapering back, pulses racing down it, a tail that shimmers apart into wavering dashes.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/laser-bolt --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/laser-bolt'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Laser bolt trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/laser-bolt/laser-bolt.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 147. [Đạn Bay & Hỏa Tiễn] Magic missile (`projectiles/magic-missile`)

Tạo/Tích hợp hiệu ứng Pixel Art Magic missile (`projectiles/magic-missile`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x112px | Thời lượng: 1.9s
- **Mô tả chuyển động:** Motes gather into an arcane orb at a hand `height` px above the floor (the origin); it weaves to its target trailing a twisting ribbon and bursts into a star of light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/magic-missile --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/magic-missile'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Magic missile trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/magic-missile/magic-missile.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 148. [Đạn Bay & Hỏa Tiễn] Pistol shot (`projectiles/muzzle-pistol`)

Tạo/Tích hợp hiệu ứng Pixel Art Pistol shot (`projectiles/muzzle-pistol`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 96x72px | Thời lượng: 1.8s
- **Mô tả chuyển động:** One pistol shot from a muzzle `height` px above the floor (the origin): a spiky white-cored flash, sparks, a curl of smoke hooking up and back, a casing that bounces and settles.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/muzzle-pistol --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/muzzle-pistol'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Pistol shot trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/muzzle-pistol/muzzle-pistol.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 149. [Đạn Bay & Hỏa Tiễn] Shotgun blast (`projectiles/muzzle-shotgun`)

Tạo/Tích hợp hiệu ứng Pixel Art Shotgun blast (`projectiles/muzzle-shotgun`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 160x88px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A shotgun blast from a muzzle `height` px above the floor (the origin): a wide ragged fan of flame, pellet streaks, a heavy rolling smoke cloud, a red shell kicked out on the pump.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/muzzle-shotgun --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/muzzle-shotgun'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shotgun blast trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/muzzle-shotgun/muzzle-shotgun.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 150. [Đạn Bay & Hỏa Tiễn] SMG burst (`projectiles/muzzle-smg`)

Tạo/Tích hợp hiệu ứng Pixel Art SMG burst (`projectiles/muzzle-smg`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x72px | Thời lượng: 1s
- **Mô tả chuyển động:** Sustained fire at twelve rounds a second: each shot a different spiky flash with a white core, sparks, smoke wisps piling up and drifting, brass casings bouncing on the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/muzzle-smg --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/muzzle-smg'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng SMG burst trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/muzzle-smg/muzzle-smg.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 151. [Đạn Bay & Hỏa Tiễn] Plasma shot (`projectiles/plasma-shot`)

Tạo/Tích hợp hiệu ứng Pixel Art Plasma shot (`projectiles/plasma-shot`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 144x60px | Thời lượng: 0.8s
- **Mô tả chuyển động:** A glowing plasma blob: hot knots churning in its core, a corona crackling over its skin, its tail necking into droplets that tear off, cool and wink out behind.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/plasma-shot --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/plasma-shot'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Plasma shot trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/plasma-shot/plasma-shot.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 152. [Đạn Bay & Hỏa Tiễn] Rocket (`projectiles/rocket`)

Tạo/Tích hợp hiệu ứng Pixel Art Rocket (`projectiles/rocket`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 288x76px | Thời lượng: 1.2s
- **Mô tả chuyển động:** A steel rocket roars along: a flickering jet with shock diamonds and a white-hot nozzle, a thick billowing smoke trail lit by the flame, sparks shed behind.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs projectiles/rocket --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/projectiles/rocket'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rocket trong game RPG / Đi ải 2D. File xuất ra: records/projectiles/rocket/rocket.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 153. [Viễn Tưởng Sci-Fi] Cyber shield (`scifi/cyber-shield`)

Tạo/Tích hợp hiệu ứng Pixel Art Cyber shield (`scifi/cyber-shield`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x136px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A holographic energy barrier: dual counter-rotating cyber rings, pulsing hex telemetry brackets, orbital data bits, and crackling deflection arcs around a bright plasma emitter.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/cyber-shield --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/cyber-shield'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Cyber shield trong game RPG / Đi ải 2D. File xuất ra: records/scifi/cyber-shield/cyber-shield.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 154. [Viễn Tưởng Sci-Fi] EMP blast (`scifi/emp-blast`)

Tạo/Tích hợp hiệu ứng Pixel Art EMP blast (`scifi/emp-blast`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x116px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A disc charge ticks, pops white, and a bubble of rolling scanlines swells out with arcs crawling its skin; it strobes, tears and shorts out into falling dead pixels.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/emp-blast --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/emp-blast'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng EMP blast trong game RPG / Đi ải 2D. File xuất ra: records/scifi/emp-blast/emp-blast.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 155. [Viễn Tưởng Sci-Fi] Energy core (`scifi/energy-core`)

Tạo/Tích hợp hiệu ứng Pixel Art Energy core (`scifi/energy-core`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x100px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A plasma core beating in a steel cage: it swells and throws a shock ring on each beat, two tilted rings orbit it, and arcs jump to the bars and spark.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/energy-core --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/energy-core'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Energy core trong game RPG / Đi ải 2D. File xuất ra: records/scifi/energy-core/energy-core.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 156. [Viễn Tưởng Sci-Fi] Force field (`scifi/force-field`)

Tạo/Tích hợp hiệu ứng Pixel Art Force field (`scifi/force-field`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 184x104px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A glassy dome of hex plates over the hero: plates glint, tracers from the right slam into it, a ripple and cracks of light race across, sparks glance off.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/force-field --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/force-field'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Force field trong game RPG / Đi ải 2D. File xuất ra: records/scifi/force-field/force-field.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 157. [Viễn Tưởng Sci-Fi] Glitch (`scifi/glitch`)

Tạo/Tích hợp hiệu ứng Pixel Art Glitch (`scifi/glitch`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 88x64px | Thời lượng: 2.4s
- **Mô tả chuyển động:** The hero's signal breaks up in bursts: an RGB split, slices torn sideways, rows smeared out, junk blocks and dead pixels, then snaps back clean.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/glitch --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/glitch'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Glitch trong game RPG / Đi ải 2D. File xuất ra: records/scifi/glitch/glitch.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 158. [Viễn Tưởng Sci-Fi] Hologram (`scifi/hologram`)

Tạo/Tích hợp hiệu ứng Pixel Art Hologram (`scifi/hologram`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x104px | Thời lượng: 4s
- **Mô tả chuyển động:** A floor projector throws a cone of light holding a turning wireframe model: scanlines roll through it, a data ring circles it, and it flickers, tears and jitters.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/hologram --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/hologram'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Hologram trong game RPG / Đi ải 2D. File xuất ra: records/scifi/hologram/hologram.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 159. [Viễn Tưởng Sci-Fi] Jetpack (`scifi/jetpack`)

Tạo/Tích hợp hiệu ứng Pixel Art Jetpack (`scifi/jetpack`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x116px | Thời lượng: 2s
- **Mô tả chuyển động:** Twin thrusters fire straight down: white-hot cores with shock diamonds inside ragged flames, puffs that cool into smoke billowing below, lit by the fire.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/jetpack --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/jetpack'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Jetpack trong game RPG / Đi ải 2D. File xuất ra: records/scifi/jetpack/jetpack.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 160. [Viễn Tưởng Sci-Fi] Laser grid (`scifi/laser-grid`)

Tạo/Tích hợp hiệu ứng Pixel Art Laser grid (`scifi/laser-grid`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x84px | Thời lượng: 3s
- **Mô tả chuyển động:** Security lasers between two steel posts: red beams slide and scissor across, dust and haze light up only where they cut through, and the floor sweepers scorch and spark.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/laser-grid --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/laser-grid'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Laser grid trong game RPG / Đi ải 2D. File xuất ra: records/scifi/laser-grid/laser-grid.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 161. [Viễn Tưởng Sci-Fi] Scanner (`scifi/scanner`)

Tạo/Tích hợp hiệu ứng Pixel Art Scanner (`scifi/scanner`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 112x78px | Thời lượng: 3.2s
- **Mô tả chuyển động:** Brackets snap onto the hero, a scan line sweeps head to toe leaving a cooling outline, and a readout counts up to OK before it all lets go.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/scanner --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/scanner'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Scanner trong game RPG / Đi ải 2D. File xuất ra: records/scifi/scanner/scanner.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 162. [Viễn Tưởng Sci-Fi] Teleporter pad (`scifi/teleporter-pad`)

Tạo/Tích hợp hiệu ứng Pixel Art Teleporter pad (`scifi/teleporter-pad`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 96x104px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A steel pad glows on the floor, its rings rippling outward; a soft column of light rises off it and rings of light lift away, sparkles drifting up through them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/teleporter-pad --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/teleporter-pad'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Teleporter pad trong game RPG / Đi ải 2D. File xuất ra: records/scifi/teleporter-pad/teleporter-pad.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 163. [Viễn Tưởng Sci-Fi] Tractor beam (`scifi/tractor-beam`)

Tạo/Tích hợp hiệu ứng Pixel Art Tractor beam (`scifi/tractor-beam`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 120x132px | Thời lượng: 3s
- **Mô tả chuyển động:** A hovering pod projects a cone of light to the floor; rocks tear loose in puffs of dust and spiral up spinning into the lens while rings of light climb the beam.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/tractor-beam --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/tractor-beam'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Tractor beam trong game RPG / Đi ải 2D. File xuất ra: records/scifi/tractor-beam/tractor-beam.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 164. [Viễn Tưởng Sci-Fi] Warp in (`scifi/warp-in`)

Tạo/Tích hợp hiệu ứng Pixel Art Warp in (`scifi/warp-in`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 192x168px | Thời lượng: 3s
- **Mô tả chuyển động:** A beam slams down, rings run down it and a scanline paints the hero in from head to toe, white-hot pixels cooling to their own colors; the beam pinches shut in sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/warp-in --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/warp-in'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Warp in trong game RPG / Đi ải 2D. File xuất ra: records/scifi/warp-in/warp-in.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 165. [Viễn Tưởng Sci-Fi] Warp out (`scifi/warp-out`)

Tạo/Tích hợp hiệu ứng Pixel Art Warp out (`scifi/warp-out`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 128x168px | Thời lượng: 2.6s
- **Mô tả chuyển động:** The hero's outline flickers on, they flash white and break into light from the head down, streaming up a beam that lifts off the floor and pinches shut.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs scifi/warp-out --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/scifi/warp-out'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Warp out trong game RPG / Đi ải 2D. File xuất ra: records/scifi/warp-out/warp-out.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 166. [Bóng Tối & Hắc Ám] Black hole (`shadow/black-hole`)

Tạo/Tích hợp hiệu ứng Pixel Art Black hole (`shadow/black-hole`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 184x132px | Thời lượng: 4s
- **Mô tả chuyển động:** A tilted disk of banded rings turns round a black hole, its far side bent up over the top and under the bottom; debris spirals in, stretches and is swallowed.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/black-hole --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/black-hole'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Black hole trong game RPG / Đi ải 2D. File xuất ra: records/shadow/black-hole/black-hole.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 167. [Bóng Tối & Hắc Ám] Curse (`shadow/curse`)

Tạo/Tích hợp hiệu ứng Pixel Art Curse (`shadow/curse`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 112x124px | Thời lượng: 3.4s
- **Mô tả chuyển động:** Wisps gather over the head, a skull stamps down with a flash, its eyes burn as the curse floods the body violet, then it cracks and crumbles.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/curse --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/curse'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Curse trong game RPG / Đi ải 2D. File xuất ra: records/shadow/curse/curse.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 168. [Bóng Tối & Hắc Ám] Dark explosion (`shadow/dark-explosion`)

Tạo/Tích hợp hiệu ứng Pixel Art Dark explosion (`shadow/dark-explosion`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 280x248px | Thời lượng: 3.8s
- **Mô tả chuyển động:** Motes swirl into a pulsing core, a black star cuts across a violet-white flash, and a black sphere burns at the rim, throws lit shards and smoke, then collapses.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/dark-explosion --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/dark-explosion'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Dark explosion trong game RPG / Đi ải 2D. File xuất ra: records/shadow/dark-explosion/dark-explosion.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 169. [Bóng Tối & Hắc Ám] Eclipse (`shadow/eclipse`)

Tạo/Tích hợp hiệu ứng Pixel Art Eclipse (`shadow/eclipse`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 160x144px | Thời lượng: 4s
- **Mô tả chuyển động:** A black moon over the sun: a breathing pearl corona with long streamers, a thin white rim, and one diamond bead blazing on its edge.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/eclipse --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/eclipse'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Eclipse trong game RPG / Đi ải 2D. File xuất ra: records/shadow/eclipse/eclipse.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 170. [Bóng Tối & Hắc Ám] Grasping hands (`shadow/grasping-hands`)

Tạo/Tích hợp hiệu ứng Pixel Art Grasping hands (`shadow/grasping-hands`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 200x116px | Thời lượng: 3.1s
- **Mô tả chuyển động:** Shadow arms burst up out of a dark pool with a splash, clench their hands into claws, strain, and are dragged back under, fingers clawing at the air.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/grasping-hands --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/grasping-hands'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Grasping hands trong game RPG / Đi ải 2D. File xuất ra: records/shadow/grasping-hands/grasping-hands.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 171. [Bóng Tối & Hắc Ám] Hex sigil (`shadow/hex-sigil`)

Tạo/Tích hợp hiệu ứng Pixel Art Hex sigil (`shadow/hex-sigil`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 168x128px | Thời lượng: 4.2s
- **Mô tả chuyển động:** A burning pen traces a cursed sigil in the air, its glyphs pop in one by one, then it flares white and crumbles into falling embers.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/hex-sigil --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/hex-sigil'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Hex sigil trong game RPG / Đi ải 2D. File xuất ra: records/shadow/hex-sigil/hex-sigil.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 172. [Bóng Tối & Hắc Ám] Life steal (`shadow/life-steal`)

Tạo/Tích hợp hiệu ứng Pixel Art Life steal (`shadow/life-steal`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x100px | Thời lượng: 2.2s
- **Mô tả chuyển động:** A target on the right is struck and bleeds red orbs; they hang a moment, then whip home as comet streaks and flood the caster crimson.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/life-steal --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/life-steal'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Life steal trong game RPG / Đi ải 2D. File xuất ra: records/shadow/life-steal/life-steal.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 173. [Bóng Tối & Hắc Ám] Necro skulls (`shadow/necro-skulls`)

Tạo/Tích hợp hiệu ứng Pixel Art Necro skulls (`shadow/necro-skulls`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x116px | Thời lượng: 3s
- **Mô tả chuyển động:** Spectral skulls circle a cold green flame on a tilted orbit, passing behind and before it, eyes lit, trailing curls of ghost smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/necro-skulls --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/necro-skulls'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Necro skulls trong game RPG / Đi ải 2D. File xuất ra: records/shadow/necro-skulls/necro-skulls.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 174. [Bóng Tối & Hắc Ám] Shadow flames (`shadow/shadow-flames`)

Tạo/Tích hợp hiệu ứng Pixel Art Shadow flames (`shadow/shadow-flames`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 104x112px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Inside-out fire on the floor: a black heart wrapped in violet flame with pale skin and tips, shedding embers and dark smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/shadow-flames --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/shadow-flames'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shadow flames trong game RPG / Đi ải 2D. File xuất ra: records/shadow/shadow-flames/shadow-flames.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 175. [Bóng Tối & Hắc Ám] Shadow tendrils (`shadow/shadow-tendrils`)

Tạo/Tích hợp hiệu ứng Pixel Art Shadow tendrils (`shadow/shadow-tendrils`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x130px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A dark pool opens on the floor; tentacles with lit rims and hooked tips lash up out of it with a splash, writhe, and sink back as it closes.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/shadow-tendrils --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/shadow-tendrils'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shadow tendrils trong game RPG / Đi ải 2D. File xuất ra: records/shadow/shadow-tendrils/shadow-tendrils.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 176. [Bóng Tối & Hắc Ám] Soul drain (`shadow/soul-drain`)

Tạo/Tích hợp hiệu ứng Pixel Art Soul drain (`shadow/soul-drain`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 208x120px | Thời lượng: 3.2s
- **Mô tả chuyển động:** Pale souls are torn loose on the right and dragged down a funnel of streaks into a black crystal vessel, which flares violet as each one lands.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/soul-drain --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/soul-drain'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Soul drain trong game RPG / Đi ải 2D. File xuất ra: records/shadow/soul-drain/soul-drain.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 177. [Bóng Tối & Hắc Ám] Void orb (`shadow/void-orb`)

Tạo/Tích hợp hiệu ứng Pixel Art Void orb (`shadow/void-orb`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 168x160px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A black orb hangs in the air, a pale rim crawling round it; a dark vortex winds into it, motes and streaks are pulled in, and light bends round its edge.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs shadow/void-orb --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/shadow/void-orb'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Void orb trong game RPG / Đi ải 2D. File xuất ra: records/shadow/void-orb/void-orb.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 178. [Triệu Hồi & Tử Trận] Coin drop (`spawn/coin-drop`)

Tạo/Tích hợp hiệu ứng Pixel Art Coin drop (`spawn/coin-drop`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 160x88px | Thời lượng: 3s
- **Mô tả chuyển động:** An enemy goes up in a soft poof and gold coins spin out of it, bounce with a glint on each hit, settle on the floor, twinkle, and wink out one by one.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/coin-drop --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/coin-drop'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Coin drop trong game RPG / Đi ải 2D. File xuất ra: records/spawn/coin-drop/coin-drop.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 179. [Triệu Hồi & Tử Trận] Disintegrate (`spawn/disintegrate`)

Tạo/Tích hợp hiệu ứng Pixel Art Disintegrate (`spawn/disintegrate`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x100px | Thời lượng: 3.4s
- **Mô tả chuyển động:** The character crackles with light, flashes white, then peels away from the head down: each pixel flares white-hot and streams off on the wind as a cooling mote of light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/disintegrate --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/disintegrate'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Disintegrate trong game RPG / Đi ải 2D. File xuất ra: records/spawn/disintegrate/disintegrate.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 180. [Triệu Hồi & Tử Trận] Dissolve burn (`spawn/dissolve-burn`)

Tạo/Tích hợp hiệu ứng Pixel Art Dissolve burn (`spawn/dissolve-burn`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 96x112px | Thời lượng: 3.6s
- **Mô tả chuyển động:** An ember seam lights at the feet and climbs the body: above it the body scorches and smoulders, at it flames lick up, below it there's only falling ash, embers and smoke.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/dissolve-burn --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/dissolve-burn'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Dissolve burn trong game RPG / Đi ải 2D. File xuất ra: records/spawn/dissolve-burn/dissolve-burn.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 181. [Triệu Hồi & Tử Trận] Egg hatch (`spawn/egg-hatch`)

Tạo/Tích hợp hiệu ứng Pixel Art Egg hatch (`spawn/egg-hatch`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 120x96px | Thời lượng: 3.1s
- **Mô tả chuyển động:** A speckled egg rocks three times, each rock cracking it further with warm light leaking out, then pops: light pours out of the opening and lit shell halves tumble away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/egg-hatch --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/egg-hatch'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Egg hatch trong game RPG / Đi ải 2D. File xuất ra: records/spawn/egg-hatch/egg-hatch.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 182. [Triệu Hồi & Tử Trận] Poof (`spawn/poof`)

Tạo/Tích hợp hiệu ứng Pixel Art Poof (`spawn/poof`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 112x92px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A cartoon death poof: a white pop, a ring of soft round smoke balls bursting out between speed lines, little stars spinning off, and the cloud lifting and thinning away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/poof --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/poof'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Poof trong game RPG / Đi ải 2D. File xuất ra: records/spawn/poof/poof.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 183. [Triệu Hồi & Tử Trận] Respawn beam (`spawn/respawn-beam`)

Tạo/Tích hợp hiệu ứng Pixel Art Respawn beam (`spawn/respawn-beam`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 128x150px | Thời lượng: 2.5s
- **Mô tả chuyển động:** A guide line drops, a pillar of light slams onto the spot, and a scan bar climbs from the feet writing the character back in row by row, white-hot lines cooling to its colors.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/respawn-beam --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/respawn-beam'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Respawn beam trong game RPG / Đi ải 2D. File xuất ra: records/spawn/respawn-beam/respawn-beam.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 184. [Triệu Hồi & Tử Trận] Shatter death (`spawn/shatter-death`)

Tạo/Tích hợp hiệu ứng Pixel Art Shatter death (`spawn/shatter-death`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 172x96px | Thời lượng: 3.3s
- **Mô tả chuyển động:** Frost races up the body and seals it in faceted ice, a glint sweeps it, cracks spread from the chest, then it bursts into its own facets that tumble, bounce and melt.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/shatter-death --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/shatter-death'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shatter death trong game RPG / Đi ải 2D. File xuất ra: records/spawn/shatter-death/shatter-death.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 185. [Triệu Hồi & Tử Trận] Soul rise (`spawn/soul-rise`)

Tạo/Tích hợp hiệu ứng Pixel Art Soul rise (`spawn/soul-rise`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 96x140px | Thời lượng: 3.2s
- **Mô tả chuyển động:** The body's outline flares and dims, then a pale glowing copy of it lifts out, stretching as its legs melt into a rippling wisp, shedding motes until it thins into light.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/soul-rise --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/soul-rise'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Soul rise trong game RPG / Đi ải 2D. File xuất ra: records/spawn/soul-rise/soul-rise.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 186. [Triệu Hồi & Tử Trận] Spawn portal (`spawn/spawn-portal`)

Tạo/Tích hợp hiệu ứng Pixel Art Spawn portal (`spawn/spawn-portal`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x150px | Thời lượng: 3.8s
- **Mô tả chuyển động:** A rift tears open on the floor and swirls, belches violet smoke and sparks, spits a fountain of wisps up out of itself, then twists shut with a pop.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/spawn-portal --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/spawn-portal'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Spawn portal trong game RPG / Đi ải 2D. File xuất ra: records/spawn/spawn-portal/spawn-portal.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 187. [Triệu Hồi & Tử Trận] Summon rise (`spawn/summon-rise`)

Tạo/Tích hợp hiệu ứng Pixel Art Summon rise (`spawn/summon-rise`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x116px | Thời lượng: 4.6s
- **Mô tả chuyển động:** A rune circle burns into the floor, the ground bursts, and a horned brute heaves up out of it through dust and rubble, lit from below, until its eyes flare.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs spawn/summon-rise --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/spawn/summon-rise'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Summon rise trong game RPG / Đi ải 2D. File xuất ra: records/spawn/summon-rise/summon-rise.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 188. [Trạng Thái & Bùa Chú] Bleeding (`status/bleeding`)

Tạo/Tích hợp hiệu ứng Pixel Art Bleeding (`status/bleeding`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 60x56px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Bleeding out: beads swell at three wounds, run, let go and fall to spatter into a glossy pool that ripples; each heartbeat spurts a little and flashes the body red.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/bleeding --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/bleeding'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bleeding trong game RPG / Đi ải 2D. File xuất ra: records/status/bleeding/bleeding.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 189. [Trạng Thái & Bùa Chú] Burning (`status/burning`)

Tạo/Tích hợp hiệu ứng Pixel Art Burning (`status/burning`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x80px | Thời lượng: 1.2s
- **Mô tả chuyển động:** Burning over time: small flames lick from four hot spots, trailing sparks and thin smoke; every 0.6 s they flare, the body flashes white then orange, scorch marks spread.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/burning --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/burning'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Burning trong game RPG / Đi ải 2D. File xuất ra: records/status/burning/burning.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 190. [Trạng Thái & Bùa Chú] Charmed (`status/charmed`)

Tạo/Tích hợp hiệu ứng Pixel Art Charmed (`status/charmed`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 60x76px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Smitten: a big heart beats over the head, throwing a ring and a flush of light with every beat, little hearts float up, the eyes go pink and the cheeks blush.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/charmed --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/charmed'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Charmed trong game RPG / Đi ải 2D. File xuất ra: records/status/charmed/charmed.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 191. [Trạng Thái & Bùa Chú] Confused (`status/confused`)

Tạo/Tích hợp hiệu ứng Pixel Art Confused (`status/confused`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 60x78px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Head in a spin: a glowing spiral whirls over the head, question marks pop up round it and bob, the eyes dart left and right.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/confused --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/confused'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Confused trong game RPG / Đi ải 2D. File xuất ra: records/status/confused/confused.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 192. [Trạng Thái & Bùa Chú] Cursed (`status/cursed`)

Tạo/Tích hợp hiệu ứng Pixel Art Cursed (`status/cursed`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 64x84px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Hexed: violet smoke rises off the body in winding trails, a dark stain creeps up from the feet with a glowing edge, the eyes burn, a skull glitches in overhead.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/cursed --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/cursed'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Cursed trong game RPG / Đi ải 2D. File xuất ra: records/status/cursed/cursed.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 193. [Trạng Thái & Bùa Chú] Frozen (`status/frozen`)

Tạo/Tích hợp hiệu ứng Pixel Art Frozen (`status/frozen`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x64px | Thời lượng: 2s
- **Mô tả chuyển động:** Chilled to the bone: frost ferns creep over the body, icicles hang from chin and hands and drip, breath steams, snow settles, a shiver every second, frost spreads underfoot.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/frozen --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/frozen'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Frozen trong game RPG / Đi ải 2D. File xuất ra: records/status/frozen/frozen.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 194. [Trạng Thái & Bùa Chú] Haste (`status/haste`)

Tạo/Tích hợp hiệu ứng Pixel Art Haste (`status/haste`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 100x56px | Thời lượng: 1.2s
- **Mô tả chuyển động:** Sped up: striped after-images stream out behind, speed lines whip past, dust kicks off the heels and the leading edge catches the wind. Faces right.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/haste --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/haste'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Haste trong game RPG / Đi ải 2D. File xuất ra: records/status/haste/haste.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 195. [Trạng Thái & Bùa Chú] Petrified (`status/petrified`)

Tạo/Tích hợp hiệu ứng Pixel Art Petrified (`status/petrified`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 120x74px | Thời lượng: 3.8s
- **Mô tả chuyển động:** Turned to stone: grey creeps up from the feet behind a crackling edge that spits grit, the statue holds, cracks run through it, and it bursts into tumbling chunks and dust.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/petrified --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/petrified'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Petrified trong game RPG / Đi ải 2D. File xuất ra: records/status/petrified/petrified.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 196. [Trạng Thái & Bùa Chú] Poisoned (`status/poisoned`)

Tạo/Tích hợp hiệu ứng Pixel Art Poisoned (`status/poisoned`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x64px | Thời lượng: 1.6s
- **Mô tả chuyển động:** Sick to the bone: green rolls up the body in waves, dark veins creep from a wound, toxic sweat drips and hisses; every 0.8 s it wobbles, blisters pop and a ring pulses out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/poisoned --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/poisoned'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Poisoned trong game RPG / Đi ải 2D. File xuất ra: records/status/poisoned/poisoned.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 197. [Trạng Thái & Bùa Chú] Rage (`status/rage`)

Tạo/Tích hợp hiệu ứng Pixel Art Rage (`status/rage`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 80x80px | Thời lượng: 1.2s
- **Mô tả chuyển động:** Seething: the body judders on every heartbeat, an anger mark throbs at the temple, eyes burn, steam jets off the head, stress lines flash out and the floor cracks hot underfoot.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/rage --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/rage'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rage trong game RPG / Đi ải 2D. File xuất ra: records/status/rage/rage.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 198. [Trạng Thái & Bùa Chú] Sleep (`status/sleep`)

Tạo/Tích hợp hiệu ứng Pixel Art Sleep (`status/sleep`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 60x82px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Fast asleep: eyes shut, soft outlined Zs float up off the head one after another, swaying and growing as they rise, dream motes drift, a slow breathing glow.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/sleep --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/sleep'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Sleep trong game RPG / Đi ải 2D. File xuất ra: records/status/sleep/sleep.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 199. [Trạng Thái & Bùa Chú] Slowed (`status/slowed`)

Tạo/Tích hợp hiệu ứng Pixel Art Slowed (`status/slowed`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 64x76px | Thời lượng: 2.4s
- **Mô tả chuyển động:** Dragged through time: a glassy clock dial behind the head ticks round in heavy steps, flashing with each, while drops sink in slow motion and spread slow rings.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/slowed --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/slowed'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Slowed trong game RPG / Đi ải 2D. File xuất ra: records/status/slowed/slowed.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 200. [Trạng Thái & Bùa Chú] Stunned (`status/stunned`)

Tạo/Tích hợp hiệu ứng Pixel Art Stunned (`status/stunned`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 60x64px | Thời lượng: 2s
- **Mô tả chuyển động:** Seeing stars: three spinning stars and two little birds circle the head on a tilted ring, ducking behind it and sweeping round in front, trailing glitter.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs status/stunned --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/status/stunned'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Stunned trong game RPG / Đi ải 2D. File xuất ra: records/status/stunned/stunned.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 201. [Chuyển Cảnh Màn Hình] Blinds (`transitions/blinds`)

Tạo/Tích hợp hiệu ứng Pixel Art Blinds (`transitions/blinds`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2s
- **Mô tả chuyển động:** Slats catch the light edge-on, then tilt shut top to bottom, lit rims glinting as warm light squeezes through the closing gaps with dust in it; then they tilt open and fade.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/blinds --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/blinds'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blinds trong game RPG / Đi ải 2D. File xuất ra: records/transitions/blinds/blinds.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 202. [Chuyển Cảnh Màn Hình] Burn away (`transitions/burn-away`)

Tạo/Tích hợp hiệu ứng Pixel Art Burn away (`transitions/burn-away`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 3s
- **Mô tả chuyển động:** The screen burns in from its edges behind a ragged ember line of licking flames, embers and smoke; then the black smoulders and burns open from the middle.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/burn-away --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/burn-away'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Burn away trong game RPG / Đi ải 2D. File xuất ra: records/transitions/burn-away/burn-away.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 203. [Chuyển Cảnh Màn Hình] CRT off (`transitions/crt-off`)

Tạo/Tích hợp hiệu ứng Pixel Art CRT off (`transitions/crt-off`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2s
- **Mô tả chuyển động:** The picture squeezes into a white-hot glowing line, the line into a dot that lingers as a fading afterglow; then it switches back on, dot to line to picture, with a warm-up glow.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/crt-off --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/crt-off'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng CRT off trong game RPG / Đi ải 2D. File xuất ra: records/transitions/crt-off/crt-off.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 204. [Chuyển Cảnh Màn Hình] Diamond wipe (`transitions/diamond-wipe`)

Tạo/Tích hợp hiệu ứng Pixel Art Diamond wipe (`transitions/diamond-wipe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2s
- **Mô tả chuyển động:** A wave of faceted diamonds swells across the screen, rims bright and ridges lit, cooling to black as they lock; then they rise as gems again and shrink away with glints.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/diamond-wipe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/diamond-wipe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Diamond wipe trong game RPG / Đi ải 2D. File xuất ra: records/transitions/diamond-wipe/diamond-wipe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 205. [Chuyển Cảnh Màn Hình] Glitch wipe (`transitions/glitch-wipe`)

Tạo/Tích hợp hiệu ứng Pixel Art Glitch wipe (`transitions/glitch-wipe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 1.8s
- **Mô tả chuyển động:** Torn bands of black stutter across the screen, freezing and jerking back, their ragged edges split into magenta and cyan ghosts spitting data slivers; then they tear on through.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/glitch-wipe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/glitch-wipe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Glitch wipe trong game RPG / Đi ải 2D. File xuất ra: records/transitions/glitch-wipe/glitch-wipe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 206. [Chuyển Cảnh Màn Hình] Iris (`transitions/iris`)

Tạo/Tích hợp hiệu ứng Pixel Art Iris (`transitions/iris`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2.2s
- **Mô tả chuyển động:** A lit iris closes onto a warm spotlight where dust drifts, holds as its rim twinkles, snaps shut into a glint, then pops open from a flash with a white-hot rim throwing sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/iris --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/iris'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Iris trong game RPG / Đi ải 2D. File xuất ra: records/transitions/iris/iris.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 207. [Chuyển Cảnh Màn Hình] Pixel dissolve (`transitions/pixel-dissolve`)

Tạo/Tích hợp hiệu ứng Pixel Art Pixel dissolve (`transitions/pixel-dissolve`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2.2s
- **Mô tả chuyển động:** Clumps of blocks wink in, each drawn in a white outline that fills black and cools, with glints; then they wink out, outlines collapsing, the last small ones sparkling away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/pixel-dissolve --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/pixel-dissolve'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Pixel dissolve trong game RPG / Đi ải 2D. File xuất ra: records/transitions/pixel-dissolve/pixel-dissolve.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 208. [Chuyển Cảnh Màn Hình] Shatter wipe (`transitions/shatter-wipe`)

Tạo/Tích hợp hiệu ứng Pixel Art Shatter wipe (`transitions/shatter-wipe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2.8s
- **Mô tả chuyển động:** A dark glass pane drops over the screen and bounces; cracks race out from an impact with a flash, then it bursts into tumbling glass shards with lit edges that fall away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/shatter-wipe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/shatter-wipe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shatter wipe trong game RPG / Đi ải 2D. File xuất ra: records/transitions/shatter-wipe/shatter-wipe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 209. [Chuyển Cảnh Màn Hình] Slash wipe (`transitions/slash-wipe`)

Tạo/Tích hợp hiệu ứng Pixel Art Slash wipe (`transitions/slash-wipe`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 1.7s
- **Mô tả chuyển động:** A white-hot blade edge slices across the screen, light ahead of it and sparks spraying back over the cover; a second cut flashes through and the cover splits apart.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/slash-wipe --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/slash-wipe'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Slash wipe trong game RPG / Đi ải 2D. File xuất ra: records/transitions/slash-wipe/slash-wipe.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 210. [Chuyển Cảnh Màn Hình] Star iris (`transitions/star-iris`)

Tạo/Tích hợp hiệu ứng Pixel Art Star iris (`transitions/star-iris`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 320x180px | Thời lượng: 2.2s
- **Mô tả chuyển động:** A five-point star iris spins shut on the middle of the screen, its gold rim lit and its tips twinkling and shedding motes; it closes on a glint and spins open again from a flash.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs transitions/star-iris --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/transitions/star-iris'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Star iris trong game RPG / Đi ải 2D. File xuất ra: records/transitions/star-iris/star-iris.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 211. [Giao Diện UI Game] Achievement (`ui/achievement`)

Tạo/Tích hợp hiệu ứng Pixel Art Achievement (`ui/achievement`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 220x72px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A toast slides in on speed lines and settles; a gold medal pops onto it in a burst of sparkles, a shine sweeps the whole toast, then it slides away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/achievement --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/achievement'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Achievement trong game RPG / Đi ải 2D. File xuất ra: records/ui/achievement/achievement.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 212. [Giao Diện UI Game] Coin collect (`ui/coin-collect`)

Tạo/Tích hợp hiệu ứng Pixel Art Coin collect (`ui/coin-collect`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x116px | Thời lượng: 2.45s
- **Mô tả chuyển động:** A coin bursts into a fountain of spinning coins that hang, then zip one by one into a HUD counter that pops and ticks up, glints and folds away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/coin-collect --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/coin-collect'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Coin collect trong game RPG / Đi ải 2D. File xuất ra: records/ui/coin-collect/coin-collect.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 213. [Giao Diện UI Game] Combo counter (`ui/combo-counter`)

Tạo/Tích hợp hiệu ứng Pixel Art Combo counter (`ui/combo-counter`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 208x100px | Thời lượng: 1.45s
- **Mô tả chuyển động:** x5 COMBO rockets in on streaming speed lines, smearing, and slams to a stop: a white flash, a ring, sparks; it pulses while a timer bar drains, then whooshes out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/combo-counter --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/combo-counter'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Combo counter trong game RPG / Đi ải 2D. File xuất ra: records/ui/combo-counter/combo-counter.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 214. [Giao Diện UI Game] Confetti (`ui/confetti`)

Tạo/Tích hợp hiệu ứng Pixel Art Confetti (`ui/confetti`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 200x140px | Thời lượng: 3.4s
- **Mô tả chuyển động:** Two party poppers bang one after the other: paper bits and curly streamers burst out, stall, then tumble and flutter down, flipping, and settle on the floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/confetti --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/confetti'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Confetti trong game RPG / Đi ải 2D. File xuất ra: records/ui/confetti/confetti.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 215. [Giao Diện UI Game] Countdown (`ui/countdown`)

Tạo/Tích hợp hiệu ứng Pixel Art Countdown (`ui/countdown`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x136px | Thời lượng: 3.1s
- **Mô tả chuyển động:** 3, 2, 1 slam into a timer ring that drains like a burning fuse, throwing sparks; then GO! bursts out as the ring blows into a shockwave with rays.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/countdown --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/countdown'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Countdown trong game RPG / Đi ải 2D. File xuất ra: records/ui/countdown/countdown.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 216. [Giao Diện UI Game] Crit number (`ui/crit-number`)

Tạo/Tích hợp hiệu ứng Pixel Art Crit number (`ui/crit-number`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 152x120px | Thời lượng: 1.5s
- **Mô tả chuyển động:** CRIT 128! slams in huge and white over a jagged starburst with a hard shake and speed lines, cools to fire, holds with a shine, then pops into sparks.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/crit-number --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/crit-number'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Crit number trong game RPG / Đi ải 2D. File xuất ra: records/ui/crit-number/crit-number.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 217. [Giao Diện UI Game] Damage number (`ui/damage-number`)

Tạo/Tích hợp hiệu ứng Pixel Art Damage number (`ui/damage-number`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 76x68px | Thời lượng: 1.05s
- **Mô tả chuyển động:** A red -27 punches out of a hit spark, white for a frame, arcs up, lands with a squash and a little hop, then fades as it lifts away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/damage-number --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/damage-number'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Damage number trong game RPG / Đi ải 2D. File xuất ra: records/ui/damage-number/damage-number.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 218. [Giao Diện UI Game] Exclamation (`ui/exclamation`)

Tạo/Tích hợp hiệu ứng Pixel Art Exclamation (`ui/exclamation`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 84x104px | Thời lượng: 1.4s
- **Mô tả chuyển động:** A bold ! springs up off the hero's head, stretching as it shoots up and squashing as it lands; surprise ticks flick out, it wobbles, then pops away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/exclamation --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/exclamation'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Exclamation trong game RPG / Đi ải 2D. File xuất ra: records/ui/exclamation/exclamation.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 219. [Giao Diện UI Game] Health bar hit (`ui/health-bar-hit`)

Tạo/Tích hợp hiệu ứng Pixel Art Health bar hit (`ui/health-bar-hit`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 160x64px | Thời lượng: 2s
- **Mô tả chuyển động:** A segmented health bar takes a hit: it jolts and dips, the lost chunk flashes white and sheds chips, holds, then drains away behind a sparking edge.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/health-bar-hit --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/health-bar-hit'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Health bar hit trong game RPG / Đi ải 2D. File xuất ra: records/ui/health-bar-hit/health-bar-hit.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 220. [Giao Diện UI Game] Heart lost (`ui/heart-lost`)

Tạo/Tích hợp hiệu ứng Pixel Art Heart lost (`ui/heart-lost`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 96x88px | Thời lượng: 1.5s
- **Mô tả chuyển động:** A HUD heart is hit: it flashes white and jolts, a crack runs down it, it splits into two halves that tumble away, leaving an empty socket that fades.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/heart-lost --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/heart-lost'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Heart lost trong game RPG / Đi ải 2D. File xuất ra: records/ui/heart-lost/heart-lost.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 221. [Giao Diện UI Game] Level up (`ui/level-up`)

Tạo/Tích hợp hiệu ứng Pixel Art Level up (`ui/level-up`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x138px | Thời lượng: 3.2s
- **Mô tả chuyển động:** Gold gathers at the feet and bursts up as a pillar of light round the hero; rings climb it, LEVEL UP! drops in letter by letter, a shine sweeps it, sparkles twinkle.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/level-up --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/level-up'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Level up trong game RPG / Đi ải 2D. File xuất ra: records/ui/level-up/level-up.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 222. [Giao Diện UI Game] Quest complete (`ui/quest-complete`)

Tạo/Tích hợp hiệu ứng Pixel Art Quest complete (`ui/quest-complete`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 204x92px | Thời lượng: 2.6s
- **Mô tả chuyển động:** A stitched ribbon unrolls from the middle, QUEST COMPLETE types on letter by letter, a gold seal stamps down and ticks, stars pop; then it all rolls away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs ui/quest-complete --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/ui/quest-complete'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Quest complete trong game RPG / Đi ải 2D. File xuất ra: records/ui/quest-complete/quest-complete.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 223. [Hệ Nước & Thủy Triều] Bubbles (`water/bubbles`)

Tạo/Tích hợp hiệu ứng Pixel Art Bubbles (`water/bubbles`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 104x112px | Thời lượng: 4s
- **Mô tả chuyển động:** Bubbles stream up from a vent of pebbles, wobbling and swelling as they rise, flare as they cross shafts of light from the surface, then dome up and pop there.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/bubbles --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/bubbles'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Bubbles trong game RPG / Đi ải 2D. File xuất ra: records/water/bubbles/bubbles.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 224. [Hệ Nước & Thủy Triều] Drip (`water/drip`)

Tạo/Tích hợp hiệu ứng Pixel Art Drip (`water/drip`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 72x88px | Thời lượng: 1.6s
- **Mô tả chuyển động:** A bead swells under a wet stone tip and catches the light, pinches off, falls stretched by its speed and plinks into a puddle with a crown, a ring and a tiny rebound.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/drip --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/drip'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Drip trong game RPG / Đi ải 2D. File xuất ra: records/water/drip/drip.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 225. [Hệ Nước & Thủy Triều] Fountain (`water/fountain`)

Tạo/Tích hợp hiệu ứng Pixel Art Fountain (`water/fountain`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 120x104px | Thời lượng: 2s
- **Mô tả chuyển động:** A stone basin; a jet rises from its spout and blooms into glassy arcs that break into beads, fall back and plink into the water with rings.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/fountain --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/fountain'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fountain trong game RPG / Đi ải 2D. File xuất ra: records/water/fountain/fountain.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 226. [Hệ Nước & Thủy Triều] Geyser (`water/geyser`)

Tạo/Tích hợp hiệu ứng Pixel Art Geyser (`water/geyser`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 184x168px | Thời lượng: 5s
- **Mô tả chuyển động:** A pool heaves and burbles faster and faster, then blasts a white column of water skyward with a churning foam head; it rains back down in drops and steam, slumps and sputters out.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/geyser --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/geyser'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Geyser trong game RPG / Đi ải 2D. File xuất ra: records/water/geyser/geyser.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 227. [Hệ Nước & Thủy Triều] Rain splash (`water/rain-splash`)

Tạo/Tích hợp hiệu ứng Pixel Art Rain splash (`water/rain-splash`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 176x80px | Thời lượng: 2.4s
- **Mô tả chuyển động:** A low close-up on one puddle in the rain: big drops land in crowns that throw beads and a rebound jet, rings spread and interfere, a lamp's reflection wobbles on the water.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/rain-splash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/rain-splash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rain splash trong game RPG / Đi ải 2D. File xuất ra: records/water/rain-splash/rain-splash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 228. [Hệ Nước & Thủy Triều] Ripples (`water/ripples`)

Tạo/Tích hợp hiệu ứng Pixel Art Ripples (`water/ripples`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 136x52px | Thời lượng: 2s
- **Mô tả chuyển động:** A drop plinks on still dark water and rings spread out across it at a low angle: the swell of each ring catches the light, crests glint, and they fade into the calm.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/ripples --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/ripples'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Ripples trong game RPG / Đi ải 2D. File xuất ra: records/water/ripples/ripples.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 229. [Hệ Nước & Thủy Triều] Splash (`water/splash`)

Tạo/Tích hợp hiệu ứng Pixel Art Splash (`water/splash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 176x100px | Thời lượng: 2.5s
- **Mô tả chuyển động:** A stone drops into still water: a white hit, a crown that tears into droplets arcing out to plink down with rings, a jet that bounces back, foam and drifting mist.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/splash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/splash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Splash trong game RPG / Đi ải 2D. File xuất ra: records/water/splash/splash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 230. [Hệ Nước & Thủy Triều] Water jet (`water/water-jet`)

Tạo/Tích hợp hiệu ứng Pixel Art Water jet (`water/water-jet`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 188x80px | Thời lượng: 1s
- **Mô tả chuyển động:** A pressurised stream blasts right: a tight glassy rod with surges running down it that swells, roughens, bends under its weight and breaks into chunks, spray and mist.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/water-jet --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/water-jet'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Water jet trong game RPG / Đi ải 2D. File xuất ra: records/water/water-jet/water-jet.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 231. [Hệ Nước & Thủy Triều] Water orb (`water/water-orb`)

Tạo/Tích hợp hiệu ứng Pixel Art Water orb (`water/water-orb`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 100x108px | Thời lượng: 3s
- **Mô tả chuyển động:** A sphere of water floats and wobbles: a current circles inside it, the floor shows upside down through it, it shines, light gathers on the floor under it, and drips fall and plink.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/water-orb --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/water-orb'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Water orb trong game RPG / Đi ải 2D. File xuất ra: records/water/water-orb/water-orb.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 232. [Hệ Nước & Thủy Triều] Waterfall (`water/waterfall`)

Tạo/Tích hợp hiệu ứng Pixel Art Waterfall (`water/waterfall`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 144x136px | Thời lượng: 2s
- **Mô tả chuyển động:** A river pours from a notch in a rock outcrop: a white curl, a deep sheet that splits into strands, churning foam, spray, drifting mist and rings on a dark pool.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/waterfall --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/waterfall'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Waterfall trong game RPG / Đi ải 2D. File xuất ra: records/water/waterfall/waterfall.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 233. [Hệ Nước & Thủy Triều] Wave crash (`water/wave-crash`)

Tạo/Tích hợp hiệu ứng Pixel Art Wave crash (`water/wave-crash`):
- **Quy cách:** Đòn đánh một lần (One-shot) | Khung hình: 224x104px | Thời lượng: 3.2s
- **Mô tả chuyển động:** A swell rolls in and steepens, its lip throws forward and curls over a dark barrel, then crashes into a burst of white foam and spray that surges on and fades to lace.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/wave-crash --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/wave-crash'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Wave crash trong game RPG / Đi ải 2D. File xuất ra: records/water/wave-crash/wave-crash.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 234. [Hệ Nước & Thủy Triều] Whirlpool (`water/whirlpool`)

Tạo/Tích hợp hiệu ứng Pixel Art Whirlpool (`water/whirlpool`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 128x84px | Thời lượng: 3s
- **Mô tả chuyển động:** Seen from above, dark water winds into a vortex: foam arms spiral in, darkening as they're drawn down into a deep eye with a lit far rim, flecks of foam circling in after them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs water/whirlpool --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/water/whirlpool'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Whirlpool trong game RPG / Đi ải 2D. File xuất ra: records/water/whirlpool/whirlpool.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 235. [Thời Tiết & Môi Trường] Aurora (`weather/aurora`)

Tạo/Tích hợp hiệu ứng Pixel Art Aurora (`weather/aurora`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 12s
- **Mô tả chuyển động:** Rippling curtains of green-to-violet light over a starfield: folding hems burn bright, rays shimmer up into violet, and the whole sky slowly breathes.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/aurora --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/aurora'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Aurora trong game RPG / Đi ải 2D. File xuất ra: records/weather/aurora/aurora.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 236. [Thời Tiết & Môi Trường] Blizzard (`weather/blizzard`)

Tạo/Tích hợp hiệu ứng Pixel Art Blizzard (`weather/blizzard`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 8s
- **Mô tả chuyển động:** Snow driven almost flat by a gale: streaks at three depths race past, gusts throw translucent sheets of snow across the sky and spindrift streams off the drifts.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/blizzard --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/blizzard'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Blizzard trong game RPG / Đi ải 2D. File xuất ra: records/weather/blizzard/blizzard.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 237. [Thời Tiết & Môi Trường] Cherry blossoms (`weather/cherry-blossoms`)

Tạo/Tích hợp hiệu ứng Pixel Art Cherry blossoms (`weather/cherry-blossoms`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 10s
- **Mô tả chuyển động:** Pink petals flutter down on a spring breeze, tumbling in little spirals and flashing as they catch the light, with a few whole blossoms spinning among them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/cherry-blossoms --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/cherry-blossoms'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Cherry blossoms trong game RPG / Đi ải 2D. File xuất ra: records/weather/cherry-blossoms/cherry-blossoms.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 238. [Thời Tiết & Môi Trường] Clouds (`weather/clouds`)

Tạo/Tích hợp hiệu ứng Pixel Art Clouds (`weather/clouds`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 12s
- **Mô tả chuyển động:** Layers of clouds drift past a bright moon at night: silver-lit tops, dark bellies, edges that flare where they cross the moon, forming and thinning as they go.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/clouds --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/clouds'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Clouds trong game RPG / Đi ải 2D. File xuất ra: records/weather/clouds/clouds.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 239. [Thời Tiết & Môi Trường] Falling leaves (`weather/falling-leaves`)

Tạo/Tích hợp hiệu ứng Pixel Art Falling leaves (`weather/falling-leaves`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 10s
- **Mô tả chuyển động:** Autumn leaves swing down through the air, tilting and flipping to show their pale backs, ride a gust, land flat in the litter and fade.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/falling-leaves --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/falling-leaves'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Falling leaves trong game RPG / Đi ải 2D. File xuất ra: records/weather/falling-leaves/falling-leaves.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 240. [Thời Tiết & Môi Trường] Fireflies (`weather/fireflies`)

Tạo/Tích hợp hiệu ứng Pixel Art Fireflies (`weather/fireflies`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 12s
- **Mô tả chuyển động:** Fireflies wander over a meadow at night, each glowing up and fading on its own rhythm, trailing light and lighting the grass tips beneath them.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/fireflies --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/fireflies'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fireflies trong game RPG / Đi ải 2D. File xuất ra: records/weather/fireflies/fireflies.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 241. [Thời Tiết & Môi Trường] Fog (`weather/fog`)

Tạo/Tích hợp hiệu ứng Pixel Art Fog (`weather/fog`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 12s
- **Mô tả chuyển động:** Slow banks of moonlit fog at three depths drift past each other, crests catching the light, while thin streaks of mist slide by in front.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/fog --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/fog'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Fog trong game RPG / Đi ải 2D. File xuất ra: records/weather/fog/fog.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 242. [Thời Tiết & Môi Trường] God rays (`weather/god-rays`)

Tạo/Tích hợp hiệu ứng Pixel Art God rays (`weather/god-rays`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 10s
- **Mô tả chuyển động:** Shafts of light slant down from high on the left, breathing and swaying, pooling on the floor, as drifting dust motes light up whenever they cross a beam.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/god-rays --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/god-rays'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng God rays trong game RPG / Đi ải 2D. File xuất ra: records/weather/god-rays/god-rays.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 243. [Thời Tiết & Môi Trường] Rain (`weather/rain`)

Tạo/Tích hợp hiệu ứng Pixel Art Rain (`weather/rain`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 8s
- **Mô tả chuyển động:** Slanted rain at four depths: far drops fade into the dark, near ones glint and splash, drops ring the puddles and a low mist drifts over the wet floor.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/rain --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/rain'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Rain trong game RPG / Đi ải 2D. File xuất ra: records/weather/rain/rain.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 244. [Thời Tiết & Môi Trường] Shooting stars (`weather/shooting-stars`)

Tạo/Tích hợp hiệu ứng Pixel Art Shooting stars (`weather/shooting-stars`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 10s
- **Mô tả chuyển động:** Meteors burn across a starry sky, white heads trailing gold and rose; the big ones flare and break up, and each leaves a glowing train that twists and fades.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/shooting-stars --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/shooting-stars'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Shooting stars trong game RPG / Đi ải 2D. File xuất ra: records/weather/shooting-stars/shooting-stars.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 245. [Thời Tiết & Môi Trường] Snow (`weather/snow`)

Tạo/Tích hợp hiệu ứng Pixel Art Snow (`weather/snow`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 12s
- **Mô tả chuyển động:** Snow at three depths in a gusty breeze: far specks, drifting flakes, big near crystals that spin and glow; they settle on a sparkling drift and melt away.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/snow --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/snow'; const fxInstance = createFx(fx, { x: 160, y: 120 });

*💡 Ví dụ mẫu: Dùng cho: Kỹ năng Snow trong game RPG / Đi ải 2D. File xuất ra: records/weather/snow/snow.png kèm file metadata .json nạp thẳng vào Game Engine.*

## 246. [Thời Tiết & Môi Trường] Storm (`weather/storm`)

Tạo/Tích hợp hiệu ứng Pixel Art Storm (`weather/storm`):
- **Quy cách:** Vòng lặp vô tận (Loop 60fps) | Khung hình: 320x180px | Thời lượng: 10s
- **Mô tả chuyển động:** Driving rain at two depths under a churning cloud deck; a forked bolt strikes in a double flash that lights the sky and the rain, then sheet lightning glows in the clouds.
- **Lệnh xuất Sprite Sheet (PNG trong suốt + JSON Aseprite cho Unity/Godot):** node tools/render.mjs weather/storm --sheet
- **Lệnh chạy trực tiếp trên Web Canvas:** import * as fx from 'pixelfx/fx/weather/storm'; const fxInstance = createFx(fx, { x: 160, y: 120 });
