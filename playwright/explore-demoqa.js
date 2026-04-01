"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var test_1 = require("@playwright/test");
var fs = require("fs");
var path = require("path");
function extractElements(page, selector) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.$$eval(selector, function (elements) {
                        return elements.slice(0, 10).map(function (el) {
                            var _a;
                            return ({
                                selector: el.className ? ".".concat(el.className.split(' ')[0]) : el.tagName.toLowerCase(),
                                text: (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim().substring(0, 50),
                                type: el.getAttribute('type'),
                                ariaLabel: el.getAttribute('aria-label'),
                                dataTestid: el.getAttribute('data-testid'),
                                placeholder: el.getAttribute('placeholder'),
                            });
                        });
                    }).catch(function () { return []; })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function explorePage(page, url) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1, title, structure, navLinks, forms, i, form, fields, buttons, tables, i, table, headers, modals, _a, links;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("\nExploring: ".concat(url));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(function () { })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _b.sent();
                    console.error("Failed to navigate to ".concat(url));
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, page.title()];
                case 6:
                    title = _b.sent();
                    structure = {
                        url: url,
                        title: title,
                    };
                    return [4 /*yield*/, page.$$eval('nav a, [role="navigation"] a, .navbar a, .menu a, .sidebar a', function (links) {
                            return links.slice(0, 20).map(function (l) { var _a; return ((_a = l.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || l.href; });
                        }).catch(function () { return []; })];
                case 7:
                    navLinks = _b.sent();
                    if (navLinks.length > 0) {
                        structure.navigation = navLinks;
                    }
                    return [4 /*yield*/, page.$$('form')];
                case 8:
                    forms = _b.sent();
                    if (!(forms.length > 0)) return [3 /*break*/, 12];
                    structure.forms = [];
                    i = 0;
                    _b.label = 9;
                case 9:
                    if (!(i < Math.min(forms.length, 3))) return [3 /*break*/, 12];
                    form = forms[i];
                    return [4 /*yield*/, form.$$eval('input, select, textarea, button[type="submit"]', function (els) {
                            return els.map(function (el) { return ({
                                selector: el.getAttribute('data-testid') || el.name || el.id || el.placeholder || el.type,
                                type: el.tagName.toLowerCase(),
                                inputType: el.getAttribute('type'),
                                ariaLabel: el.getAttribute('aria-label'),
                                placeholder: el.getAttribute('placeholder'),
                                dataTestid: el.getAttribute('data-testid'),
                            }); });
                        }).catch(function () { return []; })];
                case 10:
                    fields = _b.sent();
                    structure.forms.push({ fields: fields });
                    _b.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, extractElements(page, 'button, [role="button"], a.btn')];
                case 13:
                    buttons = _b.sent();
                    if (buttons.length > 0) {
                        structure.elements = buttons;
                    }
                    return [4 /*yield*/, page.$$('table')];
                case 14:
                    tables = _b.sent();
                    if (!(tables.length > 0)) return [3 /*break*/, 18];
                    structure.tables = [];
                    i = 0;
                    _b.label = 15;
                case 15:
                    if (!(i < Math.min(tables.length, 2))) return [3 /*break*/, 18];
                    table = tables[i];
                    return [4 /*yield*/, table.$$eval('th', function (ths) {
                            return ths.map(function (th) { var _a; return (_a = th.textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
                        }).catch(function () { return []; })];
                case 16:
                    headers = _b.sent();
                    structure.tables.push({
                        selector: "table:nth-of-type(".concat(i + 1, ")"),
                        columns: headers,
                    });
                    _b.label = 17;
                case 17:
                    i++;
                    return [3 /*break*/, 15];
                case 18: return [4 /*yield*/, page.$$('[role="dialog"], .modal, .dialog')];
                case 19:
                    modals = _b.sent();
                    if (!(modals.length > 0)) return [3 /*break*/, 21];
                    _a = structure;
                    return [4 /*yield*/, Promise.all(modals.slice(0, 3).map(function (modal) { return __awaiter(_this, void 0, void 0, function () {
                            var text;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, modal.textContent().catch(function () { return ''; })];
                                    case 1:
                                        text = _b.sent();
                                        _a = {};
                                        return [4 /*yield*/, modal.getAttribute('class').then(function (c) { return ".".concat(c === null || c === void 0 ? void 0 : c.split(' ')[0]); }).catch(function () { return '.modal'; })];
                                    case 2: return [2 /*return*/, (_a.selector = _b.sent(),
                                            _a.title = text.substring(0, 50),
                                            _a)];
                                }
                            });
                        }); }))];
                case 20:
                    _a.modals = _b.sent();
                    _b.label = 21;
                case 21: return [4 /*yield*/, page.$$eval('a[href]', function (as) {
                        return __spreadArray([], new Set(as.map(function (a) { return a.href; }).filter(function (h) { return h && !h.includes('javascript'); })), true).slice(0, 30);
                    }).catch(function () { return []; })];
                case 22:
                    links = _b.sent();
                    if (links.length > 0) {
                        structure.links = links;
                    }
                    return [2 /*return*/, structure];
            }
        });
    });
}
function discoverPages(browser) {
    return __awaiter(this, void 0, void 0, function () {
        var page, discoveredUrls, visited, queue, url, links, _i, links_1, link, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    discoveredUrls = new Set();
                    visited = new Set();
                    queue = ['https://demoqa.com'];
                    _a.label = 2;
                case 2:
                    if (!(queue.length > 0 && discoveredUrls.size < 50)) return [3 /*break*/, 8];
                    url = queue.shift();
                    if (visited.has(url))
                        return [3 /*break*/, 2];
                    visited.add(url);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(function () { })];
                case 4:
                    _a.sent();
                    discoveredUrls.add(url);
                    return [4 /*yield*/, page.$$eval('a[href]', function (as) {
                            return as.map(function (a) { return a.href; }).filter(function (h) { return h === null || h === void 0 ? void 0 : h.startsWith('https://demoqa.com'); });
                        }).catch(function () { return []; })];
                case 5:
                    links = _a.sent();
                    for (_i = 0, links_1 = links; _i < links_1.length; _i++) {
                        link = links_1[_i];
                        if (!visited.has(link) && queue.length < 30) {
                            queue.push(link);
                        }
                    }
                    return [3 /*break*/, 7];
                case 6:
                    e_2 = _a.sent();
                    console.error("Error visiting ".concat(url));
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 2];
                case 8: return [4 /*yield*/, page.close()];
                case 9:
                    _a.sent();
                    return [2 /*return*/, Array.from(discoveredUrls)];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, appMap, urls, _i, _a, url, page, structure, key, outputDir, mapFile, markdownFile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, test_1.chromium.launch({ headless: true })];
                case 1:
                    browser = _b.sent();
                    appMap = {
                        baseUrl: 'https://demoqa.com',
                        explorationType: 'Full Website Structure Analysis',
                        timestamp: new Date().toISOString(),
                        pages: {},
                        navigationMap: {},
                        allSelectors: {},
                    };
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, , 10, 12]);
                    console.log('🔍 Discovering pages...');
                    return [4 /*yield*/, discoverPages(browser)];
                case 3:
                    urls = _b.sent();
                    console.log("\uD83D\uDCC4 Found ".concat(urls.length, " pages"));
                    console.log('\n📋 Analyzing page structures...');
                    _i = 0, _a = urls.slice(0, 25);
                    _b.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    url = _a[_i];
                    return [4 /*yield*/, browser.newPage()];
                case 5:
                    page = _b.sent();
                    return [4 /*yield*/, explorePage(page, url)];
                case 6:
                    structure = _b.sent();
                    key = new URL(url).pathname || '/';
                    appMap.pages[key] = structure;
                    return [4 /*yield*/, page.close()];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    // Extract all unique selectors
                    Object.values(appMap.pages).forEach(function (pageStruct) {
                        if (pageStruct.forms) {
                            pageStruct.forms.forEach(function (form) {
                                form.fields.forEach(function (field) {
                                    if (!appMap.allSelectors['formFields'])
                                        appMap.allSelectors['formFields'] = [];
                                    appMap.allSelectors['formFields'].push(field.selector);
                                });
                            });
                        }
                        if (pageStruct.elements) {
                            if (!appMap.allSelectors['buttons'])
                                appMap.allSelectors['buttons'] = [];
                            pageStruct.elements.forEach(function (el) {
                                appMap.allSelectors['buttons'].push(el.selector);
                            });
                        }
                    });
                    outputDir = path.join(__dirname, 'exploration-results');
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    mapFile = path.join(outputDir, 'demoqa-application-map.json');
                    fs.writeFileSync(mapFile, JSON.stringify(appMap, null, 2));
                    console.log("\n\u2705 Saved application map to: ".concat(mapFile));
                    markdownFile = path.join(outputDir, 'demoqa-structure-report.md');
                    generateMarkdownReport(appMap, markdownFile);
                    console.log("\u2705 Saved markdown report to: ".concat(markdownFile));
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, browser.close()];
                case 11:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
