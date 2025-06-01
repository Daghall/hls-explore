"use strict";

const fs = require("fs");
const nock = require("nock");
const { expect } = require("chai");
const hlsExplore = require("../index.js");

const playlistUrl = "http://example.com/playlist.m3u8";

const mockTerminal = {
  _lines: [],
  _sendKey: async () => {},
  _exit: false,
  fullscreen() {},
  clear() {
    this._lines.length = 0;
  },
  hideCursor() {},
  grabInput() {},
  on(_, callback) {
    this._sendKey = callback;
  },
  exit() {},
  moveTo() {},
  eraseLine() {},
  processExit() {
    this._exit = true;
  },
  bgGray: { black: storeText.bind(null, "gray/black ") },
  bgGreen: { black: storeText.bind(null, "green/black") },
  bgDefaultColor: {
    gray: storeText.bind(null, "gray       "),
    green: storeText.bind(null, "green      "),
  },
};

function storeText(color, text) {
  mockTerminal._lines.push({ color, text });
}

const playlist = fs.readFileSync("./test/data/playlist.m3u8", "utf8");
const chunklist = fs.readFileSync("./test/data/chunklist", "utf8");
const subtitleList = fs.readFileSync("./test/data/subtitle_list", "utf8");
const webvtt = fs.readFileSync("./test/data/webvtt", "utf8");

const playlistPath = "/playlist.m3u8";
const chunklistPath = "/chunklist_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8";
const mediaPath = "/media_b1500000_0.ts";
const subtitleListPath = "/subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8";
const subtitleChunkPath = "/subtitlechunk_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==_0.webvtt";

const argv = [ "", "hls-explore", playlistUrl ];

