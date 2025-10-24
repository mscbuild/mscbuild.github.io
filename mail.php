// Проверка User-Agent
if (empty($_SERVER['HTTP_USER_AGENT'])) {
    http_response_code(400);
    exit('Требуется User-Agent');
}

// Проверка скрытого поля botcheck (должно быть НЕ отмечено!)
if (!empty($_POST['botcheck'])) {
    http_response_code(400);
    exit('Спам-бот обнаружен');
}

// Проверка имени и сообщения на бессмысленность (аналогично JS)
function isMeaningless($str, $type = 'text') {
    $str = trim($str);
    if (strlen($str) < 2) return true;
    if (preg_match('/^(.)\1{2,}$/', $str)) return true; // aaaa, 1111
    if ($type === 'name' && !preg_match('/[a-zа-я]/iu', $str)) return true;
    // ... и т.д.
}
