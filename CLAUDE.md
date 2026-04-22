# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **.NET 10 / Blazor Server** scaffold intended to host an Arkanoid game proof-of-concept. The gameplay itself is **not yet implemented** — only the hosting shell exists. The design spec lives in `docs/arcanoid_poc.md` (controls: A/D to move paddle, Space to launch; 6 bricks in one line; black background; random first-hit angle -45°..+45°). `Home.razor` is still the default "Hello, world!" page, and `MainLayout.razor` links to routes (`/How_it_works`, `/Demo`) that do not exist yet — expect to add these when implementing.

## Solution layout

The solution uses the new **`.slnx` XML solution format** (`ArcanoidTest.slnx`) with two projects:

- **`Library/`** — shared utility code consumed by `Web` via `ProjectReference`. Hosts `Library.Extensions` (static class) with cross-cutting helpers:
  - `AllConfigurationKeys` / `LogStrings` — flattens `IConfigurationRoot` for startup diagnostics (walks providers in reverse to get the effective value).
  - `AddOpenTelemetry` — conditionally wires Azure Monitor + OTLP exporter **only if** `APPLICATIONINSIGHTS_CONNECTION_STRING` is set (safe for local dev without Aspire).
  - `MapDefaultEndpoints` — adds `/livez`, `/uptime`, `/error` to any `WebApplication`. Uptime is computed against a `DateTimeOffset applicationStartTime` captured in `Program.Main` before the builder runs.
  - `ToAzureBlobSafeName` — sanitizer for Azure Blob Storage naming rules.
- **`Web/`** — ASP.NET Core **Blazor Server** (`Microsoft.NET.Sdk.Web`, `<BlazorDisableThrowNavigationException>true</BlazorDisableThrowNavigationException>`) using **MudBlazor 9.3** for UI chrome. Renders with `InteractiveServer` mode (see `App.razor` — both `HeadOutlet` and `Routes` set `@rendermode="InteractiveServer"`).

There is **no test project** — adding tests means creating a new project and referencing it from `ArcanoidTest.slnx`.

## Program startup flow (Web/Program.cs)

The startup is unusual — read it before changing it:

1. A **Serilog bootstrap logger** is created first (console only) so failures during configuration loading are logged.
2. Configuration is **built twice**: once manually (`ConfigurationBuilder` + `appsettings.json` + `appsettings.{DOTNET_ENVIRONMENT}.json` + env vars) to materialize `Settings` early and dump every effective key via `AllConfigurationKeys().LogStrings()`, then again implicitly by `WebApplication.CreateBuilder(args)`. The first pass reads `DOTNET_ENVIRONMENT`, not `ASPNETCORE_ENVIRONMENT`.
3. Real Serilog is attached by re-reading `builder.Configuration` (so `Serilog` section in `appsettings.json` wins).
4. `Settings` (strongly-typed, bound from `Settings` section) is registered as a singleton; an `AzureOpenAIClient` is registered using `Settings.AzureOpenAI.{Endpoint, ApiKey}`.
5. Note the inverted exception-page guard: `if (!app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();` — this is likely a bug. If you touch this block, confirm intent with the user before "fixing" it.
6. `MapDefaultEndpoints(applicationStartTime)` is called from `Library` to add the health/uptime endpoints.

## Configuration & secrets

- `Settings` section in `appsettings.json` binds to `Web.Settings` (`Environment`, `AzureOpenAI { Endpoint, ApiKey, DeploymentNameChat }`). Missing section throws at startup.
- The committed `ApiKey` is literally `"dummy"` — override via `appsettings.Development.json` (git-ignored: `.gitignore` excludes `appsettings.Development*.json`) or env vars (`Settings__AzureOpenAI__ApiKey=...`).
- Kestrel binds **port 8089** (set in `appsettings.json` under `Kestrel:EndPoints:Http`). Dockerfile `EXPOSE`s the same port; `launchSettings.json` uses it for both `http devel` and the `Container prod` profile.
- `DOTNET_ENVIRONMENT` (not `ASPNETCORE_ENVIRONMENT`) selects the env-specific `appsettings.{Env}.json` file in the manual config pass.

## Common commands

```bash
# Restore + build the whole solution
dotnet build ArcanoidTest.slnx

# Run the web app (hot reload during development)
dotnet watch --project Web

# Run the web app without watch (uses "http devel" launch profile)
dotnet run --project Web

# Publish a release build
dotnet publish Web/Web.csproj -c Release -o out

# Build the container image (Dockerfile lives in Web/ but expects solution-root context)
docker build -f Web/Dockerfile -t arcanoid-web .

# Run the container (exposes port 8089)
docker run --rm -p 8089:8089 arcanoid-web
```

All URLs default to `http://localhost:8089`. Health endpoints: `/livez`, `/uptime`, `/info`.

## Conventions worth preserving

- **`Nullable`** and **`ImplicitUsings`** are enabled on both projects — keep new files null-aware.
- Logging goes through **Serilog** (`Serilog.Log.Information(...)`), not `Microsoft.Extensions.Logging` directly, in startup code. Inside Razor components / DI-resolved services, prefer the injected `ILogger<T>`.
- MudBlazor services are registered via `AddMudServices()`; providers (`MudThemeProvider`, `MudPopoverProvider`, `MudDialogProvider`, `MudSnackbarProvider`) live in `MainLayout.razor`. Dark-mode preference is persisted to browser `localStorage` via `IJSRuntime` — any new theme toggle should reuse that mechanism.
- Razor `@using` directives are centralized in `Web/Components/_Imports.razor`; add shared namespaces there rather than per-file.

## Development Rules

### Test-Driven Development

Always follow TDD: write a failing test first, verify it fails for the right reason, then write the minimal production code to make it pass. Never write production code before a failing test exists. Delete any production code written before its test and start over.

## Project Instructions

### Context7 Integration

Always use Context7 MCP when I need library/API documentation, code generation, setup, or configuration steps without me having to explicitly ask.

### Plan Step

When the user asks to "plan a step" (or equivalent phrasing like "add a step", "create a step"):
1. Add the step to `docs/plans/steps.md` — a new row in the table and a full detail section at the bottom.
2. Create a GitHub project item in the ArcanoidTest project with title "Step-N Short description", a short description body, and status set to Backlog.

Both actions are always done together, without the user having to ask for each separately.

### GitHUb integration

When creating items in GitHub always use ArcanoidTest GitHub project. Create items in Backlog and give a name to each item "Step-number short description". Add a short description to each item. Try to figure out what was the latest used step number in the current session and add +1 to each step.

When the user asks to work on a Step:
1. Create a dedicated GitHub branch named after the step (e.g. `Step-1-Create-AccountSnapshot-data-model`)
2. Move the corresponding GitHub project item to "In-progress" state
3. Do all coding on that branch

When programming is done:
1. Move the GitHub project item to "In-review" state
2. Create a Pull Request for the branch — the user will approve and merge it; never merge it yourself

When the user asks to check if a PR is approved:
1. Check PR review status with `gh pr view <number> --json reviewDecision,mergeStateStatus`
2. If approved and merged: switch to `main`, pull latest, delete the local and remote feature branch, move the GitHub project item to "Done" state, then remind the user to run `/compact`
3. If not yet approved: report the current status and wait for the user to ask again
