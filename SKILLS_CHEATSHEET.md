# Cheat sheet chiêu thức — Kael, Aeris, Frost Guardian

Tạo từ thông tin gốc của từng hiệu ứng trong bộ pixelfx trên máy. Danh sách đầy đủ 246 mục của gói promptmmo:
`PIXELFX_CHEATSHEET.md`. Ghép với kế hoạch trong `UPGRADE_PLAN.md`.

Trạng thái: ✅ đang chạy trong game · 📦 đã xuất sprite, chờ gắn · ➕ chưa xuất (gợi ý thêm)

## Kael — kiếm sĩ ánh sáng

| | Chiêu trong game | Hiệu ứng | Kiểu | Khung | Thời lượng | Ghi chú |
|---|---|---|---|---|---|---|
| 📦 | Combo 3: Chém xoáy | Spin slash (`melee/spin-slash`) | Một lần | 208×104 | 0.8s |  |
| 📦 | Combo 4: Nhát chém kết liễu | Heavy cleave (`melee/heavy-cleave`) | Một lần | 208×116 | 1.9s |  |
| ✅ | Combo 4: tia chí mạng khi trúng | Critical hit (`impacts/crit-hit`) | Một lần | 216×136 | 0.9s | dùng chung mọi đòn kết |
| 📦 | Skill thường: Thánh địa | Healing ring (`holy/heal-aoe`) | Một lần | 256×136 | 2.9s | thay vòng elip cũ |
| 📦 | Skill tiến: Xung kích | Dash strike (`moves/dash-strike`) | Một lần | 372×156 | 2.3s |  |
| 📦 | Skill lùi: Lùi chém sóng | Energy disc (`projectiles/energy-disc`) | Lặp | 120×52 | 0.5s | tô lại màu vàng |
| 📦 | Ultimate thường: lúc gồng | Sunburst (`holy/sunburst`) | Lặp | 128×128 | 4s |  |
| 📦 | Ultimate thường: Phán quyết (cột sáng) | Holy pillar (`holy/holy-pillar`) | Một lần | 192×232 | 3.5s |  |
| 📦 | Ultimate tiến: Thiên kiếm | Smite (`holy/smite`) | Một lần | 224×176 | 2.8s |  |
| 📦 | Ultimate lùi: Khiên thánh | Divine shield (`holy/divine-shield`) | Lặp | 88×84 | 2.4s |  |
| 📦 | Ultimate lùi: chặn đòn thành công | Parry (`impacts/parry`) | Một lần | 200×112 | 1s |  |
| 📦 | Nhặt Tốc chém | Haste (`status/haste`) | Lặp | 100×56 | 1.2s | hiện chưa có hiệu ứng |
| ➕ | Phương án khác cho combo 1–2 | Double slash (`melee/double-slash`) | Một lần | 164×108 | 0.8s | gợi ý |
| ➕ | Phương án khác cho đòn hất | Uppercut (`melee/uppercut`) | Một lần | 132×128 | 0.85s | gợi ý |
| ➕ | Phương án khác: vầng sáng khi đầy Nộ | Halo (`holy/halo`) | Lặp | 56×80 | 2s | gợi ý |
| ➕ | Phương án khác: kết thúc Ultimate | Feather burst (`holy/feather-burst`) | Một lần | 160×160 | 3s | gợi ý |

<details><summary>Mô tả chuyển động (bản gốc tiếng Anh)</summary>

