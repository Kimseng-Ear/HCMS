"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = require("express");
const cors_1 = require("cors");
const helmet_1 = require("helmet");
const compression_1 = require("compression");
const db_1 = require("./db");
const routes_1 = require("./routes");
const database_optimizations_1 = require("./database-optimizations");
async function createApp() {
    const app = (0, express_1.default)();
    // Compression
    app.use((0, compression_1.default)());
    // Security headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, cors_1.default)({
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.CORS_ORIGIN || 'https://your-app-name.onrender.com', 'http://localhost:3000']
            : true,
        credentials: true
    }));
    app.use(express_1.default.json());
    // Performance monitoring
    app.use(database_optimizations_1.performanceMiddleware);
    // Initialize Database
    await (0, db_1.initDb)();
    // API routes
    app.use('/api', routes_1.router);
    // Serve uploads
    app.use('/uploads', express_1.default.static('uploads', {
        maxAge: '1d',
        etag: true
    }));
    return app;
}
