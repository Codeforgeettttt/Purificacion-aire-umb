import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const size = 256;
const image = Buffer.alloc((size * 4 + 1) * size);
const paths = [[44, 86, 154, 86], [154, 86, 172, 80], [172, 80, 181, 64],
  [44, 128, 202, 128], [44, 170, 154, 170], [154, 170, 172, 176], [172, 176, 181, 192]];
function segment(x, y, [a, b, c, d]) {
  const t = Math.max(0, Math.min(1, ((x - a) * (c - a) + (y - b) * (d - b)) / ((c - a) ** 2 + (d - b) ** 2)));
  return Math.hypot(x - (a + t * (c - a)), y - (b + t * (d - b)));
}
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const corner = Math.hypot(Math.max(0, Math.abs(x - 127.5) - 76), Math.max(0, Math.abs(y - 127.5) - 76));
  const line = paths.some(path => segment(x, y, path) <= 7.5);
  const rgba = line ? [165, 240, 212, 255] : [16, 60, 66, corner <= 51 ? 255 : 0];
  image.set(rgba, y * (size * 4 + 1) + x * 4 + 1);
}
function chunk(name, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length);
  header.write(name, 4);
  const end = Buffer.alloc(4);
  end.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), data])));
  return Buffer.concat([header, data, end]);
}
const info = Buffer.alloc(13);
info.writeUInt32BE(size);
info.writeUInt32BE(size, 4);
info[8] = 8;
info[9] = 6;
const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', info),
  chunk('IDAT', deflateSync(image)), chunk('IEND', Buffer.alloc(0))]);
const icon = Buffer.alloc(22);
icon.writeUInt16LE(1, 2);
icon.writeUInt16LE(1, 4);
icon.writeUInt16LE(1, 10);
icon.writeUInt16LE(32, 12);
icon.writeUInt32LE(png.length, 14);
icon.writeUInt32LE(22, 18);
writeFileSync(new URL('../desktop/icon.png', import.meta.url), png);
writeFileSync(new URL('../desktop/icon.ico', import.meta.url), Buffer.concat([icon, png]));
