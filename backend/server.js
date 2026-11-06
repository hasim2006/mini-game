/**
 * Mini Game Arcade - Backend REST API Service
 * Lightweight, high-throughput microservice for game telemetry and validation.
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

// In-memory telemetry cache
const inMemoryCache = {
  sessions: [],
  inquiries: [],
  leaderboards: {
    'fruit-slice': [],
    'memory-match': []
  }
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Route: Health Check
  if (path === '/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'healthy',
      service: 'mini-game-arcade-api',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  // Route: Record Game Session
  if (path === '/api/sessions' && method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.gameId || typeof data.score !== 'number') {
        return sendJson(res, 400, { error: 'Invalid gameId or score' });
      }

      const record = {
        sessionId: 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        gameId: data.gameId,
        score: Math.max(0, Math.floor(data.score)),
        durationSeconds: Math.max(0, Number(data.durationSeconds) || 0),
        difficulty: data.difficulty || 'standard',
        recordedAt: new Date().toISOString()
      };

      inMemoryCache.sessions.push(record);

      // Update leaderboard
      if (!inMemoryCache.leaderboards[data.gameId]) {
        inMemoryCache.leaderboards[data.gameId] = [];
      }
      inMemoryCache.leaderboards[data.gameId].push(record);
      inMemoryCache.leaderboards[data.gameId].sort((a, b) => b.score - a.score);
      if (inMemoryCache.leaderboards[data.gameId].length > 100) {
        inMemoryCache.leaderboards[data.gameId].length = 100;
      }

      return sendJson(res, 201, { success: true, session: record });
    } catch (err) {
      return sendJson(res, 400, { error: 'Bad request payload' });
    }
  }

  // Route: Get Game Leaderboard
  if (path.startsWith('/api/leaderboard/') && method === 'GET') {
    const gameId = path.split('/')[3];
    const topScores = (inMemoryCache.leaderboards[gameId] || []).slice(0, 10);
    return sendJson(res, 200, { gameId, leaderboard: topScores });
  }

  // Route: Submit Contact Inquiry
  if (path === '/api/contact' && method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      if (!data.name || !data.email || !data.message) {
        return sendJson(res, 400, { error: 'Name, email, and message are required' });
      }

      const inquiry = {
        inquiryId: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: String(data.name).trim().slice(0, 100),
        email: String(data.email).trim().slice(0, 255),
        subject: String(data.subject || '').trim().slice(0, 200),
        message: String(data.message).trim().slice(0, 2000),
        receivedAt: new Date().toISOString()
      };

      inMemoryCache.inquiries.push(inquiry);
      return sendJson(res, 201, { success: true, inquiryId: inquiry.inquiryId });
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid contact payload' });
    }
  }

  // 404 Fallback
  return sendJson(res, 404, { error: 'Endpoint not found' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Mini Game Arcade API service listening on port ${PORT}`);
  });
}

module.exports = server;