- **`melee/spin-slash`**: The blade whirls once round the waist on a tilted plane, behind the body and back in front; the closed ring flares white, dissolves into a dotted trace and throws sparks.
- **`melee/heavy-cleave`**: A glint over the head, then a thick ember arc accelerates over the top into the floor: a white slam, glowing cracks, dust rolling both ways, grit and rising embers.
- **`impacts/crit-hit`**: A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.
- **`holy/heal-aoe`**: A seed of green light sinks into the floor and a soft ring rolls out from it; the floor glows where it passes and plus signs sprout and float up.
- **`moves/dash-strike`**: A crouch, then he's across the floor in a blur of after-images and already cutting: a critical hit, a beat, and he hops back to where he started.
- **`projectiles/energy-disc`**: A sawblade of crackling energy spinning flat out as it flies: hooked teeth bright on their leading edges, a white hub, spiral arms churning, sparks flung off the teeth.
- **`holy/sunburst`**: A white-hot core in a gold corona; long and short rays turn slowly round it, breathing, with glints running out along them that wink at the tips.
- **`holy/holy-pillar`**: Light breaks through from above: a sun opens at the top and a fan of shafts converges on the mark, pulsing, while a sigil burns on the floor; then the fan folds shut.
- **`holy/smite`**: A glint marks the spot, then a bolt of light drops like a hammer: a white flash, a shockwave over the floor, stone chips flying and cracks that glow and cool.
- **`holy/divine-shield`**: A bubble of gold light round the character: a bright rim and a thin gold film, meridians turning like a slow globe, a sheen sweeping across and sparkles winking on it.
- **`impacts/parry`**: Two blades clash: their edges flash in an X, a white four-point star rings out, a ring breaks into arcs and a fan of gold sparks sprays up and rains down.
- **`status/haste`**: Sped up: striped after-images stream out behind, speed lines whip past, dust kicks off the heels and the leading edge catches the wind. Faces right.
- **`melee/double-slash`**: A down cut, then an up cut that crosses it: the moment the X closes both strokes flash white, the crossing bursts with light and sparks, and a dotted X lingers.
- **`melee/uppercut`**: A crescent rises from the floor past the face, and at the top a comic impact star bursts: bold outline, hot core, burst lines, twinkles and sparks.
- **`holy/halo`**: A ring of gold light floats over the head with a glint running round it; fine dust sifts down from it and the head catches its light.
- **`holy/feather-burst`**: A white puff pops and throws feathers that brake hard, then rock from side to side as they sink and fade, with down drifting after them.

</details>

## Aeris — pháp sư bí thuật / băng

| | Chiêu trong game | Hiệu ứng | Kiểu | Khung | Thời lượng | Ghi chú |
|---|---|---|---|---|---|---|
| ✅ | Combo 1–3: đạn bí thuật | Arcane orb (`arcane/arcane-orb`) | Lặp | 136×112 | 2.4s |  |
| ✅ | Combo 4 / Tia bí thuật: gồng | Spell charge (`arcane/spell-charge`) | Lặp | 120×86 | 1.6s |  |
| 📦 | Combo 4: Tân tinh (nổ) | Mana burst (`arcane/mana-burst`) | Một lần | 208×150 | 1.8s |  |
| 📦 | Skill thường: Băng chú | Frost nova (`ice/frost-nova`) | Một lần | 288×192 | 3.4s | thay sprite cũ của boss |
| 📦 | Skill tiến: Thuấn di (biến mất) | Blink out (`arcane/blink-out`) | Một lần | 136×96 | 1.6s |  |
| 📦 | Skill tiến: Thuấn di (hiện ra) | Blink in (`arcane/blink-in`) | Một lần | 136×96 | 1.4s |  |
| 📦 | Skill lùi: Giáo băng | Ice lance (`ice/ice-lance`) | Lặp | 176×64 | 0.8s | dùng chung với đạn boss |
| ✅ | Ultimate thường: Mưa băng | Icicle fall (`ice/icicle-fall`) | Một lần | 152×120 | 2.6s |  |
| ✅ | Ultimate tiến: Tia bí thuật | Arcane beam (`arcane/arcane-beam`) | Lặp | 264×100 | 1.2s |  |
| ✅ | Ultimate lùi: Ngưng đọng thời gian | Time stop (`arcane/time-stop`) | Một lần | 196×136 | 3.6s |  |
| 📦 | Kẻ địch bị làm chậm / đóng băng | Frozen (`status/frozen`) | Lặp | 72×64 | 2s |  |
| ➕ | Phương án khác cho combo 2 (nhiều đạn) | Arcane missiles (`arcane/arcane-missiles`) | Một lần | 240×116 | 1.75s | gợi ý |
| ➕ | Phương án khác: vòng phép khi gồng Ultimate | Magic circle cast (`arcane/magic-circle-cast`) | Một lần | 200×220 | 3.9s | gợi ý |
| ➕ | Phương án khác cho Mưa băng (bản bí thuật) | Star fall (`arcane/star-fall`) | Một lần | 232×172 | 2.5s | gợi ý |
| ➕ | Phương án khác: trúng đòn băng | Snowflake burst (`ice/snowflake-burst`) | Một lần | 140×120 | 3.2s | gợi ý |
| ➕ | Phương án khác: Giáo băng kèm động tác ném | Ice lance throw (`moves/ice-lance-throw`) | Một lần | 310×136 | — | gợi ý |

<details><summary>Mô tả chuyển động (bản gốc tiếng Anh)</summary>

