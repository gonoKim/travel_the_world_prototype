import fs from "fs";
const src = "out/index.html";
const dst = "out/404.html";
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log("Copied out/index.html -> out/404.html");
} else {
  console.warn("index.html not found under out/");
}
