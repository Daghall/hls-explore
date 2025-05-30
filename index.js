"use strict";

const state = { views: [] };

async function getData(url) {
  const data = await fetch(url)
    .catch((error) => {
      process.stderr.write("Error fetching data:", error.message);
      throw error;
    });

  if (data.ok) {
    let lines;
    const allowedContentTypes = [
      "application/vnd.apple.mpegurl",
      "application/x-mpegurl",
      "text/plain",
    ];
    if (allowedContentTypes.includes(data.headers.get("content-type")?.toLowerCase())) {
      lines = (await data.text()).split(/\r?\n/).filter((line) => line.trim() !== "");
    } else {
      lines = [ `Unsupported Content-Type: ${data.headers.get("content-type") || "Unknown"}` ];
    }

    state.views.push({
      selectedRow: 0,
      lines,
    });
  }
}

function render(term) {
  const view = getView();
  term.clear();

  view.lines.forEach((line, i) => {
    term.moveTo(1, i + 1);
    let color = "Green";
    if (!isExpandable(line)) {
      color = "Gray";
    }
    if (view.selectedRow === i) {
      term.eraseLine();
      term[`bg${color}`].black(line.padEnd(term.width));
    } else {
      term.eraseLine();
      term.bgDefaultColor[color.toLowerCase()](line.padEnd(term.width));
    }
  });
}

(async () => {
  if (require.main === module) {
    if (!process.argv[2]) {
      process.stderr.write("Usage: hls-explore <url>\n");
      process.exitCode = 1;
      return;
    }

    state.url = process.argv.at(2);
    await getData(state.url);

    const term = require("terminal-kit").terminal;

    term.fullscreen();
    term.hideCursor();

    render(term);

    term.grabInput();
    term.on("key", async (key) => {
      const view = getView();

      switch (key) {
        case "ENTER":
        case "RETURN": {
          const line = view.lines[view.selectedRow].trim();
          if (!isExpandable(line)) return;

          const url = `${state.url
            .split("/")
            .slice(0, -1)
            .join("/")}/`;

          const filepath = getFilepath(line);

          await getData(url + filepath);
          break;
        }
        case "p": {
          const line = view.lines[view.selectedRow].trim();
          if (!isExpandable(line)) return;

          exit(term);
          const url = `${state.url}${line}`;
          process.stdout.write(`${url}\n`);
          return;
        }
        case "ESCAPE":
        case "q":
          state.views.pop();

          if (state.views.length === 0) {
            exit(term);
            return;
          }
          break;
        case "CTRL_C":
        case "Q":
          exit(term);
          return;
        case "DOWN":
        case "j":
          if (view.selectedRow < view.lines.length - 1) {
            ++view.selectedRow;
          }
          break;
        case "UP":
        case "k":
          if (view.selectedRow > 0) {
            --view.selectedRow;
          }
          break;
        case "TAB": {
          let index = view.selectedRow + 1;

          while (!isExpandable(view.lines.at(index))) {
            if (view.selectedRow < view.lines.length - 1) {
              ++index;
            } else {
              break;
            }
          }

          if (index <= view.lines.length - 1) {
            view.selectedRow = index;
          }
          break;
        }
        case "SHIFT_TAB": {
          let index = view.selectedRow - 1;

          while (!isExpandable(view.lines.at(index))) {
            if (view.selectedRow > 0) {
              --index;
            } else {
              break;
            }
          }

          if (index > 0) {
            view.selectedRow = index;
          }
          break;
        }
      }

      render(term);
    });
  }
})();

function getFilepath(line) {
  let filepath = line;

  if (line.match(/URI=/)) {
    const uriLine = line.split(",").filter((part) => part.startsWith("URI=")).shift();
    filepath = uriLine.split("URI=")[1].slice(1, -1);
  }
  return filepath;
}

function getView() {
  return state.views.at(-1);
}

function isExpandable(line) {
  if (!line) return;
  if (line.startsWith("Unsupported Content-Type")) return false;
  if (line.includes(" --> ")) return false;
  return !line.startsWith("#") || line.includes("URI=");
}

function exit(term) {
  term.fullscreen(false);
  term.clear();
  term.processExit();
}
