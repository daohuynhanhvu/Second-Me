# SECOND ME - The Emberforge

Game giải đố hành động góc nhìn từ trên xuống, dùng Echo ghi và phát lại đường đi, giữ công tắc và chiến đấu. Dự án dùng React, TypeScript, Vite và Canvas 2D.

## Nội dung hiện có

- 6 màn: 1 màn hướng dẫn, 4 màn kết hợp giải đố và đánh quái, 1 trận boss băng.
- Tối đa 4 Echo độc lập, bản ghi tối đa 8 giây; ghi cả di chuyển và sự kiện tấn công/kỹ năng.
- Màn 2-5 lần lượt có 2, 3, 4, 5 quái. Quái báo trước vị trí đánh, bị tường/cổng chặn và có thể bị Echo dụ.
- Goblin, Bear, Skull, Shaman và Minotaur dùng sprite từ bộ asset do người dùng cung cấp; xem `public/assets/enemies/SOURCE.md`.
- Sau mỗi lần thắng màn 1-5, chọn 1 trong 3 ấn nâng Echo khác nhau, rút ngẫu nhiên từ bộ 5. Mỗi loại có xác suất 60% xuất hiện trong một bộ ba; mỗi màn có thể gặp lại các loại đã thấy.
- 5 ấn: Triệu hồi, Bền bỉ, Khuếch đại, Dẫn dụ, Hồi phục. Dùng được ở màn 2-6; kích hoạt tốn 1 ấn. Hiệu ứng hết khi rời/chơi lại màn; ấn chưa dùng được giữ trong túi.
- Lựa chọn thưởng và số lượng ấn được lưu; tải lại không tạo lại bộ ba. Cần chọn thưởng trước khi vào màn tiếp theo.
- Đồng hồ tính theo từng chặng, không tính cho trận boss. Ngân sách màn 1-5: 16 / 24 / 30 / 32 / 30 giây mỗi chặng.
- Hạ quái hồi tối đa 3 giây (không vượt ngân sách chặng) và 1 lượt Echo (giới hạn 4). Không bắt buộc giết hết quái để mở cổng.
- Mảnh thời gian +3 giây: tối đa 1 mỗi chặng. Bình thời gian +2 giây giá 5 xu: dùng tối đa 1 mỗi chặng.
- Boss có 240 HP, 4 trụ 60 HP và 3 pha. Phải phá trụ để gây sát thương lên boss.
- Boss mở khi hoàn thành 5 màn và thức tỉnh vũ khí ở trạm chuẩn bị; không cần đủ cả 5 loại ấn và không tiêu hao ấn khi chuẩn bị.
- Chơi được Aeris và Kael. Rivet có dữ liệu thử nghiệm nhưng đang bị ẩn.
- Bản đồ chọn màn có đường chấm bám lối mòn, hiệu ứng đom đóm, đèn, lá rơi, tuyết, suối và thác; hỗ trợ giảm chuyển động.
- Hướng dẫn ngữ cảnh, túi đồ, cửa hàng, cài đặt và lưu tiến trình trong trình duyệt.

## Chạy local

```sh
npm install
npm run dev
```

Mở http://localhost:3000. Node.js 24 đã được dùng trong lần kiểm tra hiện tại.

```sh
npm run build
npm run preview
```

Thư mục build là `dist/`. Chưa xác nhận triển khai GitHub Pages hoặc hosting khác chỉ bằng việc push code.

## Điều khiển hiện tại