Feature("HLS explore", () => {
  beforeEachScenario(() => {
    mockTerminal._lines.length = 0;
    mockTerminal._exit = false;
  });

  afterEachFeature(() => {
    expect(nock.pendingMocks()).to.deep.equal([]);
  });

  Scenario("Typical use case", () => {
    Given("the HLS files are available", () => {
      mockHeadAndGet(playlistPath, playlist, "application/vnd.apple.mpegurl");
      mockHeadAndGet(chunklistPath, chunklist, "application/vnd.apple.mpegurl");
      nock("http://example.com")
        .head(mediaPath)
        .reply(200, null, { "Content-Type": "video/MP2T" });
      mockHeadAndGet(subtitleListPath, subtitleList, "application/vnd.apple.mpegurl");
      mockHeadAndGet(subtitleChunkPath, webvtt, "text/plain");
    });

    When("running the program", async () => {
      await hlsExplore(mockTerminal, { argv });
    });

    Then("text should have been printed", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray/black ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1500000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=5000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=3500000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=250000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
      ]);
    });

    When("trying to expand a non-expandable row", () => {
      return mockTerminal._sendKey("ENTER");
    });

    Then("nothing should have happened", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray/black ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1500000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=5000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=3500000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=250000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
      ]);
    });

    When("moving down two rows", async () => {
      await mockTerminal._sendKey("j");
      await mockTerminal._sendKey("DOWN");
    });

    Then("the third row should be highlighted", () => {
      expect(mockTerminal._lines[2]).to.deep.equal({
        color: "green/black",
        text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"",
      });
    });

    When("moving to the next expandable row", async () => {
      await mockTerminal._sendKey("TAB");
    });

    Then("the fifth row should be highlighted", () => {
      expect(mockTerminal._lines.filter((line) => line.color === "green/black")).to.have.length(1);
      expect(mockTerminal._lines[4]).to.deep.equal({
        color: "green/black",
        text: "chunklist_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8",
      });
    });

    When("moving up two rows", async () => {
      await mockTerminal._sendKey("k");
      await mockTerminal._sendKey("UP");
    });

    Then("the third row should be highlighted", () => {
      expect(mockTerminal._lines[2]).to.deep.equal({
        color: "green/black",
        text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"",
      });
    });

    When("moving back to the next expandable row", async () => {
      await mockTerminal._sendKey("TAB");
    });

    And("expanding the chunklist", async () => {
      await mockTerminal._sendKey("ENTER");
    });

    Then("the screen should show the chunklist", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray/black ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "gray       ", text: "#EXT-X-TARGETDURATION:10" },
        { color: "gray       ", text: "#EXT-X-MEDIA-SEQUENCE:0" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_0.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_1.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_2.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_3.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_4.ts" },
        { color: "gray       ", text: "#EXTINF:4.144," },
        { color: "green      ", text: "media_b1500000_5.ts" },
        { color: "gray       ", text: "#EXT-X-ENDLIST" },
      ]);
    });

    When("moving to the second expandable row", async () => {
      await mockTerminal._sendKey("TAB");
      await mockTerminal._sendKey("TAB");
    });

    Then("the correct row should be selected", () => {
      expect(mockTerminal._lines.filter((line) => line.color === "green/black")).to.have.length(1);
      expect(mockTerminal._lines[7]).to.deep.equal({
        color: "green/black",
        text: "media_b1500000_1.ts",
      });
    });

    When("moving to the previous expandable row", async () => {
      await mockTerminal._sendKey("SHIFT_TAB");
    });

    Then("the first expandable row should be selected", () => {
      expect(mockTerminal._lines.filter((line) => line.color === "green/black")).to.have.length(1);
      expect(mockTerminal._lines[5]).to.deep.equal({
        color: "green/black",
        text: "media_b1500000_0.ts",
      });
    });

    When("trying to expand the chunk", async () => {
      await mockTerminal._sendKey("ENTER");
    });

    Then("an error message should be present", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray/black ", text: "Unsupported Content-Type: video/MP2T" },
      ]);
    });

    When("going back one step", async () => {
      await mockTerminal._sendKey("q");
    });

    Then("the previous view should be rendered", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray       ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "gray       ", text: "#EXT-X-TARGETDURATION:10" },
        { color: "gray       ", text: "#EXT-X-MEDIA-SEQUENCE:0" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green/black", text: "media_b1500000_0.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_1.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_2.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_3.ts" },
        { color: "gray       ", text: "#EXTINF:10.0," },
        { color: "green      ", text: "media_b1500000_4.ts" },
        { color: "gray       ", text: "#EXTINF:4.144," },
        { color: "green      ", text: "media_b1500000_5.ts" },
        { color: "gray       ", text: "#EXT-X-ENDLIST" },
      ]);
    });

    When("backing up one more step", async () => {
      await mockTerminal._sendKey("q");
    });

    Then("the first view should be loaded again", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray       ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1500000,SUBTITLES=\"subs\"" },
        { color: "green/black", text: "chunklist_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=5000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b5000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=3500000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b3500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=1000000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b1000000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
        { color: "green      ", text: "#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID=\"subs\",NAME=\"Svenska\",FORCED=NO,AUTOSELECT=YES,URI=\"subtitlelist_lswe_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\",LANGUAGE=\"swe\"" },
        { color: "gray       ", text: "#EXT-X-STREAM-INF:BANDWIDTH=250000,SUBTITLES=\"subs\"" },
        { color: "green      ", text: "chunklist_b250000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8" },
      ]);
    });

    When("moving to the first subtitle row, and expanding it", async () => {
      await mockTerminal._sendKey("SHIFT_TAB");
      await mockTerminal._sendKey("ENTER");
    });

    Then("The subtitle list should be displayed", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "gray/black ", text: "#EXTM3U" },
        { color: "gray       ", text: "#EXT-X-VERSION:3" },
        { color: "gray       ", text: "#EXT-X-TARGETDURATION:250" },
        { color: "gray       ", text: "#EXT-X-MEDIA-SEQUENCE:0" },
        { color: "gray       ", text: "#EXTINF:54.144," },
        { color: "green      ", text: "subtitlechunk_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==_0.webvtt" },
        { color: "gray       ", text: "#EXT-X-ENDLIST" },
      ]);
    });

    When("moving to the subtitle chunk, and expanding it", async () => {
      await mockTerminal._sendKey("TAB");
      await mockTerminal._sendKey("ENTER");
    });

    Then("The subtitles should be displayed", () => {
      expect(mockTerminal._lines).to.deep.equal([
        { color: "green/black", text: "WEBVTT" },
        { color: "green      ", text: "X-TIMESTAMP-MAP=MPEGTS:0,LOCAL:00:00:00.000" },
        { color: "gray       ", text: "00:00:00.000 --> 00:00:03.870" },
        { color: "green      ", text: "Folk är verkligen panikslagna eftersom" },
        { color: "green      ", text: "de inte vet om de kommer kunna" },
        { color: "gray       ", text: "00:00:04.010 --> 00:00:06.750" },
        { color: "green      ", text: "komma tillbaka nästa termin, eller om" },
        { color: "green      ", text: "campus kommer att se likadant ut." },
        { color: "gray       ", text: "00:00:07.090 --> 00:00:11.510" },
        { color: "green      ", text: "Tvisten mellan Harvard och Trump" },
        { color: "green      ", text: "fortsätter efter att skolan vägrade krav" },
        { color: "gray       ", text: "00:00:11.510 --> 00:00:13.720" },
        { color: "green      ", text: "på bland annat mindre mångfaldsarbete." },
        { color: "gray       ", text: "00:00:14.430 --> 00:00:18.820" },
        { color: "green      ", text: "Den senaste smällen kom när Trump förbjöd" },
        { color: "green      ", text: "skolan att ta emot internationella" },
        { color: "gray       ", text: "00:00:18.820 --> 00:00:23.230" },
        { color: "green      ", text: "studenter, ett beslut som tillfälligt" },
        { color: "green      ", text: "stoppats av en federal domare." },
        { color: "gray       ", text: "00:00:23.640 --> 00:00:27.690" },
        { color: "green      ", text: "Svenske Leo Gerdén har studerat" },
        { color: "green      ", text: "vid universitetet i fyra år." },
        { color: "gray       ", text: "00:00:27.690 --> 00:00:30.510" },
        { color: "green      ", text: "Utan internationella studenter" },
        { color: "green      ", text: "är Harvard inte Harvard." },
        { color: "gray       ", text: "00:00:31.320 --> 00:00:36.570" },
        { color: "green      ", text: "Harvard lever på att kunna samla de" },
        { color: "green      ", text: "bästa och smartaste från hela världen," },
        { color: "gray       ", text: "00:00:36.710 --> 00:00:39.200" },
        { color: "green      ", text: "sätta oss i samma matsalar" },
        { color: "green      ", text: "och i samma klassrum." },
        { color: "gray       ", text: "00:00:39.650 --> 00:00:43.340" },
        { color: "green      ", text: "På torsdagen var det" },
        { color: "green      ", text: "examensceremoni, där oron för" },
        { color: "gray       ", text: "00:00:43.340 --> 00:00:45.280" },
        { color: "green      ", text: "Trumps hot har präglat stämningen." },
        { color: "gray       ", text: "00:00:45.670 --> 00:00:48.850" },
        { color: "green      ", text: "Jag tycker att det hänger" },
        { color: "green      ", text: "över hela examensveckan" },
        { color: "gray       ", text: "00:00:49.140 --> 00:00:53.570" },
        { color: "green      ", text: "eftersom vi lämnar en plats som" },
        { color: "green      ", text: "kanske inte är densamma nästa termin." },
      ]);
    });

    When("closing the app", async () => {
      await mockTerminal._sendKey("Q");
    });

    Then("the process should have ended", () => {
      expect(mockTerminal._exit).to.equal(true);
    });
  });

  Scenario("Backing from the first view exists", () => {
    Given("the HLS files are available", () => {
      nock("http://example.com")
        .get("/playlist.m3u8")
        .reply(200, playlist, { "Content-Type": "application/vnd.apple.mpegurl" });
    });

    When("running the program", async () => {
      await hlsExplore(mockTerminal, { argv });
    });

    Then("the screen buffer should be filled", () => {
      expect(mockTerminal._lines).to.have.length(17);
    });

    When("pressing back", async () => {
      await mockTerminal._sendKey("q");
    });

    Then("the process should have ended", () => {
      expect(mockTerminal._exit).to.equal(true);
    });
  });

  Scenario("Missing URL", () => {

    let mockProcess;
    Given("a mock process", () => {
      mockProcess = {
        exitCode: null,
        stderr: {
          write: function (data) {
            this._data = data;
          },
        },
        argv: argv.slice(0, -1),
      };
    });

    When("running the program", async () => {
      await hlsExplore(mockTerminal, mockProcess);
    });

    Then("the program should not have stared", () => {
      expect(mockTerminal._lines).to.deep.equal([]);
      expect(mockTerminal._exit).to.equal(false);
    });

    And("an error message should be displayed", () => {
      expect(mockProcess.stderr._data).to.equal("Usage: hls-explore <url>\n");
    });

    And("the exit code should be set to 1", () => {
      expect(mockProcess.exitCode).to.equal(1);
    });
  });

  Scenario("Invalid URL", () => {

    let mockProcess;
    Given("a mock process", () => {
      mockProcess = {
        exitCode: null,
        stderr: {
          write: function (data) {
            this._data = data;
          },
        },
        argv: [ "", "hls-explore", "invalid-url" ],
      };
    });

    When("running the program", async () => {
      await hlsExplore(mockTerminal, mockProcess);
    });

    Then("the program should not have stared", () => {
      expect(mockTerminal._lines).to.deep.equal([]);
      expect(mockTerminal._exit).to.equal(false);
    });

    And("an error message should be displayed", () => {
      expect(mockProcess.stderr._data).to.equal("The provided URL is not valid.\n");
    });

    And("the exit code should be set to 2", () => {
      expect(mockProcess.exitCode).to.equal(2);
    });
  });

  Scenario("Printing URL to resource", () => {
    let mockProcess;
    Given("a mock process", () => {
      mockProcess = {
        stdout: {
          write: function (data) {
            this._data = data;
          },
        },
        argv,
      };
    });

    And("the HLS file is available", () => {
      nock("http://example.com")
        .get("/playlist.m3u8")
        .reply(200, playlist, { "Content-Type": "application/vnd.apple.mpegurl" });
    });

    When("running the program", async () => {
      await hlsExplore(mockTerminal, mockProcess);
    });

    And("jumping to the first expandable row", async () => {
      await mockTerminal._sendKey("TAB");
    });

    And("pressing the print key", async () => {
      await mockTerminal._sendKey("p");
    });

    Then("the process should have ended", () => {
      expect(mockTerminal._exit).to.equal(true);
    });

    And("the URL should be printed to stdout", () => {
      expect(mockProcess.stdout._data).to.equal("http://example.com/subtitlelist_lswe_b1500000_cfbmNvZGUvMjAyNS0wNS0yOS9ueHRlZGl0aW9uLVVtY1h5TGhWSnlIVHhnLTE3NDg1NTIxMzYvbnh0ZWRpdGlvbi1VbWNYeUxoVkp5SFR4Zy0xNzQ4NTUyMTM2LnZ0dA==.m3u8\n");
    });
  });
});

function mockHeadAndGet(path, responseBody, contentType) {
  nock("http://example.com")
    .head(path)
    .reply(200, null, { "Content-Type": contentType })
    .get(path)
    .reply(200, responseBody, { "Content-Type": contentType });
}
