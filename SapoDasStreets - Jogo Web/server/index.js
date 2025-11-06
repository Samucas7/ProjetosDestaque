const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let scores = [];

app.post('/api/scores', (req, res) => {
  const { datascore, nickname, score, game } = req.body;
  if (!nickname || score == null) return res.status(400).json({ error: 'Dados incompletos' });

  scores.push({ datascore, nickname, score, game });
  res.json({ success: true });
});

app.get('/api/scores/bygame/:game', (req, res) => {
  const game = req.params.game;
  const gameScores = scores.filter(s => s.game === game);
  res.json(gameScores);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
