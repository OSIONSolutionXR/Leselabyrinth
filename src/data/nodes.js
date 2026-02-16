// src/data/nodes.js
import { ASSETS, BOSS_HP_MAX as _BOSS_HP_MAX } from "./assets.js";

const BOSS_HP_MAX = Number.isFinite(_BOSS_HP_MAX) ? _BOSS_HP_MAX : 9;

export const NODES = [
  {
    id: "N1",
    key: "waldweg",
    title: "Waldweg",
    sparkHotspot: { x: 14, y: 78, r: 7 },
    interactables: [
      { id: "star1", type: "collect_star", img: ASSETS.interact.Stern, x: 38, y: 70, w: 120, once: true, points: 1, label: "Stern" },
      { id: "lan1", type: "collect_lantern", img: ASSETS.interact.Laterne, x: 73, y: 33, w: 120, once: true, points: 1, label: "Laterne" },
      { id: "ap1", type: "collect_apple", img: ASSETS.interact.Apfel, x: 86, y: 40, w: 120, once: true, points: 1, label: "Apfel" },
    ],
    readSteps: [
      {
        text: "Fips steht am Waldweg.<br>Eine Laterne leuchtet.<br>Fips bleibt ruhig und liest.",
        question: "Wo steht Fips?",
        answers: [{ t: "Am Waldweg.", correct: true }, { t: "Im Wasser.", correct: false }, { t: "Auf dem Dach.", correct: false }],
      },
      {
        text: "Fips steht am Waldweg.<br>Eine Laterne leuchtet.<br>Fips bleibt ruhig und liest.",
        question: "Was leuchtet?",
        answers: [{ t: "Die Laterne.", correct: true }, { t: "Ein Auto.", correct: false }, { t: "Ein Schuh.", correct: false }],
      },
      {
        text: "Fips steht am Waldweg.<br>Eine Laterne leuchtet.<br>Fips bleibt ruhig und liest.",
        question: "Was tut Fips?",
        answers: [{ t: "Er liest.", correct: true }, { t: "Er rennt.", correct: false }, { t: "Er schläft.", correct: false }],
      },
    ],
  },

  {
    id: "N2",
    key: "holzbruecke",
    title: "Holzbrücke",
    sparkHotspot: { x: 82, y: 63, r: 7 },
    interactables: [
      { id: "star2", type: "collect_star", img: ASSETS.interact.Stern, x: 55, y: 72, w: 120, once: true, points: 1, label: "Stern" },
      { id: "lan2", type: "collect_lantern", img: ASSETS.interact.Laterne, x: 22, y: 42, w: 120, once: true, points: 1, label: "Laterne" },
      { id: "ap2", type: "collect_apple", img: ASSETS.interact.Apfel, x: 80, y: 78, w: 70, once: true, points: 1, label: "Apfel" },
    ],
    readSteps: [
      {
        text: "Vor Fips ist eine Holzbrücke.<br>Fips geht langsam.<br>Die Brücke knarrt leise.",
        question: "Was ist vor Fips?",
        answers: [{ t: "Eine Holzbrücke.", correct: true }, { t: "Ein Auto.", correct: false }, { t: "Ein Flugzeug.", correct: false }],
      },
      {
        text: "Vor Fips ist eine Holzbrücke.<br>Fips geht langsam.<br>Die Brücke knarrt leise.",
        question: "Was macht die Brücke?",
        answers: [{ t: "Sie knarrt leise.", correct: true }, { t: "Sie fliegt.", correct: false }, { t: "Sie schläft.", correct: false }],
      },
      {
        text: "Vor Fips ist eine Holzbrücke.<br>Fips geht langsam.<br>Die Brücke knarrt leise.",
        question: "Wie geht Fips?",
        answers: [{ t: "Langsam.", correct: true }, { t: "Rückwärts.", correct: false }, { t: "Unsichtbar.", correct: false }],
      },
    ],
  },

  {
    id: "N3",
    key: "apfelbaum",
    title: "Apfelbaum",
    sparkHotspot: { x: 50, y: 18, r: 7 },
    interactables: [
      { id: "star3", type: "collect_star", img: ASSETS.interact.Stern, x: 25, y: 77, w: 120, once: true, points: 1, label: "Stern" },
      { id: "ap3", type: "collect_apple", img: ASSETS.interact.Apfel, x: 78, y: 40, w: 120, once: true, points: 1, label: "Apfel" },
      { id: "lan3", type: "collect_lantern", img: ASSETS.interact.Laterne, x: 60, y: 70, w: 70, once: true, points: 1, label: "Laterne" },
    ],
    readSteps: [
      {
        text: "Fips sieht einen Apfelbaum.<br>Ein Apfel hängt am Ast.<br>Fips lächelt.",
        question: "Was sieht Fips?",
        answers: [{ t: "Einen Apfelbaum.", correct: true }, { t: "Einen Fernseher.", correct: false }, { t: "Eine Rakete.", correct: false }],
      },
      {
        text: "Fips sieht einen Apfelbaum.<br>Ein Apfel hängt am Ast.<br>Fips lächelt.",
        question: "Was hängt am Ast?",
        answers: [{ t: "Ein Apfel.", correct: true }, { t: "Ein Hut.", correct: false }, { t: "Ein Ball.", correct: false }],
      },
      {
        text: "Fips sieht einen Apfelbaum.<br>Ein Apfel hängt am Ast.<br>Fips lächelt.",
        question: "Was macht Fips?",
        answers: [{ t: "Er lächelt.", correct: true }, { t: "Er bellt.", correct: false }, { t: "Er schwimmt.", correct: false }],
      },
    ],
  },

  {
    id: "N4",
    key: "sternstein",
    title: "Sternstein",
    sparkHotspot: { x: 18, y: 34, r: 7 },
    interactables: [
      { id: "star4", type: "collect_star", img: ASSETS.interact.Stern, x: 52, y: 73, w: 120, once: true, points: 1, label: "Stern" },
      { id: "lan4", type: "collect_lantern", img: ASSETS.interact.Laterne, x: 78, y: 40, w: 120, once: true, points: 1, label: "Laterne" },
      { id: "ap4", type: "collect_apple", img: ASSETS.interact.Apfel, x: 86, y: 84, w: 70, once: true, points: 1, label: "Apfel" },
    ],
    readSteps: [
      {
        text: "Fips findet einen Sternstein.<br>Der Stein glitzert.<br>Fips tippt ihn an.",
        question: "Was findet Fips?",
        answers: [{ t: "Einen Sternstein.", correct: true }, { t: "Einen Stuhl.", correct: false }, { t: "Einen Steinpilz.", correct: false }],
      },
      {
        text: "Fips findet einen Sternstein.<br>Der Stein glitzert.<br>Fips tippt ihn an.",
        question: "Was glitzert?",
        answers: [{ t: "Der Stein.", correct: true }, { t: "Der Schuh.", correct: false }, { t: "Der Stuhl.", correct: false }],
      },
      {
        text: "Fips findet einen Sternstein.<br>Der Stein glitzert.<br>Fips tippt ihn an.",
        question: "Was macht Fips?",
        answers: [{ t: "Er tippt ihn an.", correct: true }, { t: "Er wirft ihn weg.", correct: false }, { t: "Er versteckt sich.", correct: false }],
      },
    ],
  },

  {
    id: "N5",
    key: "bosstor",
    title: "Boss-Tor",
    sparkHotspot: { x: 90, y: 20, r: 7 },
    interactables: [
      { id: "star5", type: "collect_star", img: ASSETS.interact.Stern, x: 40, y: 72, w: 120, once: true, points: 1, label: "Stern" },
      { id: "lan5", type: "collect_lantern", img: ASSETS.interact.Laterne, x: 70, y: 35, w: 120, once: true, points: 1, label: "Laterne" },
      { id: "ap5", type: "collect_apple", img: ASSETS.interact.Apfel, x: 84, y: 74, w: 70, once: true, points: 1, label: "Apfel" },
    ],
    boss: { name: "Torwächter", hpMax: BOSS_HP_MAX },
    readBoss: [
      { text: "Vor Fips ist ein großes Tor.<br>Fips braucht einen Schlüssel.<br>Das Tor bleibt zu.", question: "Was braucht Fips?", answers: [{ t: "Den Schlüssel.", correct: true }, { t: "Einen Ball.", correct: false }, { t: "Eine Leiter.", correct: false }] },
      { text: "Fips bleibt ruhig.<br>Fips liest den Text.<br>Fips denkt nach.", question: "Was tut Fips?", answers: [{ t: "Er liest.", correct: true }, { t: "Er schläft.", correct: false }, { t: "Er fliegt.", correct: false }] },
      { text: "Ein Funken glitzert.<br>Fips bleibt aufmerksam.<br>Das Tor wartet.", question: "Was glitzert?", answers: [{ t: "Ein Funken.", correct: true }, { t: "Ein Auto.", correct: false }, { t: "Ein Baum.", correct: false }] },
      { text: "Fips steht vor dem Tor.<br>Fips atmet tief.<br>Fips bleibt ruhig.", question: "Wo steht Fips?", answers: [{ t: "Vor dem Tor.", correct: true }, { t: "Im Bett.", correct: false }, { t: "Im Haus.", correct: false }] },
      { text: "Das Tor ist groß.<br>Das Tor ist alt.<br>Das Tor ist schwer.", question: "Wie ist das Tor?", answers: [{ t: "Schwer.", correct: true }, { t: "Weich.", correct: false }, { t: "Klein.", correct: false }] },
      { text: "Fips hört ein Knacken.<br>Das Holz knarrt.<br>Fips schaut hin.", question: "Was hört Fips?", answers: [{ t: "Ein Knacken.", correct: true }, { t: "Ein Lied.", correct: false }, { t: "Ein Telefon.", correct: false }] },
      { text: "Fips hebt die Hand.<br>Fips tippt an das Tor.<br>Fips wartet.", question: "Was macht Fips?", answers: [{ t: "Er tippt an das Tor.", correct: true }, { t: "Er rennt weg.", correct: false }, { t: "Er schläft.", correct: false }] },
      { text: "Ein Licht flackert.<br>Fips schaut genau.<br>Fips bleibt still.", question: "Was flackert?", answers: [{ t: "Ein Licht.", correct: true }, { t: "Ein Fisch.", correct: false }, { t: "Ein Stein.", correct: false }] },
      { text: "Fips findet Mut.<br>Fips bleibt dran.<br>Fips gibt nicht auf.", question: "Was findet Fips?", answers: [{ t: "Mut.", correct: true }, { t: "Eine Pizza.", correct: false }, { t: "Ein Fahrrad.", correct: false }] },
    ],
  },
];
