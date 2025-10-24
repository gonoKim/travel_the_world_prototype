"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";

export default function SvgWorldMap() {
  const [svgContent, setSvgContent] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);

  // 1️⃣ SVG 파일 로드
  useEffect(() => {
    fetch("/maps/world.svg")
      .then((res) => res.text())
      .then((text) => setSvgContent(text));
  }, []);

  // 2️⃣ 클릭 이벤트를 직접 주입
  useEffect(() => {
    if (!svgContent) return;
    const svgRoot = document.querySelector("#world-map svg");
    if (!svgRoot) return;

    svgRoot.querySelectorAll("path").forEach((el) => {
      const name = el.getAttribute("data-name") || el.getAttribute("title") || "Unknown";
      el.setAttribute("cursor", "pointer");
      el.addEventListener("click", () => setSelected(name));
      el.addEventListener("mouseenter", () => (el as SVGPathElement).style.fill = "#f0ede0");
      el.addEventListener("mouseleave", () => (el as SVGPathElement).style.fill = "white");
    });

    return () => {
      svgRoot.querySelectorAll("path").forEach((el) => {
        el.replaceWith(el.cloneNode(true)); // 이벤트 제거
      });
    };
  }, [svgContent]);

  return (
    <Box
      id="world-map"
      sx={{
        width: "100%",
        height: "100vh",
        bgcolor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    >
      {/* SVG가 여기에 렌더링됨 */}
    </Box>
  );
}
