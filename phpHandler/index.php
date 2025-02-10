<?php
// Получаем ID из ссылки
$templateId = $_GET['id'] ?? null;

if (!$templateId) {
    die('ID не указан.');
}

// URL вашего бэкенда
$backendUrl = 'https://agile-creation-main.up.railway.app/'; // Укажите правильный URL вашего бэкенда

// 1. Запрос к эндпоинту /links для получения номера шаблона
$response = file_get_contents("{$backendUrl}/links");
$links = json_decode($response, true);

$templateNumber = null;
foreach ($links as $link) {
    if ($link['id'] == $templateId) {
        $templateNumber = $link['templateId']; // Предполагается, что в объекте есть поле templateId
        break;
    }
}

if (!$templateNumber) {
    die('Шаблон не найден для данного ID.');
}

// 2. Запрос к эндпоинту /get-template для получения ZIP-архива
$zipFilePath = "{$backendUrl}/get-template/{$templateNumber}"; // Правильный путь к ZIP-архиву
$zipContent = file_get_contents($zipFilePath);

if ($zipContent === false) {
    die('Ошибка при получении ZIP-архива.');
}

// 3. Создание папки с именем ID, если она не существует
$outputDir = "{$templateId}"; // Укажите правильный путь к директории с шаблонами
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Сохраняем ZIP-архив с правильным именем
$zipFileFullPath = "{$outputDir}/{$templateNumber}.zip";
file_put_contents($zipFileFullPath, $zipContent);

// 4. Распаковка архива
$zip = new ZipArchive;
if ($zip->open($zipFileFullPath) === TRUE) {
    $zip->extractTo($outputDir);
    $zip->close();
    unlink($zipFileFullPath); // Удаляем ZIP-файл после распаковки
} else {
    die('Ошибка распаковки архива.');
}

// 5. Отображение содержимого из папки с идентификатором
$files = scandir($outputDir);
foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        $filePath = "{$outputDir}/{$file}";
        if (is_file($filePath)) {
 // Выводим содержимое файлов
            header('Content-Type: ' . mime_content_type($filePath));
            readfile($filePath);
        }
    }
}
?>
