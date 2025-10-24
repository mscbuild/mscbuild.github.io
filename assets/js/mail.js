<script>
(function() {
  'use strict';

  // === Настройки ===
  const RATE_LIMIT_WINDOW = 60; // секунд между отправками
  const FORM_STORAGE_KEY = 'contact_form_last_submit';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  // Список бессмысленных фраз
  const BANNED_PHRASES = [
    'test', 'тест', 'qwe', 'qwerty', '123', '1234', '12345', '123456', '1111',
    'asdf', 'zxcv', 'йцу', 'фыв', 'йцукен', 'no name', 'noname', 'anonymous',
    'spam', 'бот', 'bot', 'example', 'user', 'имя', 'ваше имя', 'сообщение',
    'name', 'message', 'email', 'none', 'null', 'undefined'
  ].map(s => s.toLowerCase());

  // === Вспомогательные функции ===

  function hasUserAgent() {
    return typeof navigator !== 'undefined' &&
           typeof navigator.userAgent === 'string' &&
           navigator.userAgent.trim() !== '';
  }

  function isRepetitive(str) {
    if (str.length < 3) return false;
    return str.split('').every(char => char === str[0]);
  }

  function hasNoLetters(str) {
    return !/[a-zA-Zа-яА-ЯёЁ]/.test(str);
  }

  function isMeaningless(value, fieldType) {
    const clean = value.trim();
    if (clean.length === 0) return true;
    if (clean.length < 2) return true;

    const lower = clean.toLowerCase();

    if (BANNED_PHRASES.some(phrase => lower.includes(phrase))) return true;
    if (isRepetitive(clean)) return true;
    if (fieldType === 'name' && hasNoLetters(clean)) return true;
    if (fieldType === 'message' && clean.length > 25 && !/[ \t\n\r]/.test(clean)) return true;

    return false;
  }

  function isRateLimited() {
    const last = localStorage.getItem(FORM_STORAGE_KEY);
    if (!last) return false;
    return (Date.now() - parseInt(last, 10)) < RATE_LIMIT_WINDOW * 1000;
  }

  function setLastSubmission() {
    localStorage.setItem(FORM_STORAGE_KEY, Date.now().toString());
  }

  // === Основная инициализация ===

  window.addEventListener('load', function() {
    if (!hasUserAgent()) {
      console.warn('Форма заблокирована: отсутствует User-Agent.');
      return;
    }

    const form = document.getElementById('form');
    const result = document.getElementById('result');

    if (!form || !result) {
      console.error('Форма с id="form" или элемент #result не найдены.');
      return;
    }

    const nameInput = form.querySelector('input[name="name"]');
    const messageInput = form.querySelector('textarea[name="message"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Валидация поля при потере фокуса
    const validateField = (input, type) => {
      if (!input) return true;
      const isBad = isMeaningless(input.value, type);
      input.setCustomValidity(isBad ? 
        (type === 'name' ? 'Пожалуйста, введите настоящее имя.' : 'Пожалуйста, напишите осмысленное сообщение.') 
        : ''
      );
      return !isBad;
    };

    if (nameInput) nameInput.addEventListener('blur', () => validateField(nameInput, 'name'));
    if (messageInput) messageInput.addEventListener('blur', () => validateField(messageInput, 'message'));

    // Обработка отправки
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // 1. Rate limiting
      if (isRateLimited()) {
        alert(`Пожалуйста, подождите ${RATE_LIMIT_WINDOW} секунд перед повторной отправкой.`);
        return;
      }

      // 2. Сброс ошибок
      if (nameInput) nameInput.setCustomValidity('');
      if (messageInput) messageInput.setCustomValidity('');

      // 3. Проверка содержимого
      let valid = true;
      if (nameInput && isMeaningless(nameInput.value, 'name')) {
        nameInput.setCustomValidity('Пожалуйста, введите настоящее имя (минимум 2 символа, с буквами).');
        valid = false;
      }
      if (messageInput && isMeaningless(messageInput.value, 'message')) {
        messageInput.setCustomValidity('Пожалуйста, напишите осмысленное сообщение.');
        valid = false;
      }

      // 4. Стандартная валидация браузера
      if (!form.checkValidity() || !valid) {
        form.classList.add('was-validated');
        return;
      }

      // 5. Блокировка кнопки и подготовка к отправке
      if (submitBtn) {
        submitBtn.disabled = true;
        const span = submitBtn.querySelector('span');
        if (span) span.textContent = 'Отправляется...';
      }
      result.innerHTML = 'Пожалуйста, подождите...';
      result.style.display = 'block';

      // 6. Отправка на Web3Forms
      const formData = new FormData(form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      try {
        const response = await fetch(WEB3FORMS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: json
        });

        const data = await response.json();
        result.innerHTML = data.message || (response.ok ? 'Сообщение отправлено!' : 'Ошибка отправки.');

        if (response.ok) {
          form.reset();
          form.classList.remove('was-validated');
          setLastSubmission();
        }
      } catch (error) {
        console.error('Ошибка:', error);
        result.innerHTML = 'Что-то пошло не так!';
      } finally {
        // Восстановить кнопку через 1 секунду, если нужно
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = 'SEND MESSAGE';
          }
          // Скрыть результат через 3 секунды
          setTimeout(() => {
            result.style.display = 'none';
          }, 3000);
        }, 1000);
      }
    });
  }, false);
})();
</script>
