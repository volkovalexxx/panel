<?php
$templateId = $_GET['id'] ?? null;

if (!$templateId) {
    die('ID не указан.');
}

$backendUrl = 'https://bubbly-sparkle-main.up.railway.app';

$response = file_get_contents("{$backendUrl}/links");
$links = json_decode($response, true);

$templateNumber = null;
foreach ($links as $link) {
    if ($link['id'] == $templateId) {
        $templateNumber = $link['templateId'];
        break;
    }
}

if (!$templateNumber) {
    die('Шаблон не найден для данного ID.');
}

$zipFilePath = "{$backendUrl}/get-template/{$templateNumber}";
$zipContent = file_get_contents($zipFilePath);

if ($zipContent === false) {
    die('Ошибка при получении ZIP-архива.');
}

$outputDir = "{$templateId}";
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$zipFileFullPath = "{$outputDir}/{$templateNumber}.zip";
file_put_contents($zipFileFullPath, $zipContent);

$zip = new ZipArchive;
if ($zip->open($zipFileFullPath) === TRUE) {
    $zip->extractTo($outputDir);
    $zip->close();
    unlink($zipFileFullPath);
} else {
    die('Ошибка распаковки архива.');
}

// Проверяем наличие index.html или index.php
$indexFilePathHtml = "{$outputDir}/index.html";
$indexFilePathPhp = "{$outputDir}/index.php";

if (file_exists($indexFilePathHtml)) {
    $indexContent = file_get_contents($indexFilePathHtml);
} elseif (file_exists($indexFilePathPhp)) {
    $indexContent = file_get_contents($indexFilePathPhp);
} else {
    die('index.html или index.php не найден.');
}

// Заменяем пути к ресурсам
$indexContent = str_replace('href="css/', 'href="' . $outputDir . '/css/', $indexContent);
$indexContent = str_replace('src="js/', 'src="' . $outputDir . '/js/', $indexContent);
$indexContent = str_replace('src="images/', 'src="' . $outputDir . '/images/', $indexContent);

// Отправляем заголовки и выводим содержимое
header('Content-Type: text/html; charset=utf-8');
echo $indexContent;
?>