- **`arcane/arcane-orb`**: A floating orb of smoky violet glass with a swirl turning round a white-hot heart, two tilted rings of light orbiting behind and in front.
- **`arcane/spell-charge`**: Energy gathers in the caster's hand: streaks and motes spiral in, rings collapse into a swelling orb that crackles with arcs, ready to fire.
- **`arcane/mana-burst`**: Energy rushes into a point and blows out in a white flash and rings, flinging glowing runes that flare and pop into sparks one after another.
- **`ice/frost-nova`**: Frost spirals into a spinning snowflake, then a wave blooms three rings of ice crystals round the caster; snow drifts, frost creeps, and the ice melts back into the floor.
- **`arcane/blink-out`**: The caster crackles with gathering light, flashes white, squeezes into a line of light that collapses and pops away in sparks.
- **`arcane/blink-in`**: Glittering bits spiral in to a point of light that opens into a line, then into a white silhouette that cools into the caster.
- **`ice/ice-lance`**: A faceted ice spear flying right: a light pulse runs through its core, rings of cold air shear off the tip, frost peels off into a wake and crystals shed behind it.
- **`ice/icicle-fall`**: An icicle drips and trembles, snaps off its frosted root, drops, stabs the floor and bursts into skidding shards, splinters and rolling frost.
- **`arcane/arcane-beam`**: A beam fires right from the hand: a white core, strands twisting round it, pulses running down it, a flaring source and an end that sprays sparks.
- **`arcane/time-stop`**: A clock face springs open, ticks slower and slower, freezes drained of colour, cracks, then shatters into falling shards.
- **`status/frozen`**: Chilled to the bone: frost ferns creep over the body, icicles hang from chin and hands and drip, breath steams, snow settles, a shiver every second, frost spreads underfoot.
- **`arcane/arcane-missiles`**: A volley of violet bolts fans out of the hand, curls round on twisting ribbons and pops on the target one after another.
- **`arcane/magic-circle-cast`**: A circle draws itself on the floor, runes ignite one by one, it flashes, and a column of light fires up and breaks apart into glints.
- **`arcane/star-fall`**: Stars streak down on long trails across an area, each landing with a white flash, a ring across the floor and a kick of sparks.
- **`ice/snowflake-burst`**: A cold pop: frost gathers and flashes white in a ring, then crisp six-armed snowflakes spin out, slow, twinkle and drift down to settle and melt.
- **`moves/ice-lance-throw`**: Frost gathers into a spear in his hand, he throws it like a javelin, and the target ices over in a burst of snowflakes and shivers.

</details>

## Frost Guardian — boss

| | Chiêu trong game | Hiệu ứng | Kiểu | Khung | Thời lượng | Ghi chú |
|---|---|---|---|---|---|---|
| ✅ | Ba tia băng | Ice spikes (`ice/ice-spikes`) | Một lần | 264×112 | 3s |  |
| 📦 | Loạt đạn băng | Ice lance (`ice/ice-lance`) | Lặp | 176×64 | 0.8s | thay đa giác vẽ tay |
| 📦 | Đấm cận chiến: nện đất | Ground slam (`impacts/ground-slam`) | Một lần | 288×208 | 3.2s |  |
| 📦 | Vỡ lá chắn băng | Ice shatter (`ice/ice-shatter`) | Một lần | 224×112 | 2.8s |  |
| 📦 | Trạng thái tức giận | Rage (`status/rage`) | Lặp | 80×80 | 1.2s |  |
| 📦 | Chiêu mới: Bão tuyết (từ 50% máu) | Blizzard vortex (`ice/blizzard-vortex`) | Lặp | 128×116 | 2s |  |
| ✅ | Chiêu mới: Mưa nhũ băng (từ 25% máu) | Icicle fall (`ice/icicle-fall`) | Một lần | 152×120 | 2.6s | dùng chung với Aeris |
| ✅ | Đánh vào boss khi còn khiên | Shield block (`impacts/shield-block`) | Một lần | 148×104 | 1.1s |  |
| ➕ | Phương án khác: chiêu hơi thở băng | Frost breath (`ice/frost-breath`) | Lặp | 184×104 | 1.2s | gợi ý |
| ➕ | Phương án khác: đóng băng người chơi | Freeze (`ice/freeze`) | Một lần | 176×128 | 4s | gợi ý |
| ➕ | Phương án khác: trụ băng | Ice crystal (`ice/ice-crystal`) | Lặp | 96×100 | 3s | gợi ý |
| ➕ | Phương án khác: boss nhảy đập | Heavy landing (`impacts/heavy-landing`) | Một lần | 176×80 | 1.6s | gợi ý |
| ➕ | Phương án khác: dậm đất | Earth stomp (`moves/earth-stomp`) | Một lần | 290×142 | — | gợi ý |

<details><summary>Mô tả chuyển động (bản gốc tiếng Anh)</summary>

