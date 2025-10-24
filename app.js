const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 1, // макс. 1 запрос в минуту с IP
  message: 'Слишком много попыток. Попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/submit-form', limiter, (req, res) => {
  if (!req.get('User-Agent')) {
    return res.status(400).json({ error: 'Требуется User-Agent' });
  }
  // ... обработка формы
});
