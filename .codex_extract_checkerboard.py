import struct
import sys
import zlib


def paeth(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos = 8
    idat = bytearray()
    width = height = color_type = None
    while pos < len(data):
        n = struct.unpack(">I", data[pos : pos + 4])[0]
        kind = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + n]
        pos += 12 + n
        if kind == b"IHDR":
            width, height, depth, color_type, comp, filt, interlace = struct.unpack(">IIBBBBB", chunk)
            if depth != 8 or color_type != 2 or interlace != 0:
                raise ValueError("expected non-interlaced 8-bit RGB PNG")
        elif kind == b"IDAT":
            idat.extend(chunk)
        elif kind == b"IEND":
            break
    raw = zlib.decompress(bytes(idat))
    stride = width * 3
    rows = []
    previous = bytearray(stride)
    offset = 0
    for _ in range(height):
        filt = raw[offset]
        offset += 1
        row = bytearray(raw[offset : offset + stride])
        offset += stride
        for i in range(stride):
            left = row[i - 3] if i >= 3 else 0
            up = previous[i]
            up_left = previous[i - 3] if i >= 3 else 0
            if filt == 1:
                row[i] = (row[i] + left) & 255
            elif filt == 2:
                row[i] = (row[i] + up) & 255
            elif filt == 3:
                row[i] = (row[i] + ((left + up) // 2)) & 255
            elif filt == 4:
                row[i] = (row[i] + paeth(left, up, up_left)) & 255
            elif filt != 0:
                raise ValueError("unsupported PNG filter")
        rows.append(row)
        previous = row
    return width, height, rows


def write_png(path, width, height, rgba_rows):
    raw = bytearray()
    for row in rgba_rows:
        raw.append(0)
        raw.extend(row)
    def chunk(kind, payload):
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(out)


def process(source, target):
    width, height, rows = read_png(source)
    # The generated preview uses a 16 px checker tile, repeating every 32 px.
    # Estimate the checker color for each exact phase from the image median.
    samples = [[[] for _ in range(32)] for _ in range(32)]
    for y, row in enumerate(rows):
        for x in range(width):
            i = x * 3
            rgb = row[i : i + 3]
            samples[y % 32][x % 32].append(tuple(rgb))
    medians = [[None for _ in range(32)] for _ in range(32)]
    for py in range(32):
        for px in range(32):
            vals = samples[py][px]
            medians[py][px] = tuple(sorted(v[c] for v in vals)[len(vals) // 2] for c in range(3))

    out_rows = []
    for y, row in enumerate(rows):
        out = bytearray()
        for x in range(width):
            i = x * 3
            rgb = row[i : i + 3]
            ref = medians[y % 32][x % 32]
            dist = sum(abs(int(rgb[c]) - int(ref[c])) for c in range(3)) / 3.0
            # Transparent for the checkerboard; preserve real subject pixels.
            # A narrow transition keeps a clean, non-jagged edge.
            if dist <= 8:
                alpha = 0
            elif dist >= 28:
                alpha = 255
            else:
                alpha = int((dist - 8) * 255 / 20)
            out.extend(rgb)
            out.append(alpha)
        out_rows.append(out)
    write_png(target, width, height, out_rows)


if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2])
