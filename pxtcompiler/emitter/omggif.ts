// modified from omggif
// (c) Dean McNamee <dean@gmail.com>, 2013.
//
// https://github.com/deanm/omggif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// omggif is a JavaScript implementation of a GIF 89a encoder and decoder,
// including animation and compression.  It does not rely on any specific
// underlying system, so should run in the browser, Node, or Plask.

namespace ts.pxtc.gif {

    export class GifWriter {
        buf: Uint8Array;
        width: number;
        height: number;
        private loop_count: number;
        private global_palette: number[];
        private p: number;
        private ended = false;

        constructor(public gopts: GifWriterOptions) {
            this.width = gopts.width;
            this.height = gopts.height;
            this.buf = new Uint8Array(gopts.maxLength);
            this.p = 0;
            this.loop_count = gopts.loop === undefined ? null : gopts.loop;
            this.global_palette = gopts.palette === undefined ? null : gopts.palette;

            if (this.width <= 0 || this.height <= 0 || this.width > 65535 || this.height > 65535)
                throw new Error("Width/Height invalid.");

            // - Header.
            this.buf[this.p++] = 0x47; this.buf[this.p++] = 0x49; this.buf[this.p++] = 0x46;  // GIF
            this.buf[this.p++] = 0x38; this.buf[this.p++] = 0x39; this.buf[this.p++] = 0x61;  // 89a

            // Handling of Global Color Table (palette) and background index.
            let gp_num_colors_pow2 = 0;
            let background = 0;
            if (this.global_palette !== null) {
                let gp_num_colors = GifWriter.check_palette_and_num_colors(this.global_palette);
                // tslint:disable-next-line
                while (gp_num_colors >>= 1)++gp_num_colors_pow2;
                gp_num_colors = 1 << gp_num_colors_pow2;
                --gp_num_colors_pow2;
                if (gopts.background !== undefined) {
                    background = gopts.background;
                    if (background >= gp_num_colors)
                        throw new Error("Background index out of range.");
                    // The GIF spec states that a background index of 0 should be ignored, so
                    // this is probably a mistake and you really want to set it to another
                    // slot in the palette.  But actually in the end most browsers, etc end
                    // up ignoring this almost completely (including for dispose background).
                    if (background === 0)
                        throw new Error("Background index explicitly passed as 0.");
                }
            }

            // - Logical Screen Descriptor.
            // NOTE(deanm): w/h apparently ignored by implementations, but set anyway.
            this.buf[this.p++] = this.width & 0xff; this.buf[this.p++] = this.width >> 8 & 0xff;
            this.buf[this.p++] = this.height & 0xff; this.buf[this.p++] = this.height >> 8 & 0xff;
            // NOTE: Indicates 0-bpp original color resolution (unused?).
            this.buf[this.p++] = (this.global_palette !== null ? 0x80 : 0) |  // Global Color Table Flag.
                gp_num_colors_pow2;  // NOTE: No sort flag (unused?).
            this.buf[this.p++] = background;  // Background Color Index.
            this.buf[this.p++] = 0;  // Pixel aspect ratio (unused?).

            // - Global Color Table
            if (this.global_palette !== null) {
                for (let i = 0, il = this.global_palette.length; i < il; ++i) {
                    let rgb = this.global_palette[i];
                    this.buf[this.p++] = rgb >> 16 & 0xff;
                    this.buf[this.p++] = rgb >> 8 & 0xff;
                    this.buf[this.p++] = rgb & 0xff;
                }
            }

            if (this.loop_count !== null) {  // Netscape block for looping.
                if (this.loop_count < 0 || this.loop_count > 65535)
                    throw new Error("Loop count invalid.")
                // Extension code, label, and length.
                this.buf[this.p++] = 0x21; this.buf[this.p++] = 0xff; this.buf[this.p++] = 0x0b;
                // NETSCAPE2.0
                this.buf[this.p++] = 0x4e; this.buf[this.p++] = 0x45; this.buf[this.p++] = 0x54; this.buf[this.p++] = 0x53;
                this.buf[this.p++] = 0x43; this.buf[this.p++] = 0x41; this.buf[this.p++] = 0x50; this.buf[this.p++] = 0x45;
                this.buf[this.p++] = 0x32; this.buf[this.p++] = 0x2e; this.buf[this.p++] = 0x30;
                // Sub-block
                this.buf[this.p++] = 0x03; this.buf[this.p++] = 0x01;
                this.buf[this.p++] = this.loop_count & 0xff; this.buf[this.p++] = this.loop_count >> 8 & 0xff;
                this.buf[this.p++] = 0x00;  // Terminator.
            }

        }

