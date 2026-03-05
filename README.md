- 👋 Hi, I'm @MannyDelRioRPH
- 👀 I'm interested in generative AI, SQL, PowerBI
- 🌱 I'm currently learning Python and PowerApps
- 💞️ I'm looking to collaborate on VA related projects, however particularly those related to pharmacy

---

## LTX-2.3 Distilled FP8 — ComfyUI Workflow

`LTX-2.3_Distilled_FP8_T2V.json` is a two-stage text-to-video workflow for ComfyUI using the LTX-Video 2.3 model with FP8 precision and a spatial upscaler.

### Required Custom Nodes

Install all of the following via **ComfyUI Manager** before loading the workflow:

| Node | Package | Source |
|------|---------|--------|
| `UnetLoaderKJ` | **KJNodes** | [kijai/ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) |
| `LTXVEmptyAudioLatent` | **ComfyUI-LTXVideo** | [Lightricks/ComfyUI-LTXVideo](https://github.com/Lightricks/ComfyUI-LTXVideo) |
| `LTXVLatentUpscale` | **ComfyUI-LTXVideo** | [Lightricks/ComfyUI-LTXVideo](https://github.com/Lightricks/ComfyUI-LTXVideo) |
| `LTXVSplitAVLatent` | **ComfyUI-LTXVideo** | [Lightricks/ComfyUI-LTXVideo](https://github.com/Lightricks/ComfyUI-LTXVideo) |
| `VHS_VideoCombine` | **VideoHelperSuite** | [Kosinkadink/ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) |

> All four missing-node errors (`UnetLoaderKJ`, `LTXVEmptyAudioLatent`, `LTXVLatentUpscale`, `LTXVSplitAVLatent`) are resolved by installing the two packages above — **KJNodes** and **ComfyUI-LTXVideo**.

### Required Model Files

**Diffusion model → `models/diffusion_models/`**
- `ltx-2.3-22b-distilled_transformer_only_fp8_scaled.safetensors` (~23.5 GB)
  from [Kijai/LTX2.3_comfy](https://huggingface.co/Kijai/LTX2.3_comfy)

**Video VAE → `models/vae/`**
- `LTX23_video_vae_bf16.safetensors` (~1.45 GB)

**Audio VAE → `models/vae/`**
- `LTX23_audio_vae_bf16.safetensors` (~365 MB)

**Text projection → `models/text_encoders/`**
- `ltx-2.3_text_projection_bf16.safetensors` (~2.31 GB)

**Gemma-3 text encoder → `models/text_encoders/`**
```bash
cd models/text_encoders
git clone https://huggingface.co/google/gemma-3-12b-it-qat-q4_0-unquantized
```

**Spatial upscaler → `models/latent_upscale_models/`**
- `ltx-2.3-spatial-upscaler-x2.safetensors`
  from [Lightricks/LTX-2.3](https://huggingface.co/Lightricks/LTX-2.3)

### Recommended Sampling Settings (Distilled model)

| Setting | Stage 1 | Stage 2 |
|---------|---------|---------|
| Steps | 8 | 4 |
| Denoise | 1.0 | 0.35 |
| CFG | 1.0 | 1.0 |
| Sampler | euler | euler |
| Shift | 8.0 | 8.0 |

### Video Dimension Rules

- Width and Height must be divisible by **64**
- Frame count must satisfy **8n + 1** (e.g. 25, 33, 49, 65, **97**, 121 …)
- Stage 1 runs at **half the target resolution** — the x2 spatial upscaler doubles it in Stage 2

<!---
MannyDelRioRPH/MannyDelRioRPH is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->
