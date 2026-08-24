# RouterAI-first migration TODO

## Catalog and routing

- [x] Make RouterAI the first route for every catalog model with a confirmed compatible API contract.
- [x] Preserve user-facing model names and Telegram callback IDs when only the provider ID changes.
- [x] Add explicit aliases for YandexGPT, Seedance, Seedream, Veo, Kling 3 and Wan models.
- [x] Keep existing public cards and copy unchanged while replacing confirmed Polza routes with RouterAI equivalents.
- [x] Keep all Suno cards available; retain specialist Polza/KIE routes where RouterAI has no confirmed executable contract.
- [x] Remove obsolete superseded model cards instead of presenting old versions as current models.
- [x] Add the selected current RouterAI image, video and speech models.

## Agents, tools and workflows

- [x] Audit every agent backend and route compatible LLM/image calls through RouterAI.
- [x] Audit every tool and workflow against RouterAI input/output contracts.
- [x] Route compatible tools through RouterAI; retain specialist routes only where RouterAI cannot execute the same contract.
- [x] Prevent silent fallback to an incompatible provider or model.

## Bot and CRM parity

- [x] Keep Telegram cards, bold emphasis and navigation intact after catalog changes.
- [x] Regenerate the CRM product manifest from the bot catalogs.
- [x] Remove retired cards from both the bot and CRM.
- [x] Add new RouterAI cards to both the bot and CRM.
- [x] Verify the restored inventory matches across both products: 404 provider-backed models, plus 42 bot tools.

## Economics and release

- [x] Add routing, alias, catalog and presentation regression tests before implementation.
- [x] Run bot unit/integration tests and CRM unit/build/site tests.
- [x] Verify no API key or credential is serialized into catalog or CRM responses.
- [x] Derive every public product's provider allocation from the production ledger: 3.5% acquiring fee, 6% Polza specialist reserve, 50.5% RouterAI reserve and 40% owner share before any referral liability.
- [x] Reserve a 2% RouterAI tail inside the 50.5% allocation and fail closed if a product cannot cover the maximum granted metacoin liability.
- [x] Add an offline report and regression test for all four packages and eight tariff offers.
- [ ] Refresh the public RouterAI price snapshot immediately before the release; review any newly added/removed public model IDs.
- [ ] Deploy bot, CRM and funding worker, then check production health and catalog counts without creating payment, funding or generation side effects.
