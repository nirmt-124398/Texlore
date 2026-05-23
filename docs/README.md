# ClassiRoute2 — System Architecture \& Design (Part 2)

> Part 1 (ML Core) is separate. This covers only the full-stack architecture, system design, and deployment.

## Structure

| File | Description |
|------|-------------|
| `main.tex` | Main LaTeX document (all chapters, references) |
| `figures/` | Place your images here (see below) |

## Required Figures

The document references the following images. Place them in `figures/`:

| Image File | Description |
|------------|-------------|
| `gndec_logo.png` | GNDEC logo (title page) |
| `system_architecture.png` | High-level system architecture diagram |
| `deployment_diagram.png` | Deployment diagram (Vercel, Render, PostgreSQL) |
| `routing_pipeline.png` | Prompt routing pipeline flow |
| `provider_adapter_uml.png` | UML class diagram for provider adapters |
| `er_diagram.png` | Entity-relationship diagram |
| `auth_flow.png` | Authentication flow diagram |
| `screenshot_dashboard.png` | Dashboard page screenshot |
| `screenshot_chat.png` | Chat playground screenshot |
| `screenshot_keys.png` | Keys management page screenshot |
| `screenshot_analytics.png` | Analytics page screenshot |
| `screenshot_analytics2.png` | Additional analytics visualizations |
| `db_users.png` | Users table in PostgreSQL |
| `db_keys.png` | Virtual keys table screenshot |
| `db_logs.png` | Request logs table screenshot |

## Compiling

```bash
cd reports
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

Or use your preferred LaTeX editor (Overleaf, TeXShop, etc.).
