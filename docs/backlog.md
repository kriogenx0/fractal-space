# Fractal Space backlog

Updated: 2026-10-30. Priorities reflect the preference for mathematical,
fractal, topology, and physics experiments. Unchecked items are open;
proposed experiments below are ideas, not claims that a source has been ported.

## Current baseline

- 72 public experiments, including 28 Levitated adaptations/recreations.
- Spectrum analyzer shipped in `f0c4123`: microphone, local files, test tones,
  logarithmic spectrum, waveform, waterfall, measurements, freeze, and PNG export.
  Docker checks and CI passed; 95 live pages/assets matched the release.
  Audio-device behavior has automated mocks, not a completed real-browser test.
- Orbit Breach adds the first polygon game, with three arenas/difficulties,
  keyboard/touch steering, pause, and local best times. Real-device playtesting
  remains open in FS-014.
- Grass / wind adds cursor/touch brushing, spring recovery, occasional wind
  fronts, manual gusts, five palettes, and paused/reduced-motion interaction.
- Liquid cursor, terrain, ripple plane, ball drop, topology constructions,
  pendulums, orbital gravity, Fibonacci sculpture, and rotating 3D drawing exist.
- Index filters, the Sound/Games tags, site themes, expanded parameters, SEO metadata,
  share images, Docker/Make tasks, and GitHub App deployment are implemented.

## P0 — Verify the new interactive experiments

- [ ] **FS-001 — Exercise actual browser audio inputs.**
  Test desktop Chrome, Firefox, and Safari, plus iOS Safari and Android Chrome
  where devices are available. Confirm test tones produce the expected harmonic
  patterns; local audio files play, pause, seek, finish, and fail gracefully for
  unsupported codecs. Check a real microphone, denied permission, a permission
  request completed after Stop, device disconnection, source switching, and tab
  hiding/page exit. Confirm the microphone never plays through speakers and its
  capture indicator turns off after stopping. Check both views, reduced motion,
  frozen controls, high-density mobile labels, and PNG export.
  **Done when:** the browser/device results and any remaining limitations are
  recorded, and reproducible failures are fixed.

- [ ] **FS-014 — Play-test Orbit Breach on real devices.** Check keyboard and
  multi-touch response, readable gaps, collision feedback, window/tab pause,
  reduced motion, and best times across all modes. Tune the difficulty ramp
  from human play; the automated simulated player verifies reachability, not
  how challenging or enjoyable the game feels.

## P1 — Continue the requested research and ports

- [ ] **FS-002 — Find the next Levitated math experiments.**
  Compare the published collection with the 28 existing works in
  `dist/levitated/experiments.js`. Make a shortlist of unimplemented mathematical
  or geometric experiments, with an original page, source archive if available,
  algorithm notes, and source/asset license terms. Prefer new behavior over a
  variation of an existing card. Implement the strongest candidates in small
  batches with source credits, numerical checks, controls, and real previews.
  **Done when:** the next shortlist and selected ports are documented and shipped.

- [ ] **FS-003 — Consolidate the physics references into a port shortlist.**
  The references supplied in the conversation still need a tracked comparison
  against the current catalog:

  | Reference | Next action |
  | --- | --- |
  | **physicsandbox.com** — confirmed by the user | Revisit its available experiments; compare its double pendulum with ours before proposing a duplicate. |
  | Physics Hub / `OpenPsiMu/ThePhysicsHub` | Evaluate coupled/elastic pendulums and string-wave ideas; confirm current source terms. |
  | myPhysicsLab | Coupled oscillators and Brachistochrone race shipped as original implementations; compare inverted pendulums and trammel mechanisms next. |
  | PhET (the earlier “fet” reference) | Identify specific simulations and eligible source versions; choose original implementations where appropriate. |
  | oPhysics | Standing-wave resonance shipped as an original implementation; shortlist optics or other distinct mechanics next. |
  | Algodoo | Scope a small browser physics sandbox or mechanism experiment from the reference. |
  | phyphox | Assess microphone and phone-sensor experiments, including browser availability and permission UX. |
  | Universe Sandbox | Scope gravitational interactions beyond the current independent planets orbiting a fixed central star. |

  **Done when:** each selected candidate has an equation/algorithm, the behavior
  to reproduce, provenance, and a clear difference from an existing experiment.
  Reference-site availability and license claims must be verified when selecting
  a port; this table does not establish that their code or assets can be reused.

- [ ] **FS-004 — Continue the GitHub ActionScript math search.**
  Search `.as` sources and Flash archives for fractals, attractors, L-systems,
  subdivision, implicit surfaces, and mathematical mechanisms. Record useful
  repositories and original author/license information alongside FS-002/003.
  **Done when:** reusable candidates or sufficiently described algorithms have
  a reproducible reference and a JavaScript implementation plan.

- [ ] **FS-005 — Review zoomingfractal.com for a dedicated zoom experiment.**
  Record the interaction and visual behavior worth exploring. Compare it with
  our existing Julia/Newton zoom controls. Scope continuous Mandelbrot-style
  deep zoom, including numerical precision and performance, if that adds a
  distinct experiment. Inspect source/asset terms before reusing anything.
  **Done when:** the reference review and a concrete design are recorded;
  implementation follows from that design.

## P2 — Proposed experiments to choose from

These extend the user's interest in mathematical and physics experiments;
checked items have shipped; unchecked designs remain candidates.