| Phím / thao tác | Chức năng |
|---|---|
| WASD / phím mũi tên | Di chuyển |
| E | Bắt đầu/dừng ghi đường đi và đòn đánh |
| Q | Triệu hồi Echo từ bản ghi |
| 1-4 | Chọn Echo |
| C | Dừng/phát lại Echo đang chọn |
| X | Thu hồi Echo đang chọn |
| Shift + Q | Đổi vị trí với Echo; đường đổi không được xuyên tường/cổng; tốn 30 ổn định, hồi 7 giây |
| Chuột trái | Đánh/bắn về vị trí con trỏ |
| Chuột phải / Space | Kỹ năng riêng của nhân vật |
| Shift | Lướt né trong màn có quái/boss |
| Shift + bấm chuột | Đánh dấu mục tiêu ưu tiên cho Echo |
| F | Dùng 1 bình +2 giây; tối đa 1 mỗi chặng |
| Bấm ấn / mở túi | Dùng ấn nâng Echo trong màn 2-6 |
| Esc / P | Tạm dừng/tiếp tục |
| T | Chơi lại màn; cần nhận thưởng đang chờ trước |
| M | Bật/tắt âm thanh trong các trạng thái được xử lý |

Gõ Y bốn lần trong phiên kiểm thử để mở khóa màn và bỏ deadline; không phải cách chơi chiến dịch thông thường. Trò chơi hiện ưu tiên bàn phím/chuột. Giao diện chọn thưởng đã được kiểm tra ở khổ điện thoại nhưng chưa có bộ joystick/nút chiến đấu cảm ứng đầy đủ.

## Kiểm tra

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

PowerShell, chạy toàn bộ bài kiểm tra:

```powershell
$testFiles = @(rg --files src -g '*.test.ts' -g '*.test.tsx')
node node_modules/tsx/dist/cli.mjs --test $testFiles
```

Lần kiểm tra của phiên bản này: **131/131 bài đạt**, TypeScript không lỗi, build thành công. Có cảnh báo Vite về `__dirname` và bundle lớn hơn 500 kB; chưa tối ưu tách bundle.

## Lưu tiến trình

Dữ liệu chiến dịch nằm trong localStorage với khóa `second-me-campaign-v3`: màn đã xong, vũ khí, xu, bình thời gian, sao tốt nhất, ấn Echo và bộ thưởng chưa chọn. Chưa có tài khoản hay đồng bộ nhiều thiết bị. Ấn đã kích hoạt bị trừ ngay; chết/chơi lại không hoàn lại ấn đó. Bắt đầu hành trình mới xóa tiến trình chiến dịch và kho ấn.

## Intro và video

Intro mới, nền minh họa và thời điểm voice tương ứng đã được đưa vào mã nguồn theo yêu cầu của chủ dự án. Các video MP4 xuất riêng vẫn được lưu riêng, không nằm trong repo.

## Cấu trúc chính

- `src/game/GameEngine.ts`: trạng thái, vòng lặp, input, Echo, chiến đấu, tiến trình.
- `src/game/logic/levels.ts`, `balance.ts`: bản đồ, cổng, rune công tắc, bẫy và nhịp độ.
- `src/game/logic/echoRunes.ts`, `campaign.ts`: định nghĩa ấn, rút thưởng, lưu và tiêu hao.
- `src/game/logic/enemies.ts`: bố trí quái, AI, tầm nhìn, báo đòn.
- `src/game/rendering/`: sprite, môi trường, bẫy, boss và hiệu ứng.
- `src/components/CampaignUI.tsx`, `EchoRunes.tsx`, `JourneyCamp.tsx`: giao diện.
- `src/game/loading/`: tải và khởi tạo asset thật.
- `public/assets/`: hình, sprite, nhạc và voice đã thu sẵn.

## Phạm vi và điểm còn cần hoàn thiện

Đây là bản có cơ chế chơi và kiểm tra hồi quy; chưa phải bản phát hành đã cân bằng bằng số liệu người chơi diện rộng. Quái dùng AI đuổi/đánh có giới hạn, chưa có tìm đường A*. Cần kiểm thử thêm toàn bộ chiến dịch bằng người chơi, hoàn thiện điều khiển cảm ứng, rà bản quyền/nguồn asset trước phát hành thương mại, và bổ sung voice còn thiếu. Một số nhãn/hướng dẫn cũ vẫn cần rà đồng bộ sau thay đổi luật chơi.


