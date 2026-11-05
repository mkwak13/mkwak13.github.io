---
name: Minseok Kwak · Medical Imaging & 3D Vision
description: Personal research portfolio in a light, clinical style; imaging work shown in dark viewer frames.
colors:
  bg: "#f4f6f7"
  surface: "#ffffff"
  surface-2: "#eef2f4"
  viewer: "#0b1317"
  viewer-2: "#131e24"
  ink: "#12212a"
  ink-2: "#33444e"
  muted: "#5a6a74"
  line: "rgba(18, 33, 42, 0.10)"
  line-strong: "rgba(18, 33, 42, 0.18)"
  accent: "#0a7480"
  accent-ink: "#075861"
  accent-soft: "rgba(10, 116, 128, 0.09)"
  accent-glow: "#4fd1dc"
  near: "#d9532b"
  amber: "#8a5200"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(44px, 6.4vw, 80px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 44px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  gutter: "clamp(20px, 4vw, 40px)"
  section: "clamp(72px, 9vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    height: "46px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "46px"
    padding: "0 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
  viewer:
    backgroundColor: "{colors.viewer}"
    textColor: "#cfe0e5"
    rounded: "{rounded.lg}"
    padding: "10px"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "3px 9px"
---

# Design System: Minseok Kwak · Medical Imaging & 3D Vision

## Overview

**Creative North Star: "The Reading Room"**

The site behaves like a radiology reading room: bright, quiet paper for the words and dark, glare-free viewer panels for the images. The research is the subject. Every medical image (endoscopy frames, depth maps, decomposition layers) sits in a dark viewer frame with a monospace status bar and readout, and it is interactive where it helps: compare sliders, layer explorers, a depth probe under the cursor. Everything around the images stays light and calm so recruiters can scan it in seconds and engineers can read it at length.

**Key Characteristics:**
- Light cool-paper ground, white surfaces, deep slate ink.
- One clinical teal accent for actions, structure and the best result; warm coral only for "near" and first-author emphasis.
- Dark viewer frames reserved for imaging content, never for text sections.
- IBM Plex Sans for reading, IBM Plex Mono for readouts, numbers and status.
- Key facts highlighted as metric chips with real numbers.

## Colors

### Primary
- **Clinical Teal** (#0a7480): primary buttons, links, nav underline, focus ring, best-result rows and bars. Hover darkens to **Deep Teal** (#075861).
- **Scanner Glow** (#4fd1dc): only inside viewers (live dot, scan-line sweep, slider focus).

### Secondary
- **Near Coral** (#d9532b): the "near" end of depth, first-author metric chip, focus-area markers. Text uses the darker #9c3412 for contrast.
- **Review Amber** (#8a5200): "under review" status labels only.

### Neutral
- **Paper** (#f4f6f7) page ground, **Surface** (#ffffff) cards and alternating sections, **Mist** (#eef2f4) tags and chart tracks.
- **Viewer** (#0b1317) and **Viewer 2** (#131e24) for image frames and their tab bars.
- **Ink** (#12212a) headings, **Ink 2** (#33444e) body, **Muted** (#5a6a74) meta.

### Named Rules
**The Reading Room Rule.** Dark backgrounds exist only to hold medical images. Text sections are always light.

**The One Accent Rule.** Teal is the only interface accent; coral and amber carry meaning (depth, authorship, review status) and nothing else.

## Typography

**Body Font:** IBM Plex Sans. **Label/Mono Font:** IBM Plex Mono.

**Character:** a precise, institutional sans with a monospace that reads like instrument output.

### Hierarchy
- **Display** (600, clamp(44px, 6.4vw, 80px), 1.0): the hero name.
- **Headline** (600, clamp(30px, 3.6vw, 44px), 1.1): section titles; project titles up to 56px.
- **Title** (600, 20 to 21px, 1.25): card and role titles.
- **Body** (400, 16 to 17px, 1.65): paragraphs, max about 68ch.
- **Label** (500, 12.5 to 13px, mono, sentence case): status, dates, viewer bars, readouts, captions.

### Named Rules
**The Readout Rule.** Monospace is for numbers, status, captions and viewer text, never for paragraphs.

## Layout

Container 1200px with a fluid gutter; reading pages narrow to 820px for method text. Sections alternate Paper and Surface grounds with a hairline between them. Splits put text left and the viewer right, with the viewer sticky beside long text on project pages. Breakpoints: 520 (narrow viewers), 860 (nav becomes a menu), 900 to 1024 (grids and splits go multi-column).

## Elevation & Depth

Soft, layered shadows on light surfaces (cards `0 1px 2px` plus `0 4px 16px` at low alpha; lifted to `0 14px 36px` on hover and on viewers). Viewers are the deepest layer. Linked cards lift 2px on hover and press to 0.99 on click.

### Background scan volume (signature)
A fixed canvas behind all pages. On the right, an anatomical heart in anterior view (ventricles tapering to an apex down and to the viewer's right, right and left atria with auricles) built from axial contour slices like a cardiac CT reconstruction, in Clinical Teal at low alpha, with a soft tissue tint filling each slice, and the great vessels as solid translucent tubes (oxygenated in coral: aortic arch, its three branches, descending aorta behind the heart, pulmonary veins; deoxygenated in blue #2f69c9: pulmonary trunk and arteries, superior and inferior vena cava); a highlighted active slice (filled coral cross-section with a soft glow and a 2.6px outline, drawn above the vessels and pulsing with the beat) with a dashed scanner-plane frame and a mono `cardiac CT · slice 001 / 240` readout. On the left (desktop only), a second, smaller heart (70% of the right one) is a faint hologram (drawn at 55% opacity): a low-poly mesh in cyan light (rgb 0,168,204) with a hologram glow on every vertex (a radial glow sprite) and every edge (two wide soft halo strokes under a thin core line), faint facets, fine horizontal scan lines clipped to its silhouette, a bright band that sweeps down it every few seconds, a faint magenta chromatic fringe, a gentle flicker with a rare one-frame glitch, and a projector disc with a light cone beneath it. The mesh is built from rings resampled off every third CT slice and rings along each great vessel. Its vertices start scattered across the left of the viewport and fly into place when the right heart's scanning slice reaches their height, so the mesh is reconstructed from top to bottom in step with the scan across the whole page; edges and facets appear once their vertices land. Light (edges about 0.3 alpha, facets 0.02 to 0.08, vertices about 0.5) so it stays behind the text. Scrolling spins it about the true vertical axis, with the same 20-degree earth-like tilt; it stays still when the visitor is not scrolling. Hologram edges appear only once both vertices have nearly landed. The right heart is always fully drawn. Reduced motion shows the finished mesh. Behind it, a faint layered neural network with signal pulses. The heart shares one cardiac clock with the hero ECG (900 ms per beat, about 67 BPM): the ventricles contract right after each R peak. The heart model is tilted 20 degrees, like the earth on its axis, and holds a fixed three-quarter pose (it does not spin), angled so the active slice reads as a filled cross-section; scrolling moves the active slice from the top of the heart down toward the apex, and pushes pulses through the network; the cursor does not move it. On project pages (no `.hero`) the background is quieter: the right heart at 40% strength without its slice readout, and no hologram, so method text and equations read cleanly. When nothing has scrolled for 1.2 s the canvas redraws every other frame. Half strength under 900px; a still frame under reduced motion; paused when the tab is hidden. Light sections are semi-transparent so it shows through; cards stay opaque for reading.

## Shapes

6px controls, 10px inner panels and tables, 16px cards and viewers, full pills for profile chips.

## Components

### Buttons
Teal primary and white secondary with a hairline border, 46px tall, 6px radius. Hover darkens or tints; press scales to 0.97; arrows nudge 3px on hover.

### Viewer (signature)
Dark frame with a mono status bar, a square stage, and a readout footer. Variants: compare slider (clip-path divider and round handle), layer explorer (segmented tabs, cross-fading layers, explanation line), depth probe (crosshair and live relative-depth readout with a colormap bar), one-time scan-line reveal on the hero.

### ECG monitor
A flat resting baseline with a dot that sweeps left to right across three beats on the shared cardiac clock. Three spikes sit at one sixth, one half and five sixths of the strip, and the dot crosses each at an R peak, in sync with the heart's contraction. Every beat gets a randomly generated PQRST shape (P, Q, R or a notched R, S and an upright or inverted T, each with random height and width). The trace lights up where the dot passes and fades behind it before the next sweep. Reduced motion shows one still complex.

### Results chart
Dataset and metric toggles over horizontal bars; SEAMLESS in teal, baselines in grey; a sentence states the improvement versus SHADeS.

### Cards
White, hairline border, 16px radius, soft shadow. Project and experience cards carry a semi-transparent background image that brightens on hover (the owner's explicit choice).
About side column: the full, uncropped lecture-hall photo (presenter and audience both in frame) above a CV panel that fills the remaining height: a 150px page-1 thumbnail with a soft offset shadow (lifts 2px on hover) beside "Curriculum Vitae", a one-line description, a mono "Updated Nov 2026 · PDF · 1 page" line, and View CV / Download buttons; stacked between 900 and 1199px.
Hero credential block (replaces the three pills): a 46px teal tile holding a white heart-pulse line icon (Lucide heart-pulse, 2px stroke) with a soft offset shadow beside two lines, "MSc Artificial Intelligence and Medical Imaging" in 16px semibold ink and "UCL · Medical Physics & Biomedical Engineering" in 14px ink-2; below it a single white availability chip with a green (#1f9d62) dot whose halo pulses every 2.4 s (static under reduced motion).
Reading measure: project-page prose paragraphs and lists cap at 62ch, experience descriptions at 66ch, table captions at 90ch. Equation boxes, the BibTeX block and results tables are keyboard-focusable labeled regions with a 2px accent focus outline. Abstract boxes carry no colored stripe; the viewer "live" dot has no glow (the scan-line light inside viewers keeps its glow).
Reading panels (`.panel`): the hero bio and the About "Who I am" and "How I work" blocks sit on the same white surface as cards (1px line border, large radius, shadow-1, 20 to 24px padding, no hover) so body text stays readable over the background hearts.

### Navigation
Fixed white bar, 64px, name with a reticle mark, four links with a drawing underline, an "Email me" button; under 860px a menu button opens a full-width list.

## Do's and Don'ts

### Do:
- **Do** show imaging work inside viewer frames, interactive where it explains something.
- **Do** highlight key results as metric chips with exact numbers.
- **Do** keep paper status exact: SEAMLESS is an IPCAI submission; SpatialMosaic is an arXiv preprint.
- **Do** keep figure and table captions in mono below figures.

### Don't:
- **Don't** use em dashes in site copy.
- **Don't** put text sections on dark grounds.
- **Don't** add colored side stripes to cards or callouts.
- **Don't** invent data in interactive pieces; probes and charts read only real outputs and published numbers.