        static check_palette_and_num_colors(palette: number[]) {
            let num_colors = palette.length;
            if (num_colors < 2 || num_colors > 256 || num_colors & (num_colors - 1)) {
                throw new Error(
                    "Invalid code/color length, must be power of 2 and 2 .. 256.");
            }
            return num_colors;
        }


        addFrame(indexed_pixels: Uint8ClampedArray, opts: ts.pxtc.gif.GifOptions = {}) {
            const x = 0;
            const y = 0;
            const w = this.width;
            const h = this.height;

            if (this.ended === true) { --this.p; this.ended = false; }  // Un-end.

            const lastp = this.p;
            // TODO(deanm): Bounds check x, y.  Do they need to be within the virtual
            // canvas width/height, I imagine?
            if (x < 0 || y < 0 || x > 65535 || y > 65535)
                throw new Error("x/y invalid.")

            if (w <= 0 || h <= 0 || w > 65535 || h > 65535)
                throw new Error("Width/Height invalid.")

            if (indexed_pixels.length < w * h)
                throw new Error("Not enough pixels for the frame size.");

            let using_local_palette = true;
            let palette = opts.palette;
            if (palette === undefined || palette === null) {
                using_local_palette = false;
                palette = this.global_palette;
            }

            if (palette === undefined || palette === null)
                throw new Error("Must supply either a local or global palette.");

            let num_colors = GifWriter.check_palette_and_num_colors(palette);

            // Compute the min_code_size (power of 2), destroying num_colors.
            let min_code_size = 0;
            // tslint:disable-next-line
            while (num_colors >>= 1)++min_code_size;
            num_colors = 1 << min_code_size;  // Now we can easily get it back.

            let delay = opts.delay === undefined ? 0 : opts.delay;

            // From the spec:
            //     0 -   No disposal specified. The decoder is
            //           not required to take any action.
            //     1 -   Do not dispose. The graphic is to be left
            //           in place.
            //     2 -   Restore to background color. The area used by the
            //           graphic must be restored to the background color.
            //     3 -   Restore to previous. The decoder is required to
            //           restore the area overwritten by the graphic with
            //           what was there prior to rendering the graphic.
            //  4-7 -    To be defined.
            // NOTE(deanm): Dispose background doesn't really work, apparently most
            // browsers ignore the background palette index and clear to transparency.
            let disposal = opts.disposal === undefined ? 0 : opts.disposal;
            if (disposal < 0 || disposal > 3)  // 4-7 is reserved.
                throw new Error("Disposal out of range.");

            let use_transparency = false;
            let transparent_index = 0;
            if (opts.transparent !== undefined && opts.transparent !== null) {
                use_transparency = true;
                transparent_index = opts.transparent;
                if (transparent_index < 0 || transparent_index >= num_colors)
                    throw new Error("Transparent color index.");
            }

            if (disposal !== 0 || use_transparency || delay !== 0) {
                // - Graphics Control Extension
                this.buf[this.p++] = 0x21; this.buf[this.p++] = 0xf9;  // Extension / Label.
                this.buf[this.p++] = 4;  // Byte size.

                this.buf[this.p++] = disposal << 2 | (use_transparency === true ? 1 : 0);
                this.buf[this.p++] = delay & 0xff; this.buf[this.p++] = delay >> 8 & 0xff;
                this.buf[this.p++] = transparent_index;  // Transparent color index.
                this.buf[this.p++] = 0;  // Block Terminator.
            }

            // - Image Descriptor
            this.buf[this.p++] = 0x2c;  // Image Seperator.
            this.buf[this.p++] = x & 0xff; this.buf[this.p++] = x >> 8 & 0xff;  // Left.
            this.buf[this.p++] = y & 0xff; this.buf[this.p++] = y >> 8 & 0xff;  // Top.
            this.buf[this.p++] = w & 0xff; this.buf[this.p++] = w >> 8 & 0xff;
            this.buf[this.p++] = h & 0xff; this.buf[this.p++] = h >> 8 & 0xff;
            // NOTE: No sort flag (unused?).
            // TODO(deanm): Support interlace.
            this.buf[this.p++] = using_local_palette === true ? (0x80 | (min_code_size - 1)) : 0;

            // - Local Color Table
            if (using_local_palette === true) {
                for (let i = 0, il = palette.length; i < il; ++i) {
                    let rgb = palette[i];
                    this.buf[this.p++] = rgb >> 16 & 0xff;
                    this.buf[this.p++] = rgb >> 8 & 0xff;
                    this.buf[this.p++] = rgb & 0xff;
                }
            }

            this.p = GifWriter.GifWriterOutputLZWCodeStream(
                this.buf, this.p, min_code_size < 2 ? 2 : min_code_size, indexed_pixels);

            if (this.p + "data:image/gif;base64,".length >= this.buf.length) { // out of space ?
                // we're out space
                this.p = lastp;
                return false;
            }
            else return true;
        }