- [x] **FS-006 — Coupled oscillators and beats.** Shipped two linked unit masses,
  coupling/damping/stiffness controls, three releases, exact normal modes,
  displacement curves, and energy exchange. Optional audible mapping remains
  a future sound experiment under FS-010; this experiment produces no audio.
- [x] **FS-007 — Standing waves and resonance.** Shipped a fixed-end string
  mode, nodes/envelope, exact driven gain/phase, response graph, damping, wave
  speed, and readable slow playback at high frequencies. This single-mode
  model has a matched spatial drive; arbitrary plucking/audio remain future work.
- [x] **FS-008 — Chladni-style nodal patterns.** Shipped square cosine modes,
  adjustable mix/population, vector nodal contours, seeded grain relaxation,
  and local stirring. The explanation distinguishes idealized modes and
  heuristic grains from a full elastic-plate/sand solver.
- [ ] **FS-009 — Interacting orbital gravity.** Add mutual gravitational forces,
  masses, softening, collision behavior, and conservation readouts. Keep the
  current central-star experiment as a separate, simpler model.
- [ ] **FS-010 — More sound experiments.** Consider a scrolling spectrogram,
  harmonic/additive synthesis, Lissajous/phase plots, and audio-reactive fractals
  or terrain. Use the existing audio engine and explicit start/stop controls.

- [ ] **FS-015 — More polygon games.** Choose another distinct mechanic:
  polygon breakout with a rotating paddle, a reflection/laser maze, or a
  geometric territory-capture game. Orbit Breach is already implemented;
  these are proposed follow-ups.

## Reference work shipped

- **Coupled oscillators:** spring experiments motivated by myPhysicsLab's
  [Double Spring](https://www.myphysicslab.com/springs/double-spring-en.html),
  with the symmetric two-wall normal-mode arrangement documented in
  [MIT-hosted notes](https://www.mit.edu/~ashrstnv/coupled-oscillators.html).
  Our boundary conditions differ from Double Spring's free right end.
- **Chladni study:** the cosine-mode model and its limits follow the discussion
  in Linqi Shao's [Waterloo report](https://uwaterloo.ca/computational-mathematics/sites/default/files/uploads/documents/linqi_shao_report_pdf_1.pdf).
  This is an original mathematical visualization, not a source-code port.
- **Standing-wave resonance:** [oPhysics string modes](https://ophysics.com/waves6.html)
  and [PhET's Wave on a String](https://phet.colorado.edu/en/simulations/wave-on-a-string)
  motivate a distinct, exact selected-mode gain/phase visualization.
- **Brachistochrone race:** [myPhysicsLab's reference](https://www.myphysicslab.com/roller/brachistochrone-en.html)
  motivates an original three-track comparison with adjustable endpoints.
- [x] **FS-017 — Brachistochrone race.** Shipped cycloid, straight-line and
  parabola tracks, common gravity, exact/energy-derived timing, endpoint drags,
  playback controls and numerical quadrature checks.
- These use original MIT-licensed JavaScript, with numerical and controller
  checks and actual-renderer thumbnails. Real-device play/visual checks for
  this batch remain part of FS-011.

## P2 — Collection maintenance

- [ ] **FS-011 — Test expanded controls on actual devices.** Check the expensive
  fractal/recursive endpoints, maximum populations, ripple settings, and Canvas
  scenes on phones and lower-power GPUs. Record frame-time/memory issues and
  bound work or adapt rendering resolution while preserving parameter meaning.
- [ ] **FS-012 — Refresh older README examples.** Earlier sections still say
  nineteen shared math works and list superseded ranges for Möbius twists,
  Sierpiński/Koch depths, and Fibonacci terms. Align them with the current
  catalogs; keep a concise current inventory rather than relying on append-only
  feature notes.
- [ ] **FS-013 — Confirm Search Console status.** Check whether domain ownership
  is verified and the current sitemap has been submitted. Review indexing and
  canonical reports after new pages are discovered. This account-side state is
  not established by the repository's SEO tests.

- [ ] **FS-016 — Adaptive rendering quality.** Some experiments stretch a small
  internal render across the viewport: Liquid cursor caps its longest edge at
  400 pixels; Newton basins caps width at 440 pixels; the Mandelbulb GPU canvas
  caps its longest edge at 860 pixels. These performance limits can look blurry
  or pixelated on large or high-density screens. Reaction–diffusion also has a
  deliberately coarse simulation grid, which needs separate treatment from
  display resolution.
  **Done when:** measure the expensive renderers, use fast rendering during
  interaction and progressively sharpen settled/paused views, and offer sharper
  PNG exports where practical. Verify large/Retina screens and lower-power
  devices; preserve simulation state and avoid unconditionally raising every
  resolution cap. This is tracked work, not an implemented quality improvement.

## Requirements for every new experiment

- Preserve index order: Mandelbulb first; new cards follow it; Dream Strata
  stays out of the main list; Invader Fractal and Tandava parallax stay last.
- Add useful, overlapping filter tags and update the visible index count.
- Support the theme, keyboard/touch controls, clear parameter explanations,
  reduced motion, and bounded computation. Audio starts only after user action.
- Generate a thumbnail from the actual renderer and update page metadata,
  share preview, sitemap, and licensing/provenance notes.
- Run the relevant mathematical/interaction checks and `make test` before a
  push. Regenerate SEO with `make seo` when pages/catalogs/previews change.
- Push to `main` for the existing Coolify GitHub App deployment; verify the
  public release. Do not add SSH or a second deployment trigger.
