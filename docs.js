/**
 * @swagger
 * /register:
 *   post:
 *     summary: Створити новий елемент інвентаря
 *     responses:
 *       201:
 *         description: Елемент створено
 *       400:
 *         description: Некоректні дані запиту
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Отримати список усіх елементів інвентаря
 *     responses:
 *       200:
 *         description: Успішна відповідь
 */

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Отримати елемент інвентаря за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Знайдений елемент
 *       404:
 *         description: Не знайдено
 */

/**
 * @swagger
 * /inventory/{id}/photo:
 *   get:
 *     summary: Отримати фото для елемента інвентаря
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Фото успішно відправлено
 *       404:
 *         description: Фото або елемент не знайдено
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Пошук елемента за ID з можливістю додати посилання на фото
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: includePhoto
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Результат пошуку
 *       404:
 *         description: Елемент не знайдено
 */