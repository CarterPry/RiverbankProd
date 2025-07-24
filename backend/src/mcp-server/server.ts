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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
// mcp-server.ts
var express_1 = require("express");
var dockerode_1 = require("dockerode");
var pg_1 = require("pg"); // For pgvector
var axios_1 = require("axios"); // For embedding API (e.g., Ollama/OpenAI)
var utils_1 = require("./utils"); // Helper (define below)
// Enums and Interfaces
var IntentType;
(function (IntentType) {
    IntentType["SECURITY_TEST"] = "security_test";
    IntentType["AVAILABILITY_TEST"] = "availability_test";
    // Expand as needed
})(IntentType || (IntentType = {}));
var TrustService;
(function (TrustService) {
    TrustService["SECURITY"] = "security";
    TrustService["AVAILABILITY"] = "availability";
    // Expand
})(TrustService || (TrustService = {}));
// Docker Client
var DockerClient = /** @class */ (function () {
    function DockerClient() {
        this.docker = new dockerode_1.default();
    }
    DockerClient.prototype.runTool = function (image, command) {
        return __awaiter(this, void 0, void 0, function () {
            var container, logs, stdout, stderr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.docker.createContainer({
                            Image: image, // e.g., 'kalilinux/kali-rolling' or 'vxcontrol/kali-linux'
                            Cmd: command,
                            AttachStdout: true,
                            AttachStderr: true,
                            HostConfig: { AutoRemove: true, NetworkMode: 'bridge', CapAdd: ['NET_ADMIN', 'SYS_ADMIN'], Binds: ['/tmp/mcp-results:/results:rw'] },
                        })];
                    case 1:
                        container = _a.sent();
                        return [4 /*yield*/, container.start()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, container.logs({ follow: true, stdout: true, stderr: true })];
                    case 3:
                        logs = _a.sent();
                        stdout = '', stderr = '';
                        logs.on('data', function (chunk) { var data = chunk.toString(); data.includes('ERROR') ? (stderr += data) : (stdout += data); });
                        return [4 /*yield*/, new Promise(function (resolve) { return logs.on('end', resolve); })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, { stdout: stdout, stderr: stderr }];
                }
            });
        });
    };
    return DockerClient;
}());
// Vector DB (pgvector)
var VectorDB = /** @class */ (function () {
    function VectorDB() {
        this.pool = new pg_1.Pool({ connectionString: process.env.PG_CONNECTION_STRING || 'postgres://user:pass@localhost/pentagidb' });
        // Add store method if needed
    }
    VectorDB.prototype.search = function (embedding, filter, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var client, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, client.query("SELECT * FROM embeddings WHERE metadata @> $1 ORDER BY embedding <-> $2 LIMIT $3", [filter, JSON.stringify(embedding), limit])];
                    case 3:
                        res = _a.sent();
                        return [2 /*return*/, res.rows];
                    case 4:
                        client.release();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return VectorDB;
}());
// Embedding Function (API placeholder, e.g., Ollama)
function getEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post(process.env.EMBEDDING_API_URL || 'http://localhost:11434/api/embeddings', { model: 'nomic-embed-text', prompt: text })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.embedding];
                case 2:
                    error_1 = _a.sent();
                    console.error('Embedding error:', error_1);
                    return [2 /*return*/, []]; // Fallback
                case 3: return [2 /*return*/];
            }
        });
    });
}
// MCP Server
var MCPServer = /** @class */ (function () {
    function MCPServer() {
        this.app = (0, express_1.default)();
        this.dockerClient = new DockerClient();
        this.vectorDB = new VectorDB();
        this.tools = {
            scan_ports: { name: 'scan_ports', description: 'Scan ports', inputSchema: { /* schema */}, complianceChecks: ['CC6.1'] },
            test_sql_injection: { name: 'test_sql_injection', description: 'Test SQL injection', inputSchema: { /* schema */}, complianceChecks: ['CC6.6'] },
            // Expand
        };
        this.vulnerabilityMappings = {
            // Full table from our cross-reference (abbreviated; add all entries)
            'sql_injection': { tsc: ['Security', 'Confidentiality', 'Processing Integrity'], cc: ['CC5.1', 'CC5.3', 'CC6.3', 'CC7.2', 'CC7.3'], rationale: 'Injection risks' },
            'xss': { tsc: ['Security', 'Confidentiality'], cc: ['CC5.1', 'CC5.3', 'CC6.3', 'CC7.2', 'CC9.1'], rationale: 'Script injection' },
            // ... add the rest
        };
        this.app.use(express_1.default.json());
        this.setupRoutes();
    }
    MCPServer.prototype.setupRoutes = function () {
        var _this = this;
        this.app.post('/api/tool-call', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var toolCall, _a, _b, e_1;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        toolCall = req.body;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        _b = (_a = res).json;
                        _c = { success: true };
                        return [4 /*yield*/, this.executeTool(toolCall)];
                    case 2:
                        _b.apply(_a, [(_c.result = _d.sent(), _c)]);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _d.sent();
                        res.status(500).json({ error: e_1.message });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        this.app.post('/api/classify-intent', function (req, res) { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = res).json;
                    return [4 /*yield*/, this.classifyIntent(req.body.userInput)];
                case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        }); }); });
        this.app.post('/api/run-soc2-workflow', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var _a, userInput, formData, intent, context, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = req.body, userInput = _a.userInput, formData = _a.formData;
                        return [4 /*yield*/, this.classifyIntent(userInput)];
                    case 1:
                        intent = _d.sent();
                        return [4 /*yield*/, this.enrichContext(intent, formData)];
                    case 2:
                        context = _d.sent();
                        _c = (_b = res).json;
                        return [4 /*yield*/, this.runWorkflow(context)];
                    case 3:
                        _c.apply(_b, [_d.sent()]);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    MCPServer.prototype.classifyIntent = function (userInput) {
        return __awaiter(this, void 0, void 0, function () {
            var inputEmbedding, match;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getEmbedding(userInput)];
                    case 1:
                        inputEmbedding = _a.sent();
                        return [4 /*yield*/, this.matchInfoToAttack(userInput)];
                    case 2:
                        match = _a.sent();
                        return [2 /*return*/, { primaryIntent: primaryIntent, confidence: maxSimilarity, extractedEntities: {}, matchedAttacks: [match.bestAttack] }];
                }
            });
        });
    };
    MCPServer.prototype.enrichContext = function (intent, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var historical, _a, _b, correlated, match;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = this.vectorDB).search;
                        return [4 /*yield*/, getEmbedding('historical findings')];
                    case 1: return [4 /*yield*/, _b.apply(_a, [_c.sent(), {}, 5])];
                    case 2:
                        historical = _c.sent();
                        return [4 /*yield*/, this.correlateAttacks()];
                    case 3:
                        correlated = _c.sent();
                        return [4 /*yield*/, this.matchInfoToAttack(formData.infoDescription || '')];
                    case 4:
                        match = _c.sent();
                        // Build context with mappings from table + embeddings
                        return [2 /*return*/, { /* ... populate with correlatedAttacks, matchedAttack, vulnerabilityMappings */}];
                }
            });
        });
    };
    MCPServer.prototype.executeTool = function (toolCall) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    MCPServer.prototype.runWorkflow = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    // New: Compute attack correlations matrix (using embeddings)
    MCPServer.prototype.correlateAttacks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var attackNames, embeddings, matrix;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attackNames = Object.keys(this.vulnerabilityMappings);
                        return [4 /*yield*/, Promise.all(attackNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getEmbedding(this.vulnerabilityMappings[name].rationale)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); }))];
                    case 1:
                        embeddings = _a.sent();
                        matrix = embeddings.map(function (emb, i) { return embeddings.map(function (otherEmb) { return (0, utils_1.cosineSimilarity)(emb, otherEmb); }); });
                        return [2 /*return*/, attackNames.reduce(function (acc, name, i) { acc[name] = matrix[i]; return acc; }, {})];
                }
            });
        });
    };
    // New: Match info to attack using embeddings
    MCPServer.prototype.matchInfoToAttack = function (info) {
        return __awaiter(this, void 0, void 0, function () {
            var infoEmb, attackNames, attackEmbs, similarities, bestIdx;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!info)
                            return [2 /*return*/, { bestAttack: '', score: 0 }];
                        return [4 /*yield*/, getEmbedding(info)];
                    case 1:
                        infoEmb = _a.sent();
                        attackNames = Object.keys(this.vulnerabilityMappings);
                        return [4 /*yield*/, Promise.all(attackNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getEmbedding(this.vulnerabilityMappings[name].rationale)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            }); }); }))];
                    case 2:
                        attackEmbs = _a.sent();
                        similarities = attackEmbs.map(function (emb) { return (0, utils_1.cosineSimilarity)(infoEmb, emb); });
                        bestIdx = similarities.reduce(function (maxIdx, sim, i, arr) { return sim > arr[maxIdx] ? i : maxIdx; }, 0);
                        return [2 /*return*/, { bestAttack: attackNames[bestIdx], score: similarities[bestIdx] }];
                }
            });
        });
    };
    MCPServer.prototype.start = function (port) {
        if (port === void 0) { port = 3000; }
        this.app.listen(port, function () { return console.log("MCP Server on ".concat(port)); });
    };
    return MCPServer;
}());
// Utils
function cosineSimilarity(a, b) {
    var dot = a.reduce(function (sum, val, i) { return sum + val * b[i]; }, 0);
    var magA = Math.sqrt(a.reduce(function (sum, val) { return sum + Math.pow(val, 2); }, 0));
    var magB = Math.sqrt(b.reduce(function (sum, val) { return sum + Math.pow(val, 2); }, 0));
    return magA && magB ? dot / (magA * magB) : 0;
}
// Start
var server = new MCPServer();
server.start();
