const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors()); // Используйте CORS middleware
app.use(bodyParser.json());

const jsonFilePath = path.join(__dirname, 'domains.json');
const linksFilePath = path.join(__dirname, 'links.json');
const templatesDir = path.join(__dirname, 'templates');
const templatesFilePath = path.join(__dirname, 'templates.json');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, templatesDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/add-domain', (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        console.error('Domain is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует домен.');
    }

    const newDomain = {
        domain: domain,
        addedOn: new Date().toISOString().split('T')[0],
        status: "live"
    };

    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading domains file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла доменов.');
        }

        let domains = [];
        try {
            domains = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing domains JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла доменов.');
        }

        domains.push(newDomain);

        fs.writeFile(jsonFilePath, JSON.stringify(domains, null, 2), (err) => {
            if (err) {
                console.error('Error writing domains file:', err);
                return res.status(500).send('Что-то пошло не так: ошибка записи в файл доменов.');
            }
            console.log('Domain added successfully:', newDomain);
            res.status(201).send('Domain added successfully');
        });
    });
});

app.delete('/delete-domain', (req, res) => {
    const domainToDelete = req.body.domain;

    if (!domainToDelete) {
        console.error('Domain to delete is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует домен для удаления.');
    }

    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading domains file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла доменов.');
        }

        let domains = [];
        try {
            domains = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing domains JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла доменов.');
        }

        const initialLength = domains.length;
        domains = domains.filter(domain => domain.domain !== domainToDelete);

        if (domains.length === initialLength) {
            console.warn(`Domain not found: ${domainToDelete}`);
            return res.status(404).send('Что-то пошло не так: домен не найден.');
        }

        fs.writeFile(jsonFilePath, JSON.stringify(domains, null, 2), (err) => {
            if (err) {
                console.error('Error writing domains file:', err);
                return res.status(500).send('Что-то пошло не так: ошибка записи в файл доменов.');
            }
            console.log('Domain deleted successfully:', domainToDelete);
            res.status(200).send('Domain deleted successfully');
        });
    });
});

app.get('/domains', (req, res) => {
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        const domains = JSON.parse(data);
        res.status(200).json(domains);
    });
});


app.post('/add-link', (req, res) => {
    const newLinkId = uuidv4();
    const domain = req.body.domain;
    const templateId = req.body.templateId;

    if (!domain) {
        console.error('Domain is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует домен.');
    }

    if (!templateId) {
        console.error('Template ID is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует идентификатор шаблона.');
    }

    const newLink = {
        id: newLinkId,
        link: `${domain}/?id=${newLinkId}&templateId=${templateId}`,
        domain: domain,
        templateId: templateId,
        addedOn: new Date().toISOString().split('T')[0]
    };

    fs.readFile(linksFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading links file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла ссылок.');
        }

        let links = [];
        try {
            links = data ? JSON.parse(data) : [];
        } catch (parseError) {
            console.error('Error parsing links JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла ссылок.');
        }

        links.push(newLink);

        fs.writeFile(linksFilePath, JSON.stringify(links, null, 2), (err) => {
            if (err) {
                console.error('Error writing links file:', err);
                return res.status(500).send('Что-то пошло не так: ошибка записи в файл ссылок.');
            }
            console.log('Link added successfully:', newLink);
            res.status(201).json({ link: newLink.link });
        });
    });
});


app.delete('/delete-link', (req, res) => {
    const linkIdToDelete = req.body.id;

    if (!linkIdToDelete) {
        console.error('Link ID to delete is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует идентификатор ссылки для удаления.');
    }

    fs.readFile(linksFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading links file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла ссылок.');
        }

        let links = [];
        try {
            links = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing links JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла ссылок.');
        }

        const initialLength = links.length;
        links = links.filter(link => link.id !== linkIdToDelete);

        if (links.length === initialLength) {
            console.warn(`Link not found: ${linkIdToDelete}`);
            return res.status(404).send('Что-то пошло не так: ссылка не найдена.');
        }

        fs.writeFile(linksFilePath, JSON.stringify(links, null, 2), (err) => {
            if (err) {
                console.error('Error writing links file:', err);
                return res.status(500).send('Что-то пошло не так: ошибка записи в файл ссылок.');
            }
            console.log('Link deleted successfully:', linkIdToDelete);
            res.status(200).send('Link deleted successfully');
        });
    });
});


app.get('/links', (req, res) => {
    fs.readFile(linksFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading links file');
        }
        const links = JSON.parse(data);
        res.status(200).json(links);
    });
});