- **`ice/ice-spikes`**: A frost line races along the floor and clusters of jagged ice blades burst up behind it in a rising wave, glint, flash white together and shatter into toppling shards.
- **`ice/ice-lance`**: A faceted ice spear flying right: a light pulse runs through its core, rings of cold air shear off the tip, frost peels off into a wake and crystals shed behind it.
- **`impacts/ground-slam`**: Something lands hard: the floor flashes and cracks, two crescent shock waves race out along it, a dust wave and a tall dust cloud rise, rocks erupt, bounce and settle.
- **`ice/ice-shatter`**: A block of ice takes a hit from the left: it jolts, cracks race over its faces, it flashes white and bursts into chunks that tumble, bounce and skid off in a roll of ice dust.
- **`status/rage`**: Seething: the body judders on every heartbeat, an anger mark throbs at the temple, eyes burn, steam jets off the head, stress lines flash out and the floor cracks hot underfoot.
- **`ice/blizzard-vortex`**: A swirling snow tornado: wind bands spin up a leaning funnel, flakes and ice crystals orbit in front and behind, snow boils at its foot and cold light fills its throat.
- **`ice/icicle-fall`**: An icicle drips and trembles, snaps off its frosted root, drops, stabs the floor and bursts into skidding shards, splinters and rolling frost.
- **`impacts/shield-block`**: A blow is caught on a half-dome of energy in front of the character: its diamond lattice flashes, a ripple runs over it, sparks glance off, then it blinks out cell by cell.
- **`ice/frost-breath`**: A cone of icy wind blowing right: frost puffs billow out, swell and sink, wind streaks race through, ice crystals tumble and glint off a white-hot mouth.
- **`ice/freeze`**: Frost races in and climbs the character, turning it to ice; a faceted block crystallizes round it pane by pane, glints, cracks and bursts, and the character thaws free.
- **`ice/ice-crystal`**: A floating ice crystal turning slowly in its own cold light: its facets brighten and darken as they turn, glints flash on them, frost motes circle it.
- **`impacts/heavy-landing`**: A character lands hard: the floor dents and cracks under their feet, two rings of dust roll out along the floor one after the other, and pebbles hop away.
- **`moves/earth-stomp`**: A knee comes up, the boot slams down, the floor heaves under the target and a stone spike rams up through it.

</details>

## Dùng chung

| | Chiêu trong game | Hiệu ứng | Kiểu | Khung | Thời lượng | Ghi chú |
|---|---|---|---|---|---|---|
| ✅ | Mọi đòn thường trúng | Hit spark (`impacts/hit-spark`) | Một lần | 136×80 | 0.5s |  |
| 📦 | Đạn lửa đốt boss | Burning (`status/burning`) | Lặp | 72×80 | 1.2s |  |
| 📦 | Nhặt Đạn lửa | Fireball (`fire/fireball`) | Lặp | 136×56 | 1.2s |  |
| 📦 | Nhặt Tia sét | Lightning strike (`lightning/lightning-strike`) | Một lần | 240×264 | 3s |  |

<details><summary>Mô tả chuyển động (bản gốc tiếng Anh)</summary>

- **`impacts/hit-spark`**: The everyday hit: a sharp, lopsided cross flare with one long ray along the blow round a white diamond core, then a cone of sparks and hot chips that fall and bounce.
- **`status/burning`**: Burning over time: small flames lick from four hot spots, trailing sparks and thin smoke; every 0.6 s they flare, the body flashes white then orange, scorch marks spread.
- **`fire/fireball`**: A fireball flying right: a churning white-hot head with a corona of flame, a long torn tail of flame puffs cooling into smoke, embers shed behind.
- **`lightning/lightning-strike`**: A targeted strike: a sigil charges on the floor, the scene darkens, a thick bolt slams into it, arcs race out along the cracks it splits, the channel crumbles to a scorch.

</details>

## Xuất thêm các hiệu ứng ➕

Chỉ cần nếu muốn dùng các phương án gợi ý:

```powershell
cd C:\Users\Lenovo\Downloads\pixelfx
node tools/render.mjs arcane/arcane-missiles arcane/magic-circle-cast arcane/star-fall holy/feather-burst holy/halo ice/freeze ice/frost-breath ice/ice-crystal ice/snowflake-burst impacts/heavy-landing melee/double-slash melee/uppercut moves/earth-stomp moves/ice-lance-throw --sheet
```

Cú pháp một hiệu ứng: `node tools/render.mjs <nhóm>/<tên> --sheet` (PNG + JSON Aseprite trong `records/<nhóm>/<tên>/`).
