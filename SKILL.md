---
name: figma-to-react
description: Render Figma node to React UI with fallback to screenshot if MCP fails.
metadata:
  version: 3.0
  mcp-server: figma
---

# 🎯 RULE

Render Figma → React

Priority:
1. Figma MCP (pixel-perfect)
2. Screenshot (fallback only)

---

# ⚙️ HOW TO WORK

## STEP 1 — Try Figma MCP
1. Fetch Figma node using node-id via MCP
2. Read full node tree (layout, size, spacing, hierarchy)
3. Render UI EXACTLY as structure appears in Figma

## STEP 2 — If MCP fails
1. Use provided screenshot (Cloudinary URL)
2. Analyze layout visually
3. Approximate structure based on screenshot

---

# 🧱 MAPPING RULES

- Frame → div
- Group → div
- Text → p
- Image → img
- AutoLayout → flex container (ONLY if present in Figma OR inferred from screenshot)

---

# 🎨 STYLE RULES

- Use TailwindCSS only

## If using Figma:
- width → w-[x]
- height → h-[x]
- padding → p-[x]
- margin → m-[x]
- gap → gap-[x]
- MUST be pixel-accurate
- DO NOT round values

## If using Screenshot:
- Use closest Tailwind approximation
- Allow flex/grid inference
- Spacing can be approximated

---

# 🧠 MODE SWITCH

## FIGMA MODE (STRICT)
- MUST use ONLY Figma MCP data
- DO NOT guess layout
- DO NOT improve UI

## SCREENSHOT MODE (FALLBACK)
- Allowed to approximate layout
- Allowed to infer flex/grid
- Focus on visual similarity

---

# 📄 OUTPUT RULES

- Output ONE file only
- File path: src/pages/FigmaPage.tsx
- Must be valid TypeScript + React
- Must include full JSX structure

---

# 🔄 FALLBACK LOGIC

- Try Figma MCP first
- If MCP fails OR rate limited:
  → Switch to Screenshot mode
  → Use Cloudinary image

---

# 🚫 FORBIDDEN

## In FIGMA MODE:
- No redesign
- No layout optimization
- No guessing

## In SCREENSHOT MODE:
- No adding new UI not in image
- No over-engineering

---

# 🔒 CACHE RULE

- Ignore all existing implementations
- Always regenerate from input