app.post('/add-template', upload.single('template'), (req, res) => {
    const zipFilePath = path.join(templatesDir, req.file.filename);

    if (!req.file || req.file.mimetype !== 'application/zip') {
        console.error('Uploaded file is not a valid ZIP archive.');
        return res.status(400).send('Что-то пошло не так: загруженный файл не является ZIP-архивом.');
    }

    fs.readFile(templatesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading templates file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла шаблонов.');
        }

        let templates = [];
        try {
            templates = data ? JSON.parse(data) : [];
        } catch (parseError) {
            console.error('Error parsing templates JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла шаблонов.');
        }

        const templateId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;
        const outputDir = path.join(templatesDir, templateId.toString());
        fs.mkdirSync(outputDir, { recursive: true });

        const newZipFileName = `${templateId}.zip`;
        const newZipFilePath = path.join(outputDir, newZipFileName);

        fs.rename(zipFilePath, newZipFilePath, (err) => {
            if (err) {
                console.error('Error moving the zip file:', err);
                return res.status(500).send('Что-то пошло не так: ошибка перемещения ZIP-файла.');
            }

            const newTemplate = {
                id: templateId,
                path: `/template/${templateId}/`,
                addedOn: new Date().toISOString().split('T')[0]
            };

            templates.push(newTemplate);

            fs.writeFile(templatesFilePath, JSON.stringify(templates, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to templates file:', err);
                    return res.status(500).send('Что-то пошло не так: ошибка записи в файл шаблонов.');
                }
                console.log('Template added successfully:', newTemplate);
                res.status(201).send(`Template added successfully at /template/${templateId}/`);
            });
        });
    });
});


app.delete('/delete-template', (req, res) => {
    const templateId = req.body.id;

    if (!templateId) {
        console.error('Template ID is missing in the request body.');
        return res.status(400).send('Что-то пошло не так: отсутствует идентификатор шаблона для удаления.');
    }

    const outputDir = path.join(templatesDir, templateId.toString());

    fs.readFile(templatesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading templates file:', err);
            return res.status(500).send('Что-то пошло не так: ошибка чтения файла шаблонов.');
        }

        let templates = [];
        try {
            templates = data ? JSON.parse(data) : [];
        } catch (parseError) {
            console.error('Error parsing templates JSON:', parseError);
            return res.status(500).send('Что-то пошло не так: ошибка парсинга файла шаблонов.');
        }

        const templateIndex = templates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) {
            console.warn(`Template not found: ${templateId}`);
            return res.status(404).send('Что-то пошло не так: шаблон не найден.');
        }

        fs.rmdir(outputDir, { recursive: true }, (err) => {
            if (err) {
                console.error('Error deleting template directory:', err);
                return res.status(500).send('Что-то пошло не так: ошибка удаления директории шаблона.');
            }

            templates.splice(templateIndex, 1);

            fs.writeFile(templatesFilePath, JSON.stringify(templates, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to templates file:', err);
                    return res.status(500).send('Что-то пошло не так: ошибка записи в файл шаблонов.');
                }
                console.log('Template deleted successfully:', templateId);
                res.status(200).send('Template deleted successfully');
            });
        });
    });
});

app.get('/templates', (req, res) => {
    fs.readFile(templatesFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading templates file');
        }
        const templates = JSON.parse(data);
        res.status(200).json(templates);
    });
});


app.get('/download-php', (req, res) => {
    const phpFilePath = path.join(__dirname, 'phpHandler', 'index.php');
    const tempFilePath = path.join(__dirname, 'phpHandler', 'temp_index.php');

    if (fs.existsSync(phpFilePath)) {
        // Читаем содержимое оригинального файла
        fs.readFile(phpFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return res.status(500).send('Ошибка при чтении файла.');
            }

            // Заменяем строку с $backendUrl на актуальный адрес
            const backendUrl = 'https://agile-creation-main.up.railway.app/'; // Укажите актуальный адрес
            const updatedData = data.replace(/(\\$backendUrl = ')(.*?)(';)/, `$1${backendUrl}$3`);

            // Записываем обновленное содержимое во временный файл
            fs.writeFile(tempFilePath, updatedData, (err) => {
                if (err) {
                    console.error('Error writing the temp file:', err);
                    return res.status(500).send('Ошибка при записи временного файла.');
                }

                // Отправляем временный файл для скачивания
                res.download(tempFilePath, 'index.php', (err) => {
                    if (err) {
                        console.error('Error downloading the file:', err);
                        return res.status(500).send('Ошибка при загрузке файла.');
                    }

                    // Удаляем временный файл после отправки
                    fs.unlink(tempFilePath, (err) => {
                        if (err) {
                            console.error('Error deleting the temp file:', err);
                        }
                    });
                });
            });
        });
    } else {
        res.status(404).send('Файл не найден.');
    }
});



app.get('/get-template/:templateNumber', (req, res) => {
    const templateNumber = req.params.templateNumber;
    const zipFilePath = path.join(templatesDir, templateNumber, `${templateNumber}.zip`);

    if (fs.existsSync(zipFilePath)) {
        res.download(zipFilePath, (err) => {
            if (err) {
                console.error('Error downloading the file:', err);
                res.status(500).send('Ошибка при загрузке файла.');
            }
        });
    } else {
        res.status(404).send('ZIP-файл не найден.');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
