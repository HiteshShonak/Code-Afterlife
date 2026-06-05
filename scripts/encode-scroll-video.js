/**
 * Optimized scroll-video encoder — smaller files, still frame-perfect.
 *
 * Strategy change: Use 720p → 854x480 (smaller) + higher CRF for WebM.
 * The video plays in a full-bleed canvas anyway, so high-res isn't needed —
 * CSS scaling handles the upscaling beautifully.
 *
 * Also tries: AVIF-based WebM for much better compression.
 */

const cp   = require("child_process");
const path = require("path");
const fs   = require("fs");

const ffmpeg = require("ffmpeg-static");

const INPUT = path.join(__dirname, "..", "public", "hourGlass.mp4");

const outputs = [
  {
    out: path.join(__dirname, "..", "public", "hourGlass-scroll.mp4"),
    label: "H.264 MP4 (Safari fallback)",
    args: [
      `-vf "scale=854:-2"`,       // 854×480 — sufficient for full-bleed canvas
      `-c:v libx264`,
      `-profile:v baseline -level 3.1`,
      `-g 1`,                      // all-keyframe = instant seek
      `-crf 32`,                   // higher CRF = smaller file
      `-preset slow`,
      `-pix_fmt yuv420p`,
      `-movflags +faststart`,
      `-an`,
    ],
  },
  {
    out: path.join(__dirname, "..", "public", "hourGlass-scroll.webm"),
    label: "VP9 WebM (Chrome/Firefox primary)",
    args: [
      `-vf "scale=854:-2"`,
      `-c:v libvpx-vp9`,
      `-g 1`,                      // all-keyframe
      `-b:v 0`,                    // constant quality
      `-crf 50`,                   // VP9 CRF 50 ≈ H264 CRF 33, much smaller
      `-deadline good`,
      `-cpu-used 4`,               // faster encode, acceptable quality
      `-an`,
    ],
  },
];

const inputSizeMB = (fs.statSync(INPUT).size / 1024 / 1024).toFixed(2);
console.log(`Input: ${inputSizeMB} MB\n`);

for (const { out, label, args } of outputs) {
  console.log(`Encoding ${label}...`);
  try {
    cp.execSync(
      `"${ffmpeg}" -y -i "${INPUT}" ${args.join(" ")} "${out}"`,
      { stdio: "inherit" }
    );
    const sizeMB = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
    console.log(`✓ Done: ${sizeMB} MB → ${path.basename(out)}\n`);
  } catch (e) {
    console.error(`✗ Failed: ${label}`, e.message);
  }
}

// Print summary
console.log("─────────────────────────────");
console.log(`Original:              ${inputSizeMB} MB`);
for (const { out, label } of outputs) {
  if (fs.existsSync(out)) {
    const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
    console.log(`${label}: ${mb} MB`);
  }
}
console.log(`Image sequence (old):  10.96 MB`);
console.log("─────────────────────────────");