function generateMarkdownReport(appMap, filepath) {
    var content = "# DemoQA Application Structure Report\n\n";
    content += "**Generated:** ".concat(appMap.timestamp, "\n\n");
    content += "## Overview\n\n";
    content += "- **Base URL:** ".concat(appMap.baseUrl, "\n");
    content += "- **Pages Discovered:** ".concat(Object.keys(appMap.pages).length, "\n\n");
    content += "## Pages and Components\n\n";
    Object.entries(appMap.pages).forEach(function (_a) {
        var path = _a[0], page = _a[1];
        content += "### ".concat(page.title || path, "\n\n");
        content += "- **URL:** `".concat(page.url, "`\n");
        if (page.navigation && page.navigation.length > 0) {
            content += "- **Navigation:** ".concat(page.navigation.join(', '), "\n");
        }
        if (page.forms && page.forms.length > 0) {
            content += "- **Forms:**\n";
            page.forms.forEach(function (form, i) {
                content += "  - Form ".concat(i + 1, ":\n");
                form.fields.forEach(function (field) {
                    content += "    - `".concat(field.selector, "` (").concat(field.type || field.inputType || 'unknown', ")\n");
                });
            });
        }
        if (page.tables && page.tables.length > 0) {
            content += "- **Tables:**\n";
            page.tables.forEach(function (table, i) {
                var _a;
                content += "  - Table ".concat(i + 1, ": ").concat(((_a = table.columns) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'unknown columns', "\n");
            });
        }
        if (page.elements && page.elements.length > 0) {
            content += "- **Key Elements:** ".concat(page.elements.slice(0, 5).map(function (e) { return e.selector; }).join(', '), "\n");
        }
        content += "\n";
    });
    fs.writeFileSync(filepath, content);
}
main().catch(console.error);
