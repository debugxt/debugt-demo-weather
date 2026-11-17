# Trip Weather — a demo for Debugt

Tell it where you are going, and it tells you what to pack. Three small Node services, no
dependencies, no Docker, no database — made to try [Debugt](https://debugt.com) in a few minutes:
one request, and you see it travel through all three services and out to a weather API, with
every line each service ran and the values it changed.

| Service | Port | Does |
|---|---|---|
| `planner` | 7070 | `GET /plan?city=Lisbon&days=3` — asks the other two, and decides what to pack, day by day |
| `geo` | 7071 | a city's name → where it is, from [Open-Meteo](https://open-meteo.com)'s geocoding API |
| `forecast` | 7072 | where → the next days' weather, from Open-Meteo's forecast API |

Open-Meteo needs no key.

## Try it

You need VS Code, Node 18 or later, and the
[Debugt extension](https://marketplace.visualstudio.com/items?itemName=debugt-labs.debugt-extension),
on macOS, Linux or Windows. Missing Node? On Windows, `winget install OpenJS.NodeJS.LTS`; on
macOS, `brew install node`; on Ubuntu, `sudo snap install node --classic`. And Debugt, from the
command line: `code --install-extension debugt-labs.debugt-extension`.

```bash
git clone https://github.com/debugxt/debugt-demo-weather.git
code debugt-demo-weather
```

If VS Code asks whether you trust the authors of the files in this folder, choose **Yes, I trust
the authors**: Debugt does not run in Restricted Mode. Then, in Debugt:

1. It asks whether to use the setup this repo ships — choose **Use it**. The **Trip Weather**
   canvas appears, with the three services on it.
2. Press **Run all**.
3. Open **Requests → planner → plan Lisbon**, and press **Send**.

The answer is the plan. The trace beside it is the request's journey: `planner` calling `geo`
and `forecast`, and each of those calling Open-Meteo. Open a hop to see what was sent and
answered, and its execution to see the code that ran — `packFor` deciding, day by day, between
an umbrella and sunscreen, with the numbers it decided on.

## Things to try

- **Make it storm.** On the canvas, open `forecast`'s details, go to URL overrides, and switch on
  **Storm everywhere**. Send again: Debugt answers for Open-Meteo with a week of storms, and the
  plan asks for an umbrella, a warm jacket and a windbreaker. The forecast never left your machine.
- **Ask for somewhere that isn't.** **plan nowhere** asks for a city that does not exist: see
  where the error starts, and how it travels back.
- **Ask each service on its own.** **geo → find a city** and **forecast → forecast Lisbon** call
  one service directly.

## If something fails

| What you see | Why |
|---|---|
| The project is not in Debugt | VS Code opened the folder in Restricted Mode, where Debugt does not run. Trust it: **Manage** (the gear) → **Trust**, or click **Restricted Mode** in the status bar. |
| `fetch failed`, or the forecast service answering 502 | Open-Meteo could not be reached from your network. Switch on **Storm everywhere** (above) and Debugt answers in its place. |
| **Run all** is greyed out | Another canvas has services running: stop them, or pick that canvas again. |
| A port is in use | Something else listens on 7070, 7071 or 7072: change `PORT` in `.vscode/launch.json`, and the service's host in Debugt. |

## Without Debugt

Each service runs on its own — `node planner/server.js`, and the same for `geo` and `forecast` —
or all three from VS Code's Run and Debug view, as **Trip Weather**.

## Licence

MIT — see [LICENSE](LICENSE).