        end() {
            if (this.ended === false) {
                this.buf[this.p++] = 0x3b;  // Trailer.
                this.ended = true;
            }
            const bytes = this.buf.slice(0, this.p);
            return "data:image/gif;base64," + btoa(U.uint8ArrayToString(bytes))
        }

        // Main compression routine, palette indexes -> LZW code stream.
        // |index_stream| must have at least one entry.
        static GifWriterOutputLZWCodeStream(buf: Uint8Array, p: number, min_code_size: number, index_stream: Uint8ClampedArray) {
            buf[p++] = min_code_size;
            let cur_subblock = p++;  // Pointing at the length field.

            let clear_code = 1 << min_code_size;
            let code_mask = clear_code - 1;
            let eoi_code = clear_code + 1;
            let next_code = eoi_code + 1;

            let cur_code_size = min_code_size + 1;  // Number of bits per code.
            let cur_shift = 0;
            // We have at most 12-bit codes, so we should have to hold a max of 19
            // bits here (and then we would write out).
            let cur = 0;

            function emit_bytes_to_buffer(bit_block_size: number) {
                while (cur_shift >= bit_block_size) {
                    buf[p++] = cur & 0xff;
                    cur >>= 8; cur_shift -= 8;
                    if (p === cur_subblock + 256) {  // Finished a subblock.
                        buf[cur_subblock] = 255;
                        cur_subblock = p++;
                    }
                }
            }

            function emit_code(c: number) {
                cur |= c << cur_shift;
                cur_shift += cur_code_size;
                emit_bytes_to_buffer(8);
            }

            // I am not an expert on the topic, and I don't want to write a thesis.
            // However, it is good to outline here the basic algorithm and the few data
            // structures and optimizations here that make this implementation fast.
            // The basic idea behind LZW is to build a table of previously seen runs
            // addressed by a short id (herein called output code).  All data is
            // referenced by a code, which represents one or more values from the
            // original input stream.  All input bytes can be referenced as the same
            // value as an output code.  So if you didn't want any compression, you
            // could more or less just output the original bytes as codes (there are
            // some details to this, but it is the idea).  In order to achieve
            // compression, values greater then the input range (codes can be up to
            // 12-bit while input only 8-bit) represent a sequence of previously seen
            // inputs.  The decompressor is able to build the same mapping while
            // decoding, so there is always a shared common knowledge between the
            // encoding and decoder, which is also important for "timing" aspects like
            // how to handle variable bit width code encoding.
            //
            // One obvious but very important consequence of the table system is there
            // is always a unique id (at most 12-bits) to map the runs.  'A' might be
            // 4, then 'AA' might be 10, 'AAA' 11, 'AAAA' 12, etc.  This relationship
            // can be used for an effecient lookup strategy for the code mapping.  We
            // need to know if a run has been seen before, and be able to map that run
            // to the output code.  Since we start with known unique ids (input bytes),
            // and then from those build more unique ids (table entries), we can
            // continue this chain (almost like a linked list) to always have small
            // integer values that represent the current byte chains in the encoder.
            // This means instead of tracking the input bytes (AAAABCD) to know our
            // current state, we can track the table entry for AAAABC (it is guaranteed
            // to exist by the nature of the algorithm) and the next character D.
            // Therefor the tuple of (table_entry, byte) is guaranteed to also be
            // unique.  This allows us to create a simple lookup key for mapping input
            // sequences to codes (table indices) without having to store or search
            // any of the code sequences.  So if 'AAAA' has a table entry of 12, the
            // tuple of ('AAAA', K) for any input byte K will be unique, and can be our
            // key.  This leads to a integer value at most 20-bits, which can always
            // fit in an SMI value and be used as a fast sparse array / object key.

            // Output code for the current contents of the index buffer.
            let ib_code = index_stream[0] & code_mask;  // Load first input index.
            let code_table: pxt.Map<number> = {};  // Key'd on our 20-bit "tuple".

            emit_code(clear_code);  // Spec says first code should be a clear code.

            // First index already loaded, process the rest of the stream.
            for (let i = 1, il = index_stream.length; i < il; ++i) {
                let k = index_stream[i] & code_mask;
                let cur_key = ib_code << 8 | k;  // (prev, k) unique tuple.
                let cur_code = code_table[cur_key];  // buffer + k.

                // Check if we have to create a new code table entry.
                if (cur_code === undefined) {  // We don't have buffer + k.
                    // Emit index buffer (without k).
                    // This is an inline version of emit_code, because this is the core
                    // writing routine of the compressor (and V8 cannot inline emit_code
                    // because it is a closure here in a different context).  Additionally
                    // we can call emit_byte_to_buffer less often, because we can have
                    // 30-bits (from our 31-bit signed SMI), and we know our codes will only
                    // be 12-bits, so can safely have 18-bits there without overflow.
                    // emit_code(ib_code);
                    cur |= ib_code << cur_shift;
                    cur_shift += cur_code_size;
                    while (cur_shift >= 8) {
                        buf[p++] = cur & 0xff;
                        cur >>= 8; cur_shift -= 8;
                        if (p === cur_subblock + 256) {  // Finished a subblock.
                            buf[cur_subblock] = 255;
                            cur_subblock = p++;
                        }
                    }

                    if (next_code === 4096) {  // Table full, need a clear.
                        emit_code(clear_code);
                        next_code = eoi_code + 1;
                        cur_code_size = min_code_size + 1;
                        code_table = {};
                    } else {  // Table not full, insert a new entry.
                        // Increase our variable bit code sizes if necessary.  This is a bit
                        // tricky as it is based on "timing" between the encoding and
                        // decoder.  From the encoders perspective this should happen after
                        // we've already emitted the index buffer and are about to create the
                        // first table entry that would overflow our current code bit size.
                        if (next_code >= (1 << cur_code_size))++cur_code_size;
                        code_table[cur_key] = next_code++;  // Insert into code table.
                    }

                    ib_code = k;  // Index buffer to single input k.
                } else {
                    ib_code = cur_code;  // Index buffer to sequence in code table.
                }
            }

            emit_code(ib_code);  // There will still be something in the index buffer.
            emit_code(eoi_code);  // End Of Information.

            // Flush / finalize the sub-blocks stream to the buffer.
            emit_bytes_to_buffer(1);

            // Finish the sub-blocks, writing out any unfinished lengths and
            // terminating with a sub-block of length 0.  If we have already started
            // but not yet used a sub-block it can just become the terminator.
            if (cur_subblock + 1 === p) {  // Started but unused.
                buf[cur_subblock] = 0;
            } else {  // Started and used, write length and additional terminator block.
                buf[cur_subblock] = p - cur_subblock - 1;
                buf[p++] = 0;
            }
            return p;
        }
    }
}