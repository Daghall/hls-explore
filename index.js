"use strict";

const state = {};
let processObject;

module.exports = async function run(term, _processObject) {
  processObject = _processObject;
  const { argv } = processObject;
  state.views = [];
  state.cache = new Map();
  const url = argv[2];

  if (!url) {
    processObject.stderr.write("Usage: hls-explore <url>\n");
    processObject.exitCode = 1;
    return;
  } else if (!isValidUrl(url)) {
    processObject.stderr.write("The provided URL is not valid.\n");
    processObject.exitCode = 2;
    return;
  }

  state.url = url;
  await getData(state.url);

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

        const baseUrl = `${state.url
          .split("/")
          .slice(0, -1)
          .join("/")}/`;

        const filepath = getFilepath(line);

        await getData(baseUrl + filepath);
        break;
      }
      case "p": {
        const line = view.lines[view.selectedRow].trim();
        if (!isExpandable(line)) return;

        exit(term);
        const baseUrl = `${state.url
          .split("/")
          .slice(0, -1)
          .join("/")}/`;
        const filepath = getFilepath(line);
        processObject.stdout.write(`${baseUrl + filepath}\n`);
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
};

const allowedContentTypes = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/x-mpegurl",
  "audio/mpegurl",
  "text/plain",
];

async function getData(url) {
  let lines;

  if (state.cache.has(url)) {
    lines = state.cache.get(url);
    state.views.push({
      selectedRow: 0,
      lines,
    });
    return;
  }

  const contentType = await getContentType(url);
  if (allowedContentTypes.includes(contentType?.toLowerCase())) {
    const data = await fetch(url)
      .catch((error) => {
        processObject.stderr.write("Error fetching data:", error.message);
        throw error;
      });

    if (data.ok) {
      lines = (await data.text()).split(/\r?\n/).filter((line) => line.trim() !== "");
      state.cache.set(url, lines);
    }
  } else {
    lines = [ `Unsupported Content-Type: ${contentType}` ];
  }

  state.views.push({
    selectedRow: 0,
    lines,
  });
}

async function getContentType(url) {
  const data = await fetch(url, { method: "HEAD" });
  const contentType = data.headers.get("content-type");
  return contentType;
}

function render(term) {
  const view = getView();
  term.clear();

  view.lines.forEach((line, i) => {
    term.moveTo(1, i + 1);
    const color = isExpandable(line) ? "Green" : "Gray";

    if (view.selectedRow === i) {
      term.eraseLine();
      term[`bg${color}`].black(line.padEnd(term.width));
    } else {
      term.eraseLine();
      term.bgDefaultColor[color.toLowerCase()](line.padEnd(term.width));
    }
  });
}

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

function isValidUrl(url) {
  return URL.canParse(url);
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
